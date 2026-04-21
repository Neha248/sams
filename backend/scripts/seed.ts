import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.model';
import StudentProfile from '../src/models/StudentProfile.model';
import TeacherProfile from '../src/models/TeacherProfile.model';
import Department from '../src/models/Department.model';
import Subject from '../src/models/Subject.model';
import Timetable from '../src/models/Timetable.model';
import Attendance from '../src/models/Attendance.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance_system';

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('🌱 Connected to MongoDB. Seeding...');

  // Clear existing
  await Promise.all([
    User.deleteMany({}), StudentProfile.deleteMany({}),
    TeacherProfile.deleteMany({}), Department.deleteMany({}),
    Subject.deleteMany({}), Timetable.deleteMany({}),
    Attendance.deleteMany({}),
  ]);
  console.log('🧹 Cleared existing data.');

  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10');

  // Departments
  const depts = await Department.insertMany([
    { name: 'Computer Science', code: 'CS' },
    { name: 'Information Technology', code: 'IT' },
    { name: 'Electronics & Communication', code: 'ECE' },
    { name: 'Mechanical Engineering', code: 'ME' },
    { name: 'Electrical Engineering', code: 'EE' },
    { name: 'Civil Engineering', code: 'CE' },
    { name: 'Biotechnology', code: 'BIO' },
    { name: 'Master of Computer Applications', code: 'MCA' },
  ]);
  console.log(`✅ ${depts.length} Departments created`);

  const csId = depts[0]._id;

  // Subjects
  const subjects = await Subject.insertMany([
    { name: 'Data Structures', code: 'CS501', departmentId: csId, semester: 5, credits: 4 },
    { name: 'Algorithms', code: 'CS502', departmentId: csId, semester: 5, credits: 3 },
    { name: 'Database Management Systems', code: 'CS503', departmentId: csId, semester: 5, credits: 4 },
    { name: 'Operating Systems', code: 'CS504', departmentId: csId, semester: 5, credits: 3 },
    { name: 'Computer Networks', code: 'CS505', departmentId: csId, semester: 5, credits: 3 },
    { name: 'DSA Lab', code: 'CS506L', departmentId: csId, semester: 5, credits: 2 },
  ]);
  console.log(`✅ ${subjects.length} Subjects created`);

  // Admin
  const adminUser = await User.create({
    userId: 'ADMIN001',
    fullName: 'Minsu Agrahari',
    email: 'admin@sams.edu',
    password: 'Admin@123',
    role: 'admin',
    isActive: true,
  });
  console.log(`✅ Admin created: ${adminUser.userId}`);

  // Teachers
  const teacherData = [
    { userId: 'TCH001', fullName: 'Minsu Agrahari', email: 'minsu@sams.edu', employeeId: 'EMP001', subjects: [subjects[0]._id, subjects[1]._id] },
    { userId: 'TCH002', fullName: 'Dr. Raj Kumar', email: 'raj@sams.edu', employeeId: 'EMP002', subjects: [subjects[1]._id] },
    { userId: 'TCH003', fullName: 'Prof. Anita Sharma', email: 'anita@sams.edu', employeeId: 'EMP003', subjects: [subjects[2]._id] },
    { userId: 'TCH004', fullName: 'Dr. Suresh Kumar', email: 'suresh@sams.edu', employeeId: 'EMP004', subjects: [subjects[3]._id] },
    { userId: 'TCH005', fullName: 'Prof. Rahul Singh', email: 'rahul@sams.edu', employeeId: 'EMP005', subjects: [subjects[4]._id] },
  ];

  const teachers = [];
  for (const t of teacherData) {
    const user = await User.create({
      userId: t.userId, fullName: t.fullName, email: t.email,
      password: 'Teacher@123', role: 'teacher', isActive: true,
    });
    const profile = await TeacherProfile.create({
      userId: user._id, employeeId: t.employeeId,
      departments: [csId], subjects: t.subjects,
    });
    teachers.push({ user, profile });
  }
  console.log(`✅ ${teachers.length} Teachers created`);

  // Students
  const studentNames = [
    'Anjali Sharma', 'Rohan Verma', 'Priya Singh', 'Amit Kumar', 'Sneha Patel',
    'Vikram Rao', 'Kavya Nair', 'Mohamed Irfan', 'Divya Menon', 'Sahil Gupta',
    'Riya Joshi', 'Karan Mehta', 'Pooja Reddy', 'Arjun Pillai', 'Neha Agarwal',
    'Siddharth Mishra', 'Tanvi Choudhary', 'Yash Srivastava', 'Meera Iyer', 'Dev Sharma',
    'Lavanya Krishnan', 'Aditya Pandey', 'Swati Tiwari', 'Rahul Dubey', 'Nisha Kapoor',
    'Vivek Yadav', 'Ritu Bajaj', 'Harsh Gupta', 'Simran Kaur', 'Manish Patel',
    'Ananya Bose', 'Rohit Nair', 'Preeti Jain', 'Gaurav Singh', 'Deepika Rao',
    'Nikhil Kumar', 'Shweta Mishra', 'Pranav Thakur', 'Aditi Sharma', 'Rajesh Verma',
    'Monika Rathore', 'Sumit Arora', 'Nandini Pillai', 'Akash Joshi', 'Ishaan Bansal',
    'Kratika Kushwaha', 'Mohit Pandey', 'Shruti Tyagi', 'Varun Chaturvedi', 'Zoya Khan',
  ];

  const students = [];
  for (let i = 0; i < 50; i++) {
    const rollNo = `CS2021${String(i + 1).padStart(3, '0')}`;
    const userId = `STU${String(i + 1).padStart(3, '0')}`;
    const section = i < 17 ? 'A' : i < 34 ? 'B' : 'C';
    const user = await User.create({
      userId, fullName: studentNames[i],
      email: `${userId.toLowerCase()}@sams.edu`,
      password: 'Student@123', role: 'student', isActive: true,
    });
    const profile = await StudentProfile.create({
      userId: user._id, rollNumber: rollNo,
      departmentId: csId, semester: 5, section,
    });
    students.push({ user, profile });
  }
  console.log(`✅ ${students.length} Students created`);

  // Timetable (CS, Sem 5, Section A)
  const teacher1 = teachers[0].user._id;
  const teacher2 = teachers[1].user._id;
  const teacher3 = teachers[2].user._id;
  const teacher4 = teachers[3].user._id;
  const teacher5 = teachers[4].user._id;

  const timetableEntries = [
    { departmentId: csId, semester: 5, section: 'A', day: 'Monday', startTime: '09:00', endTime: '10:00', subjectId: subjects[0]._id, teacherId: teacher1, roomNo: '301' },
    { departmentId: csId, semester: 5, section: 'A', day: 'Monday', startTime: '10:00', endTime: '11:00', subjectId: subjects[1]._id, teacherId: teacher2, roomNo: '205' },
    { departmentId: csId, semester: 5, section: 'A', day: 'Tuesday', startTime: '09:00', endTime: '10:00', subjectId: subjects[3]._id, teacherId: teacher4, roomNo: '401' },
    { departmentId: csId, semester: 5, section: 'A', day: 'Tuesday', startTime: '11:00', endTime: '12:00', subjectId: subjects[4]._id, teacherId: teacher5, roomNo: '305' },
    { departmentId: csId, semester: 5, section: 'A', day: 'Wednesday', startTime: '09:00', endTime: '10:00', subjectId: subjects[0]._id, teacherId: teacher1, roomNo: '301' },
    { departmentId: csId, semester: 5, section: 'A', day: 'Wednesday', startTime: '14:00', endTime: '16:00', subjectId: subjects[5]._id, teacherId: teacher1, roomNo: 'Lab-1' },
    { departmentId: csId, semester: 5, section: 'A', day: 'Thursday', startTime: '10:00', endTime: '11:00', subjectId: subjects[1]._id, teacherId: teacher2, roomNo: '205' },
    { departmentId: csId, semester: 5, section: 'A', day: 'Thursday', startTime: '14:00', endTime: '15:00', subjectId: subjects[2]._id, teacherId: teacher3, roomNo: '102' },
    { departmentId: csId, semester: 5, section: 'A', day: 'Friday', startTime: '09:00', endTime: '11:00', subjectId: subjects[4]._id, teacherId: teacher5, roomNo: '305' },
    { departmentId: csId, semester: 5, section: 'A', day: 'Friday', startTime: '14:00', endTime: '15:00', subjectId: subjects[3]._id, teacherId: teacher4, roomNo: '401' },
  ];

  const timetables = await Timetable.insertMany(timetableEntries.map(e => ({ ...e, isPublished: true })));
  console.log(`✅ ${timetables.length} Timetable entries created`);

  // Generate attendance records (last 30 days for Section A)
  const sectionAStudents = students.slice(0, 17);
  let attendanceCount = 0;
  for (let d = 29; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    date.setHours(0, 0, 0, 0);
    const dayName = date.toLocaleDateString('en', { weekday: 'long' });
    if (dayName === 'Sunday') continue;

    const dayTimetables = timetables.filter((t) => t.day === dayName);
    for (const slot of dayTimetables) {
      for (const student of sectionAStudents) {
        const rand = Math.random();
        const status = rand < 0.78 ? 'present' : rand < 0.90 ? 'absent' : 'late';
        try {
          await Attendance.create({
            studentId: student.user._id,
            subjectId: slot.subjectId,
            teacherId: slot.teacherId,
            timetableId: slot._id,
            date,
            status,
          });
          attendanceCount++;
        } catch { /* skip duplicates */ }
      }
    }
  }
  console.log(`✅ ${attendanceCount} Attendance records generated`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin   → userId: ADMIN001 | password: Admin@123');
  console.log('Teacher → userId: TCH001   | password: Teacher@123');
  console.log('Student → userId: STU001   | password: Student@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
