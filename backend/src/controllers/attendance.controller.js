const AttendanceSession = require('../models/AttendanceSession.model');
const AttendanceRecord = require('../models/AttendanceRecord.model');
const Subject = require('../models/Subject.model');
const User = require('../models/User.model');
const socketService = require('../services/socket.service');

// Generate random 4-digit code
const generateSessionCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// @desc    Start Attendance Session
// @route   POST /api/attendance/session/start
// @access  Private (Teacher)
exports.startSession = async (req, res, next) => {
  try {
    const { subjectId, year, semester } = req.body;
    const teacherId = req.user._id;

    console.log('📝 Start Session Request:', { subjectId, year, semester, teacherId });

    // 1. Check if there's ALREADY an active session for this subject
    // This prevents the "400 Bad Request" error if a session wasn't closed properly
    const existingSession = await AttendanceSession.findOne({
      subject: subjectId,
      isActive: true,
      isExpired: false
    });

    if (existingSession) {
      console.log('♻️ Found existing active session. Returning it...');
      await existingSession.populate('subject', 'name code');

      return res.status(200).json({
        success: true,
        message: 'Active session retrieved',
        session: {
          id: existingSession._id.toString(),
          sessionCode: existingSession.sessionCode,
          subject: existingSession.subject,
          startTime: existingSession.startTime,
          expiryTime: existingSession.expiryTime,
          year: existingSession.year,
          semester: existingSession.semester
        }
      });
    }

    // 2. Validate subject if no existing session
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

    // 3. Generate unique session code
    let sessionCode;
    let isUnique = false;
    
    while (!isUnique) {
      sessionCode = Math.floor(1000 + Math.random() * 9000).toString();
      const existing = await AttendanceSession.findOne({ 
        sessionCode, 
        isActive: true 
      });
      if (!existing) isUnique = true;
    }

    // 4. Calculate expiry time (10 minutes from now)
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

    // 5. Create new session
    const session = await AttendanceSession.create({
      teacher: teacherId,
      subject: subjectId,
      sessionCode,
      year,
      semester,
      expiryTime
    });

    await session.populate('subject', 'name code');

    res.status(201).json({
      success: true,
      message: 'Attendance session started',
      session: {
        id: session._id.toString(),
        sessionCode: session.sessionCode,
        subject: session.subject,
        startTime: session.startTime,
        expiryTime: session.expiryTime,
        year: session.year,
        semester: session.semester
      }
    });
  } catch (error) {
    console.error('❌ Error in startSession:', error);
    next(error);
  }
};

