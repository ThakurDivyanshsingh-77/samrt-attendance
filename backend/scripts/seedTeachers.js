require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../src/models/User.model');

const teachers = [
  {
    name: 'Dr. John Smith',
    email: 'divaysnh@gamil.com',
    password: 'teacher123',
    role: 'teacher'
  },
  {
    name: 'Prof. Emily Johnson',
    email: 'teacher@gamil.com',
    password: 'teacher123',
    role: 'teacher'
  }
];

async function seedTeachers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // ⚠️ insertMany MAT use karo
    for (const teacher of teachers) {
      await User.create(teacher); // ✅ pre-save hook chalega
      console.log(`✅ Teacher created: ${teacher.email}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seedTeachers();
