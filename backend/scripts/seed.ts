import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.model';
import StudentProfile from '../src/models/StudentProfile.model';
import TeacherProfile from '../src/models/TeacherProfile.model';
import Department from '../src/models/Department.model';
import Subject from '../src/models/Subject.model';
import Timetable from '../src/models/Timetable.model';
import Attendance from '../src/models/Attendance.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance_system';

const ACTIVE_SEMESTERS = [1, 3, 5, 7] as const;

type SubjectDef = { name: string; code: string; semester: number; credits: number };

const CS_SUBJECTS: SubjectDef[] = [
  { name: 'Programming Fundamentals', code: 'CS101', semester: 1, credits: 4 },
  { name: 'Engineering Mathematics I', code: 'CS102', semester: 1, credits: 4 },
  { name: 'Digital Logic Design', code: 'CS103', semester: 1, credits: 3 },
  { name: 'Object Oriented Programming', code: 'CS201', semester: 3, credits: 4 },
  { name: 'Discrete Mathematics', code: 'CS202', semester: 3, credits: 3 },
  { name: 'Computer Organization', code: 'CS203', semester: 3, credits: 4 },
  { name: 'Data Structures', code: 'CS501', semester: 5, credits: 4 },
  { name: 'Algorithms', code: 'CS502', semester: 5, credits: 3 },
  { name: 'Database Management Systems', code: 'CS503', semester: 5, credits: 4 },
  { name: 'Operating Systems', code: 'CS504', semester: 5, credits: 3 },
  { name: 'Computer Networks', code: 'CS505', semester: 5, credits: 3 },
  { name: 'DSA Lab', code: 'CS506L', semester: 5, credits: 2 },
  { name: 'Machine Learning', code: 'CS701', semester: 7, credits: 4 },
  { name: 'Distributed Systems', code: 'CS702', semester: 7, credits: 3 },
  { name: 'Cloud Computing', code: 'CS703', semester: 7, credits: 3 },
];

