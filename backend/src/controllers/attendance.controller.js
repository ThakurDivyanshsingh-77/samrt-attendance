const mongoose = require('mongoose');
const AttendanceSession = require('../models/AttendanceSession.model');
const AttendanceRecord = require('../models/AttendanceRecord.model');
const Subject = require('../models/Subject.model');
const socketService = require('../services/socket.service');

// ===============================
// UTILS
// ===============================
const generateSessionCode = () =>
  Math.floor(1000 + Math.random() * 9000).toString();

// ===============================
// START SESSION (TEACHER)
// ===============================
const startSession = async (req, res, next) => {
  try {
    const { subjectId, year, semester } = req.body;
    const teacherId = req.user._id;

    if (!subjectId || !year || !semester) {
      return res.status(400).json({
        success: false,
        message: 'subjectId, year and semester are required'
      });
    }

    const subject = await Subject.findOne({
      _id: subjectId,
      year,
      semester,
      isActive: true
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // 🔒 CHECK ACTIVE SESSION
    const existingSession = await AttendanceSession.findOne({
      subject: subjectId,
      isActive: true,
      isExpired: false
    }).populate('subject', 'name code');

    if (existingSession) {
      return res.status(200).json({
        success: true,
        message: 'Attendance session already running',
        sessionId: existingSession._id,
        sessionCode: existingSession.sessionCode,
        expiryTime: existingSession.expiryTime,
        subject: existingSession.subject
      });
    }

    // 🔑 UNIQUE 4-DIGIT CODE
    let sessionCode;
    while (true) {
      sessionCode = generateSessionCode();
      const exists = await AttendanceSession.exists({
        sessionCode,
        isActive: true
      });
      if (!exists) break;
    }

    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

    const session = await AttendanceSession.create({
      teacher: teacherId,
      subject: subjectId,
      year,
      semester,
      sessionCode,
      expiryTime,
      isActive: true,
      isExpired: false,
      totalPresent: 0
    });

    await session.populate('subject', 'name code');

    res.status(201).json({
      success: true,
      message: 'Attendance session started',
      sessionId: session._id,
      sessionCode: session.sessionCode,
      expiryTime: session.expiryTime,
      subject: session.subject
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// GET ACTIVE SESSION (TEACHER)
// ===============================
const getActiveSession = async (req, res, next) => {
  try {
    const { subjectId } = req.params;

    const session = await AttendanceSession.findOne({
      subject: subjectId,
      isActive: true,
      isExpired: false
    }).populate('subject', 'name code');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session found'
      });
    }

    if (new Date() > session.expiryTime) {
      session.isActive = false;
      session.isExpired = true;
      await session.save();

      return res.status(400).json({
        success: false,
        message: 'Session expired'
      });
    }

    res.json({ success: true, session });
  } catch (error) {
    next(error);
  }
};

// ===============================
// END SESSION (TEACHER)
// ===============================
const endSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID'
      });
    }

    const session = await AttendanceSession.findOneAndUpdate(
      { _id: sessionId, teacher: req.user._id },
      { isActive: false, isExpired: true },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      message: 'Session ended successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// MARK ATTENDANCE (STUDENT)
// ===============================
const markAttendance = async (req, res, next) => {
  try {
    const { sessionCode } = req.body;
    const studentId = req.user._id;

    const session = await AttendanceSession.findOne({
      sessionCode,
      isActive: true,
      isExpired: false
    }).populate('subject');

    if (!session || new Date() > session.expiryTime) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired session code'
      });
    }

    const alreadyMarked = await AttendanceRecord.exists({
      student: studentId,
      session: session._id
    });

    if (alreadyMarked) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked'
      });
    }

    const record = await AttendanceRecord.create({
      student: studentId,
      session: session._id,
      subject: session.subject._id
    });

    await AttendanceSession.findByIdAndUpdate(session._id, {
      $inc: { totalPresent: 1 }
    });

    // 🔥 LIVE SOCKET UPDATE
    socketService.emitAttendanceMarked(session._id.toString(), {
      studentId,
      markedAt: record.markedAt
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// LIVE ATTENDANCE (TEACHER)
// ===============================
const getLiveAttendance = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID'
      });
    }

    const records = await AttendanceRecord.find({ session: sessionId })
      .populate('student', 'name rollNumber')
      .sort('-markedAt');

    res.json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// TEACHER HISTORY
// ===============================
const getTeacherAttendanceHistory = async (req, res, next) => {
  try {
    const sessions = await AttendanceSession.find({
      teacher: req.user._id
    })
      .populate('subject', 'name code')
      .sort('-createdAt');

    res.json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// SUBJECT STATS
// ===============================
const getSubjectStats = async (req, res, next) => {
  try {
    const { subjectId } = req.params;

    const totalSessions = await AttendanceSession.countDocuments({
      subject: subjectId,
      isExpired: true
    });

    const totalAttendance = await AttendanceRecord.countDocuments({
      subject: subjectId
    });

    res.json({
      success: true,
      totalSessions,
      totalAttendance
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// STUDENT HISTORY
// ===============================
const getStudentAttendanceHistory = async (req, res, next) => {
  try {
    const records = await AttendanceRecord.find({
      student: req.user._id
    })
      .populate('subject', 'name code')
      .populate('session', 'sessionCode')
      .sort('-markedAt');

    res.json({
      success: true,
      records
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// STUDENT STATS
// ===============================
const getStudentStats = async (req, res, next) => {
  try {
    const total = await AttendanceRecord.countDocuments({
      student: req.user._id
    });

    res.json({
      success: true,
      totalAttendance: total
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// EXPORTS (VERY IMPORTANT)
// ===============================
module.exports = {
  startSession,
  getActiveSession,
  endSession,
  markAttendance,
  getLiveAttendance,
  getTeacherAttendanceHistory,
  getSubjectStats,
  getStudentAttendanceHistory,
  getStudentStats
};
