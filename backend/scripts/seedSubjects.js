require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Subject = require('../src/models/Subject.model');

const subjects = [
  {
    name: 'Data Structures',
    code: 'BCA301',
    year: 2,
    semester: 3
  },
  {
    name: 'Operating System',
    code: 'BCA302',
    year: 2,
    semester: 3
  },
  {
    name: 'Database Management System',
    code: 'BCA303',
    year: 2,
    semester: 3
  }
];

async function seedSubjects() {
  try {
    console.log('MONGODB_URI =', process.env.MONGODB_URI);

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Optional: clear old subjects
    await Subject.deleteMany({});
    console.log('🗑️ Old subjects cleared');

    for (const subject of subjects) {
      await Subject.create(subject);
      console.log(`✅ Subject created: ${subject.code}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding subjects:', err.message);
    process.exit(1);
  }
}

seedSubjects();
