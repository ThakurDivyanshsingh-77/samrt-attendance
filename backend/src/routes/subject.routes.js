
const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');
const { protect } = require('../middleware/auth.middleware');

// Get subjects with filters
router.get('/', protect, subjectController.getSubjects);

// Get all subjects
router.get('/all', protect, subjectController.getAllSubjects);

// Get single subject
router.get('/:id', protect, subjectController.getSubject);

module.exports = router;