const IT_SUBJECTS: SubjectDef[] = [
  { name: 'IT Fundamentals', code: 'IT101', semester: 1, credits: 3 },
  { name: 'Web Technologies', code: 'IT301', semester: 3, credits: 4 },
  { name: 'Software Engineering', code: 'IT501', semester: 5, credits: 4 },
  { name: 'Cyber Security', code: 'IT701', semester: 7, credits: 3 },
];

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB. Seeding...');

  await Promise.all([
    User.deleteMany({}),
    StudentProfile.deleteMany({}),
    TeacherProfile.deleteMany({}),
    Department.deleteMany({}),
    Subject.deleteMany({}),
    Timetable.deleteMany({}),
    Attendance.deleteMany({}),
  ]);
  console.log('Cleared existing data.');

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
  console.log(`${depts.length} departments created`);

  const csId = depts[0]._id;
  const itId = depts[1]._id;

  const csSubjects = await Subject.insertMany(
    CS_SUBJECTS.map((s) => ({ ...s, departmentId: csId }))
  );
  const itSubjects = await Subject.insertMany(
    IT_SUBJECTS.map((s) => ({ ...s, departmentId: itId }))
  );
  const allSubjects = [...csSubjects, ...itSubjects];
  console.log(`${allSubjects.length} subjects created (semesters 1, 3, 5, 7)`);

  const subjectsBySemester = (semester: number, deptId: mongoose.Types.ObjectId) =>
    allSubjects.filter(
      (s) => s.semester === semester && s.departmentId.toString() === deptId.toString()
    );

  await User.create({
    userId: 'ADMIN001',
    fullName: 'Minsu Agrahari',
    email: 'admin@sams.edu',
    password: 'Admin@123',
    role: 'admin',
    isActive: true,
  });
  console.log('Admin created: ADMIN001');

  const teacherDefs = [
    { userId: 'TCH001', fullName: 'Minsu Agrahari', email: 'minsu@sams.edu', employeeId: 'EMP001', dept: csId, codes: ['CS101', 'CS102'] },
    { userId: 'TCH002', fullName: 'Dr. Priya Nambiar', email: 'priya.t@sams.edu', employeeId: 'EMP002', dept: csId, codes: ['CS103', 'CS201'] },
    { userId: 'TCH003', fullName: 'Dr. Raj Kumar', email: 'raj@sams.edu', employeeId: 'EMP003', dept: csId, codes: ['CS202', 'CS203'] },
    { userId: 'TCH004', fullName: 'Prof. Anita Sharma', email: 'anita@sams.edu', employeeId: 'EMP004', dept: csId, codes: ['CS501', 'CS502'] },
    { userId: 'TCH005', fullName: 'Dr. Suresh Kumar', email: 'suresh@sams.edu', employeeId: 'EMP005', dept: csId, codes: ['CS503', 'CS504'] },
    { userId: 'TCH006', fullName: 'Prof. Rahul Singh', email: 'rahul@sams.edu', employeeId: 'EMP006', dept: csId, codes: ['CS505', 'CS506L'] },
    { userId: 'TCH007', fullName: 'Dr. Kavita Menon', email: 'kavita@sams.edu', employeeId: 'EMP007', dept: csId, codes: ['CS701', 'CS702'] },
    { userId: 'TCH008', fullName: 'Prof. Arun Pillai', email: 'arun@sams.edu', employeeId: 'EMP008', dept: csId, codes: ['CS703'] },
    { userId: 'TCH009', fullName: 'Dr. Neha Gupta', email: 'neha.t@sams.edu', employeeId: 'EMP009', dept: itId, codes: ['IT101', 'IT301'] },
    { userId: 'TCH010', fullName: 'Prof. Vikram Desai', email: 'vikram@sams.edu', employeeId: 'EMP010', dept: itId, codes: ['IT501'] },
    { userId: 'TCH011', fullName: 'Dr. Sunita Rao', email: 'sunita@sams.edu', employeeId: 'EMP011', dept: itId, codes: ['IT701'] },
    { userId: 'TCH012', fullName: 'Prof. Deepak Joshi', email: 'deepak@sams.edu', employeeId: 'EMP012', dept: csId, codes: ['CS201', 'CS501'] },
  ];

  const subjectByCode = new Map(allSubjects.map((s) => [s.code, s]));
  const teachers: Array<{ user: { _id: mongoose.Types.ObjectId }; profile: { _id: mongoose.Types.ObjectId } }> = [];

  for (const t of teacherDefs) {
    const user = await User.create({
      userId: t.userId,
      fullName: t.fullName,
      email: t.email,
      password: 'Teacher@123',
      role: 'teacher',
      isActive: true,
    });
    const subjectIds = t.codes.map((c) => subjectByCode.get(c)!._id);
    const profile = await TeacherProfile.create({
      userId: user._id,
      employeeId: t.employeeId,
      departments: [t.dept],
      subjects: subjectIds,
    });
    teachers.push({ user, profile });
  }
  console.log(`${teachers.length} teachers created across semesters 1, 3, 5, 7`);

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

  const students: Array<{
    user: { _id: mongoose.Types.ObjectId };
    profile: { semester: number; section: string };
  }> = [];

  for (let i = 0; i < 50; i++) {
    const semester = ACTIVE_SEMESTERS[i % ACTIVE_SEMESTERS.length];
    const section = i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C';
    const rollNo = `CS2021${String(i + 1).padStart(3, '0')}`;
    const userId = `STU${String(i + 1).padStart(3, '0')}`;
    const user = await User.create({
      userId,
      fullName: studentNames[i],
      email: `${userId.toLowerCase()}@sams.edu`,
      password: 'Student@123',
      role: 'student',
      isActive: true,
    });
    const profile = await StudentProfile.create({
      userId: user._id,
      rollNumber: rollNo,
      departmentId: csId,
      semester,
      section,
    });
    students.push({ user, profile: { semester, section } });
  }

  const semCounts = ACTIVE_SEMESTERS.map(
    (s) => `${s}: ${students.filter((st) => st.profile.semester === s).length}`
  );
  console.log(`50 students created — ${semCounts.join(', ')}`);

  const teacherBySubject = new Map<string, mongoose.Types.ObjectId>();
  teacherDefs.forEach((t, idx) => {
    const teacherUser = teachers[idx]?.user;
    if (!teacherUser) return;
    for (const code of t.codes) {
      const sub = subjectByCode.get(code);
      if (sub) teacherBySubject.set(sub._id.toString(), teacherUser._id);
    }
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
  const timetableEntries: Array<{
    departmentId: mongoose.Types.ObjectId;
    semester: number;
    section: string;
    day: string;
    startTime: string;
    endTime: string;
    subjectId: mongoose.Types.ObjectId;
    teacherId: mongoose.Types.ObjectId;
    roomNo: string;
    isPublished: boolean;
  }> = [];

  for (const semester of ACTIVE_SEMESTERS) {
    const semSubjects = subjectsBySemester(semester, csId);
    const cohortStudents = students.filter((s) => s.profile.semester === semester);
    const sections = [...new Set(cohortStudents.map((s) => s.profile.section))];

    for (const section of sections) {
      semSubjects.forEach((sub, idx) => {
        const teacherId =
          teacherBySubject.get(sub._id.toString()) ?? teachers[0].user._id;
        const day = days[idx % days.length];
        timetableEntries.push({
          departmentId: csId,
          semester,
          section,
          day,
          startTime: `${9 + (idx % 4)}:00`,
          endTime: `${10 + (idx % 4)}:00`,
          subjectId: sub._id,
          teacherId,
          roomNo: `${300 + idx}`,
          isPublished: true,
        });
      });
    }
  }

  const insertedTimetables = await Timetable.insertMany(timetableEntries);
  console.log(`${insertedTimetables.length} timetable entries created`);

  let attendanceCount = 0;
  for (let d = 29; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    date.setHours(0, 0, 0, 0);
    const dayName = date.toLocaleDateString('en', { weekday: 'long' });
    if (dayName === 'Sunday') continue;

    const daySlots = insertedTimetables.filter((t) => t.day === dayName);
    for (const slot of daySlots) {
      const cohort = students.filter(
        (s) =>
          s.profile.semester === slot.semester && s.profile.section === slot.section
      );
      for (const student of cohort) {
        const rand = Math.random();
        const status = rand < 0.78 ? 'present' : rand < 0.9 ? 'absent' : 'late';
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
        } catch {
          /* skip duplicates */
        }
      }
    }
  }
  console.log(`${attendanceCount} attendance records generated`);

  console.log('\nSeed completed successfully!');
  console.log('-----------------------------------');
  console.log('Admin   -> ADMIN001 | Admin@123');
  console.log('Teacher -> TCH001   | Teacher@123');
  console.log('Student -> STU001   | Student@123 (sem 1)');
  console.log('Student -> STU002   | Student@123 (sem 3)');
  console.log('Student -> STU003   | Student@123 (sem 5)');
  console.log('Student -> STU004   | Student@123 (sem 7)');
  console.log('Filter admin pages by Semester 1, 3, 5, or 7');
  console.log('-----------------------------------');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
