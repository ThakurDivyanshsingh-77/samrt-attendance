const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller.js');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, subjectController.getSubjects);
router.get('/all', protect, subjectController.getAllSubjects);
router.get('/:id', protect, subjectController.getSubject);

module.exports = router;
