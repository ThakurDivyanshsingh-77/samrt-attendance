
const Subject = require('../models/Subject.model');

// @desc    Get Subjects by Year and Semester
// @route   GET /api/subjects?year=1&semester=1
// @access  Private
exports.getSubjects = async (req, res, next) => {
  try {
    const { year, semester } = req.query;

    let query = { isActive: true };

    if (year) query.year = parseInt(year);
    if (semester) query.semester = parseInt(semester);

    const subjects = await Subject.find(query)
      .sort('name')
      .select('name code year semester credits');

    res.status(200).json({
      success: true,
      count: subjects.length,
      subjects
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Subjects (for admin purposes)
// @route   GET /api/subjects/all
// @access  Private
exports.getAllSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find({ isActive: true })
      .sort('year semester name');

    res.status(200).json({
      success: true,
      count: subjects.length,
      subjects
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Single Subject
// @route   GET /api/subjects/:id
// @access  Private
exports.getSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.status(200).json({
      success: true,
      subject
    });
  } catch (error) {
    next(error);
  }
};