// @desc    Get Active Session for Teacher
// @route   GET /api/attendance/session/active/:subjectId
// @access  Private (Teacher)
exports.getActiveSession = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const teacherId = req.user._id;

    const session = await AttendanceSession.findOne({
      teacher: teacherId,
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

    // Check if session is expired
    if (new Date() > session.expiryTime) {
      session.isExpired = true;
      session.isActive = false;
      await session.save();

      return res.status(400).json({
        success: false,
        message: 'Session has expired'
      });
    }

    res.status(200).json({
      success: true,
      session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End Attendance Session
// @route   POST /api/attendance/session/end/:sessionId
// @access  Private (Teacher)
exports.endSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.user._id;

    const session = await AttendanceSession.findOne({
      _id: sessionId,
      teacher: teacherId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.isActive = false;
    session.isExpired = true;
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Session ended successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Live Attendance for Session
// @route   GET /api/attendance/session/:sessionId/live
// @access  Private (Teacher)
exports.getLiveAttendance = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.user._id;

    const session = await AttendanceSession.findOne({
      _id: sessionId,
      teacher: teacherId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const records = await AttendanceRecord.find({ session: sessionId })
      .populate('student', 'name rollNumber')
      .sort('-markedAt');

    res.status(200).json({
      success: true,
      count: records.length,
      records: records.map(r => ({
        studentName: r.student.name,
        rollNumber: r.student.rollNumber,
        markedAt: r.markedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Attendance History (Teacher)
// @route   GET /api/attendance/history/teacher
// @access  Private (Teacher)
exports.getTeacherAttendanceHistory = async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const { subjectId, startDate, endDate, year, semester } = req.query;

    let query = { teacher: teacherId };

    if (subjectId) query.subject = subjectId;
    if (year) query.year = parseInt(year);
    if (semester) query.semester = parseInt(semester);
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const sessions = await AttendanceSession.find(query)
      .populate('subject', 'name code')
      .sort('-startTime')
      .limit(100);

    const sessionsWithCounts = await Promise.all(
      sessions.map(async (session) => {
        const count = await AttendanceRecord.countDocuments({ 
          session: session._id 
        });
        return {
          id: session._id,
          subject: session.subject,
          startTime: session.startTime,
          expiryTime: session.expiryTime,
          isActive: session.isActive,
          isExpired: session.isExpired,
          totalPresent: count,
          year: session.year,
          semester: session.semester
        };
      })
    );

    res.status(200).json({
      success: true,
      count: sessionsWithCounts.length,
      sessions: sessionsWithCounts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Attendance Statistics (Teacher)
// @route   GET /api/attendance/stats/subject/:subjectId
// @access  Private (Teacher)
exports.getSubjectStats = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const teacherId = req.user._id;

    const totalSessions = await AttendanceSession.countDocuments({
      teacher: teacherId,
      subject: subjectId,
      isExpired: true
    });

    const records = await AttendanceRecord.find({ subject: subjectId })
      .populate('student', 'name rollNumber');

    const studentAttendance = {};
    records.forEach(record => {
      const studentId = record.student._id.toString();
      if (!studentAttendance[studentId]) {
        studentAttendance[studentId] = {
          name: record.student.name,
          rollNumber: record.student.rollNumber,
          present: 0
        };
      }
      studentAttendance[studentId].present += 1;
    });

    const studentStats = Object.values(studentAttendance).map(student => ({
      ...student,
      total: totalSessions,
      percentage: totalSessions > 0 
        ? ((student.present / totalSessions) * 100).toFixed(2)
        : 0
    }));

    res.status(200).json({
      success: true,
      totalSessions,
      totalStudents: studentStats.length,
      studentStats
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------------------------
// STUDENT CONTROLLERS
// ----------------------------------------------------------------------

// @desc    Get Active Sessions for Student
// @route   GET /api/attendance/sessions/active
// @access  Private (Student)
exports.getActiveSessionsForStudent = async (req, res, next) => {
  try {
    const { year, semester } = req.user; // Assuming user model has year/sem

    const sessions = await AttendanceSession.find({
      year,
      semester,
      isActive: true,
      isExpired: false,
      expiryTime: { $gt: new Date() }
    }).populate('subject', 'name code').populate('teacher', 'name');

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark Attendance
// @route   POST /api/attendance/mark
// @access  Private (Student)
exports.markAttendance = async (req, res, next) => {
  try {
    const { sessionCode } = req.body;
    const studentId = req.user._id;

    // 1. Find the session
    const session = await AttendanceSession.findOne({
      sessionCode,
      isActive: true,
      isExpired: false
    }).populate('subject');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired session code'
      });
    }

    // 2. Check if expired
    if (new Date() > session.expiryTime) {
      session.isExpired = true;
      session.isActive = false;
      await session.save();
      return res.status(400).json({
        success: false,
        message: 'Session has expired'
      });
    }

    // 3. Check if already marked
    const existingRecord = await AttendanceRecord.findOne({
      student: studentId,
      session: session._id
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'You have already marked attendance for this session'
      });
    }

    // 4. Create Record
    const record = await AttendanceRecord.create({
      student: studentId,
      session: session._id,
      subject: session.subject._id,
      markedAt: new Date()
    });

    // Populate for response/socket
    await record.populate('student', 'name rollNumber');

    // 5. Update session count (optional, can be calculated dynamically)
    // session.totalPresent += 1; 
    // await session.save();

    // 6. Emit Socket Event
    if (socketService) {
        socketService.emitAttendanceMarked(session._id.toString(), {
            studentName: record.student.name,
            rollNumber: record.student.rollNumber,
            markedAt: record.markedAt
        });
    }

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      record: {
        subject: session.subject.name,
        markedAt: record.markedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Student Attendance History
// @route   GET /api/attendance/history/student
// @access  Private (Student)
exports.getStudentAttendanceHistory = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { subjectId } = req.query;

    let query = { student: studentId };
    if (subjectId) query.subject = subjectId;

    const records = await AttendanceRecord.find(query)
      .populate('subject', 'name code')
      .populate('session', 'startTime')
      .sort('-markedAt')
      .limit(100);

    res.status(200).json({
      success: true,
      count: records.length,
      records: records.map(r => ({
        id: r._id,
        subject: r.subject,
        markedAt: r.markedAt,
        sessionDate: r.session ? r.session.startTime : null
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Student Attendance Statistics
// @route   GET /api/attendance/stats/student
// @access  Private (Student)
exports.getStudentStats = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const student = req.user;

    const subjects = await Subject.find({
      year: student.year,
      semester: student.semester,
      isActive: true
    });

    const subjectStats = await Promise.all(
      subjects.map(async (subject) => {
        const totalSessions = await AttendanceSession.countDocuments({
          subject: subject._id,
          isExpired: true
        });

        const attendedSessions = await AttendanceRecord.countDocuments({
          student: studentId,
          subject: subject._id
        });

        return {
          subject: {
            id: subject._id,
            name: subject.name,
            code: subject.code
          },
          attended: attendedSessions,
          total: totalSessions,
          percentage: totalSessions > 0
            ? ((attendedSessions / totalSessions) * 100).toFixed(2)
            : 0
        };
      })
    );

    const totalAttended = subjectStats.reduce((sum, s) => sum + s.attended, 0);
    const totalSessions = subjectStats.reduce((sum, s) => sum + s.total, 0);
    const overallPercentage = totalSessions > 0
      ? ((totalAttended / totalSessions) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      overall: {
        attended: totalAttended,
        total: totalSessions,
        percentage: overallPercentage
      },
      subjectStats
    });
  } catch (error) {
    next(error);
  }
};