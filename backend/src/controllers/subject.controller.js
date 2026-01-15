const Subject = require('../models/Subject.model');

// @desc    Get Subjects by Year and Semester
// @route   GET /api/subjects?year=1&semester=1
// @access  Private
exports.getSubjects = async (req, res, next) => {
  try {
    // 🔥 IMPORTANT: Disable browser / proxy cache
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });

    const { year, semester } = req.query;

    let query = {};

    // year & semester filter
    if (year) query.year = Number(year);
    if (semester) query.semester = Number(semester);

    // allow both old & new records
    // isActive === false → exclude
    query.isActive = { $ne: false };

    const subjects = await Subject.find(query)
      .sort('name')
      .select('name code year semester credits');

    return res.status(200).json({
      success: true,
      count: subjects.length,
      subjects
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get All Subjects (Admin)
// @route   GET /api/subjects/all
// @access  Private
exports.getAllSubjects = async (req, res, next) => {
  try {
    res.set({ 'Cache-Control': 'no-store' });

    const subjects = await Subject.find({
      isActive: { $ne: false }
    }).sort('year semester name');

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
    res.set({ 'Cache-Control': 'no-store' });

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
