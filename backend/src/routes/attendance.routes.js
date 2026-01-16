
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const attendanceController = require('../controllers/attendance.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { attendanceLimiter } = require('../middleware/rateLimiter.middleware');

// Teacher routes
router.post(
  '/session/start',
  protect,
  authorize('teacher'),
  [
    body('subjectId').notEmpty().withMessage('Subject ID is required'),
    body('year').isInt({ min: 1, max: 3 }).withMessage('Year must be 1, 2, or 3'),
    body('semester').isInt({ min: 1, max: 6 }).withMessage('Semester must be between 1 and 6')
  ],
  attendanceController.startSession
);

router.get(
  '/session/active/:subjectId',
  protect,
  authorize('teacher'),
  attendanceController.getActiveSession
);

router.post(
  '/session/end/:sessionId',
  protect,
  authorize('teacher'),
  attendanceController.endSession
);

router.get(
  '/session/:sessionId/live',
  protect,
  authorize('teacher'),
  attendanceController.getLiveAttendance
);

router.get(
  '/history/teacher',
  protect,
  authorize('teacher'),
  attendanceController.getTeacherAttendanceHistory
);

router.get(
  '/stats/subject/:subjectId',
  protect,
  authorize('teacher'),
  attendanceController.getSubjectStats
);

// Student routes
router.get(
  '/sessions/active',
  protect,
  authorize('student'),
  attendanceController.getActiveSessionsForStudent
);

router.post(
  '/mark',
  protect,
  authorize('student'),
  attendanceLimiter,
  [body('sessionCode').isLength({ min: 4, max: 4 }).withMessage('Session code must be 4 digits')],
  attendanceController.markAttendance
);

router.get(
  '/history/student',
  protect,
  authorize('student'),
  attendanceController.getStudentAttendanceHistory
);

router.get(
  '/stats/student',
  protect,
  authorize('student'),
  attendanceController.getStudentStats
);

module.exports = router;