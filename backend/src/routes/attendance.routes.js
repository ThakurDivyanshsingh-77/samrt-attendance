const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const {
  startSession,
  getActiveSession,
  endSession,
  markAttendance,
  getLiveAttendance,
  getTeacherAttendanceHistory,
  getSubjectStats,
  getStudentAttendanceHistory,
  getStudentStats
} = require('../controllers/attendance.controller');

const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { attendanceLimiter } = require('../middleware/rateLimiter.middleware');

// ===== TEACHER =====
router.post(
  '/session/start',
  protect,
  authorize('teacher'),
  [
    body('subjectId').notEmpty(),
    body('year').isInt({ min: 1, max: 3 }),
    body('semester').isInt({ min: 1, max: 6 })
  ],
  startSession
);

router.get(
  '/session/active/:subjectId',
  protect,
  authorize('teacher'),
  getActiveSession
);

router.post(
  '/session/end/:sessionId',
  protect,
  authorize('teacher'),
  endSession
);

router.get(
  '/session/:sessionId/live',
  protect,
  authorize('teacher'),
  getLiveAttendance
);

router.get(
  '/history/teacher',
  protect,
  authorize('teacher'),
  getTeacherAttendanceHistory
);

router.get(
  '/stats/subject/:subjectId',
  protect,
  authorize('teacher'),
  getSubjectStats
);

// ===== STUDENT =====
router.post(
  '/mark',
  protect,
  authorize('student'),
  attendanceLimiter,
  [body('sessionCode').isLength({ min: 4, max: 4 })],
  markAttendance
);

router.get(
  '/history/student',
  protect,
  authorize('student'),
  getStudentAttendanceHistory
);

router.get(
  '/stats/student',
  protect,
  authorize('student'),
  getStudentStats
);

module.exports = router;
