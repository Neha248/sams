import bcrypt from "bcryptjs"
import type { Database } from "sql.js"

type RunSql = (
	db: Database,
	sql: string,
	params?: Array<string | number | null>,
) => void

const activeSemesters = [1, 3, 5, 7] as const

type SubjectSeed = {
	name: string
	code: string
	semester: number
	credits: number
}

const csSubjects: SubjectSeed[] = [
	{ name: "Programming Fundamentals", code: "CS101", semester: 1, credits: 4 },
	{ name: "Engineering Mathematics I", code: "CS102", semester: 1, credits: 4 },
	{ name: "Digital Logic Design", code: "CS103", semester: 1, credits: 3 },
	{
		name: "Object Oriented Programming",
		code: "CS201",
		semester: 3,
		credits: 4,
	},
	{ name: "Discrete Mathematics", code: "CS202", semester: 3, credits: 3 },
	{ name: "Computer Organization", code: "CS203", semester: 3, credits: 4 },
	{ name: "Data Structures", code: "CS501", semester: 5, credits: 4 },
	{ name: "Algorithms", code: "CS502", semester: 5, credits: 3 },
	{
		name: "Database Management Systems",
		code: "CS503",
		semester: 5,
		credits: 4,
	},
	{ name: "Operating Systems", code: "CS504", semester: 5, credits: 3 },
	{ name: "Computer Networks", code: "CS505", semester: 5, credits: 3 },
	{ name: "DSA Lab", code: "CS506L", semester: 5, credits: 2 },
	{ name: "Machine Learning", code: "CS701", semester: 7, credits: 4 },
	{ name: "Distributed Systems", code: "CS702", semester: 7, credits: 3 },
	{ name: "Cloud Computing", code: "CS703", semester: 7, credits: 3 },
]

const itSubjects: SubjectSeed[] = [
	{ name: "IT Fundamentals", code: "IT101", semester: 1, credits: 3 },
	{ name: "Web Technologies", code: "IT301", semester: 3, credits: 4 },
	{ name: "Software Engineering", code: "IT501", semester: 5, credits: 4 },
	{ name: "Cyber Security", code: "IT701", semester: 7, credits: 3 },
]

const departments = [
	{ id: "dept_cs", name: "Computer Science", code: "CS" },
	{ id: "dept_it", name: "Information Technology", code: "IT" },
	{ id: "dept_ece", name: "Electronics & Communication", code: "ECE" },
	{ id: "dept_me", name: "Mechanical Engineering", code: "ME" },
	{ id: "dept_ee", name: "Electrical Engineering", code: "EE" },
	{ id: "dept_ce", name: "Civil Engineering", code: "CE" },
	{ id: "dept_bio", name: "Biotechnology", code: "BIO" },
	{ id: "dept_mca", name: "Master of Computer Applications", code: "MCA" },
]

const teacherDefs = [
	{
		userId: "TCH001",
		fullName: "Amit Patel",
		email: "amit@sams.edu",
		employeeId: "EMP001",
		dept: "dept_cs",
		codes: ["CS101", "CS102"],
	},
	{
		userId: "TCH002",
		fullName: "Dr. Priya Nambiar",
		email: "priya.t@sams.edu",
		employeeId: "EMP002",
		dept: "dept_cs",
		codes: ["CS103", "CS201"],
	},
	{
		userId: "TCH003",
		fullName: "Dr. Raj Kumar",
		email: "raj@sams.edu",
		employeeId: "EMP003",
		dept: "dept_cs",
		codes: ["CS202", "CS203"],
	},
	{
		userId: "TCH004",
		fullName: "Prof. Anita Sharma",
		email: "anita@sams.edu",
		employeeId: "EMP004",
		dept: "dept_cs",
		codes: ["CS501", "CS502"],
	},
	{
		userId: "TCH005",
		fullName: "Dr. Suresh Kumar",
		email: "suresh@sams.edu",
		employeeId: "EMP005",
		dept: "dept_cs",
		codes: ["CS503", "CS504"],
	},
	{
		userId: "TCH006",
		fullName: "Prof. Rahul Singh",
		email: "rahul@sams.edu",
		employeeId: "EMP006",
		dept: "dept_cs",
		codes: ["CS505", "CS506L"],
	},
	{
		userId: "TCH007",
		fullName: "Dr. Kavita Menon",
		email: "kavita@sams.edu",
		employeeId: "EMP007",
		dept: "dept_cs",
		codes: ["CS701", "CS702"],
	},
	{
		userId: "TCH008",
		fullName: "Prof. Arun Pillai",
		email: "arun@sams.edu",
		employeeId: "EMP008",
		dept: "dept_cs",
		codes: ["CS703"],
	},
	{
		userId: "TCH009",
		fullName: "Dr. Neha Gupta",
		email: "neha.t@sams.edu",
		employeeId: "EMP009",
		dept: "dept_it",
		codes: ["IT101", "IT301"],
	},
	{
		userId: "TCH010",
		fullName: "Prof. Vikram Desai",
		email: "vikram@sams.edu",
		employeeId: "EMP010",
		dept: "dept_it",
		codes: ["IT501"],
	},
	{
		userId: "TCH011",
		fullName: "Dr. Sunita Rao",
		email: "sunita@sams.edu",
		employeeId: "EMP011",
		dept: "dept_it",
		codes: ["IT701"],
	},
	{
		userId: "TCH012",
		fullName: "Prof. Deepak Joshi",
		email: "deepak@sams.edu",
		employeeId: "EMP012",
		dept: "dept_cs",
		codes: ["CS201", "CS501"],
	},
]

const studentNames = [
	"Anjali Sharma",
	"Rohan Verma",
	"Priya Singh",
	"Amit Kumar",
	"Sneha Patel",
	"Vikram Rao",
	"Kavya Nair",
	"Mohamed Irfan",
	"Divya Menon",
	"Sahil Gupta",
	"Riya Joshi",
	"Karan Mehta",
	"Pooja Reddy",
	"Arjun Pillai",
	"Neha Agarwal",
	"Siddharth Mishra",
	"Tanvi Choudhary",
	"Yash Srivastava",
	"Meera Iyer",
	"Dev Sharma",
	"Lavanya Krishnan",
	"Aditya Pandey",
	"Swati Tiwari",
	"Rahul Dubey",
	"Nisha Kapoor",
	"Vivek Yadav",
	"Ritu Bajaj",
	"Harsh Gupta",
	"Simran Kaur",
	"Manish Patel",
	"Ananya Bose",
	"Rohit Nair",
	"Preeti Jain",
	"Gaurav Singh",
	"Deepika Rao",
	"Nikhil Kumar",
	"Shweta Mishra",
	"Pranav Thakur",
	"Aditi Sharma",
	"Rajesh Verma",
	"Monika Rathore",
	"Sumit Arora",
	"Nandini Pillai",
	"Akash Joshi",
	"Ishaan Bansal",
	"Kratika Kushwaha",
	"Mohit Pandey",
	"Shruti Tyagi",
	"Varun Chaturvedi",
	"Zoya Khan",
]

const weekdays = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
] as const

const timeSlots = [
	{ start: "09:00", end: "10:00" },
	{ start: "10:00", end: "11:00" },
	{ start: "11:00", end: "12:00" },
	{ start: "12:00", end: "13:00" },
	{ start: "13:00", end: "14:00" },
	{ start: "14:00", end: "15:00" },
	{ start: "15:00", end: "16:00" },
]

function userDbId(loginId: string) {
	return `user_${loginId.toLowerCase()}`
}

function subjectDbId(code: string) {
	return `sub_${code.toLowerCase()}`
}

function profileDbId(loginId: string) {
	return `profile_${loginId.toLowerCase()}`
}

function dateIso(date: Date) {
	return date.toISOString().slice(0, 10)
}

function weekdayName(date: Date) {
	return date.toLocaleDateString("en-US", { weekday: "long" })
}

export function seedDatabase(db: Database, runSql: RunSql) {
	const now = new Date().toISOString()
	const adminPassword = bcrypt.hashSync("Admin@123", 10)
	const teacherPassword = bcrypt.hashSync("Teacher@123", 10)
	const studentPassword = bcrypt.hashSync("Student@123", 10)

	for (const department of departments) {
		runSql(db, "insert into departments (id, name, code) values (?, ?, ?)", [
			department.id,
			department.name,
			department.code,
		])
	}

	for (const subject of csSubjects) {
		runSql(
			db,
			"insert into subjects (id, name, code, department_id, semester, credits) values (?, ?, ?, ?, ?, ?)",
			[
				subjectDbId(subject.code),
				subject.name,
				subject.code,
				"dept_cs",
				subject.semester,
				subject.credits,
			],
		)
	}

	for (const subject of itSubjects) {
		runSql(
			db,
			"insert into subjects (id, name, code, department_id, semester, credits) values (?, ?, ?, ?, ?, ?)",
			[
				subjectDbId(subject.code),
				subject.name,
				subject.code,
				"dept_it",
				subject.semester,
				subject.credits,
			],
		)
	}

	runSql(
		db,
		"insert into users (id, login_id, full_name, email, password_hash, role, is_active, created_at) values (?, ?, ?, ?, ?, ?, 1, ?)",
		[
			userDbId("ADMIN001"),
			"ADMIN001",
			"Marcus Hale",
			"admin@sams.edu",
			adminPassword,
			"admin",
			now,
		],
	)

	for (const teacher of teacherDefs) {
		const teacherUserId = userDbId(teacher.userId)
		const profileId = profileDbId(teacher.userId)
		runSql(
			db,
			"insert into users (id, login_id, full_name, email, password_hash, role, is_active, created_at) values (?, ?, ?, ?, ?, 'teacher', 1, ?)",
			[
				teacherUserId,
				teacher.userId,
				teacher.fullName,
				teacher.email,
				teacherPassword,
				now,
			],
		)
		runSql(
			db,
			"insert into teacher_profiles (id, user_id, employee_id, phone, created_at) values (?, ?, ?, '', ?)",
			[profileId, teacherUserId, teacher.employeeId, now],
		)
		runSql(
			db,
			"insert into teacher_departments (profile_id, department_id) values (?, ?)",
			[profileId, teacher.dept],
		)
		for (const code of teacher.codes) {
			runSql(
				db,
				"insert into teacher_subjects (profile_id, subject_id) values (?, ?)",
				[profileId, subjectDbId(code)],
			)
		}
	}

	const students: Array<{
		userId: string
		semester: number
		section: string
		index: number
	}> = []

	for (let index = 0; index < studentNames.length; index += 1) {
		const number = String(index + 1).padStart(3, "0")
		const loginId = `STU${number}`
		const dbUserId = userDbId(loginId)
		const semester = activeSemesters[index % activeSemesters.length]
		const section = index % 3 === 0 ? "A" : index % 3 === 1 ? "B" : "C"
		runSql(
			db,
			"insert into users (id, login_id, full_name, email, password_hash, role, is_active, created_at) values (?, ?, ?, ?, ?, 'student', 1, ?)",
			[
				dbUserId,
				loginId,
				studentNames[index],
				`${loginId.toLowerCase()}@sams.edu`,
				studentPassword,
				now,
			],
		)
		runSql(
			db,
			"insert into student_profiles (id, user_id, roll_number, department_id, semester, section, phone, created_at) values (?, ?, ?, 'dept_cs', ?, ?, '', ?)",
			[
				profileDbId(loginId),
				dbUserId,
				`CS2021${number}`,
				semester,
				section,
				now,
			],
		)
		students.push({ userId: dbUserId, semester, section, index })
	}

	const teacherBySubject = new Map<string, string>()
	for (const teacher of teacherDefs) {
		for (const code of teacher.codes) {
			teacherBySubject.set(subjectDbId(code), userDbId(teacher.userId))
		}
	}

	const timetableIds: Array<{
		id: string
		semester: number
		section: string
		day: string
		subjectId: string
		teacherId: string
	}> = []

	for (const semester of activeSemesters) {
		const semesterSubjects = csSubjects.filter(
			(subject) => subject.semester === semester,
		)
		for (const section of ["A", "B", "C"]) {
			weekdays.forEach((day, dayIndex) => {
				timeSlots.forEach((slot, slotIndex) => {
					const subject =
						semesterSubjects[(dayIndex + slotIndex) % semesterSubjects.length]
					if (!subject) return
					const subjectId = subjectDbId(subject.code)
					const teacherId =
						teacherBySubject.get(subjectId) ?? userDbId("TCH001")
					const id = `tt_${semester}_${section.toLowerCase()}_${day.toLowerCase()}_${slotIndex + 1}`
					runSql(
						db,
						"insert into timetable (id, department_id, semester, section, day, start_time, end_time, subject_id, teacher_id, room_no, is_published) values (?, 'dept_cs', ?, ?, ?, ?, ?, ?, ?, ?, 1)",
						[
							id,
							semester,
							section,
							day,
							slot.start,
							slot.end,
							subjectId,
							teacherId,
							`${300 + slotIndex}${dayIndex}`,
						],
					)
					timetableIds.push({
						id,
						semester,
						section,
						day,
						subjectId,
						teacherId,
					})
				})
			})
		}
	}

	let attendanceCounter = 0
	for (let offset = 29; offset >= 0; offset -= 1) {
		const date = new Date()
		date.setDate(date.getDate() - offset)
		const day = weekdayName(date)
		if (day === "Sunday") continue

		const daySlots = timetableIds.filter((slot) => slot.day === day)
		for (const slot of daySlots) {
			const cohort = students.filter(
				(student) =>
					student.semester === slot.semester &&
					student.section === slot.section,
			)
			for (const student of cohort) {
				const bucket =
					(student.index + offset + attendanceCounter + slot.semester) % 10
				const status = bucket < 6 ? "present" : bucket < 8 ? "absent" : "late"
				const dateValue = dateIso(date)
				runSql(
					db,
					"insert or ignore into attendance (id, student_id, subject_id, teacher_id, timetable_id, date, status, remarks, created_at) values (?, ?, ?, ?, ?, ?, ?, '', ?)",
					[
						`att_${dateValue}_${slot.id}_${student.userId}`,
						student.userId,
						slot.subjectId,
						slot.teacherId,
						slot.id,
						dateValue,
						status,
						now,
					],
				)
				attendanceCounter += 1
			}
		}
	}

	runSql(
		db,
		"insert into notifications (id, title, message, priority, target_type, target_id, sent_at, created_by, is_draft) values (?, ?, ?, 'normal', 'all', '', ?, ?, 0)",
		[
			"notif_welcome",
			"Welcome to SAMS",
			"Seed data is ready. Admin, teacher, and student workflows are active.",
			now,
			userDbId("ADMIN001"),
		],
	)
	runSql(
		db,
		"insert into notifications (id, title, message, priority, target_type, target_id, sent_at, created_by, is_draft) values (?, ?, ?, 'high', 'department', 'dept_cs', ?, ?, 0)",
		[
			"notif_cs_safe_zone",
			"75 percent attendance rule",
			"Computer Science students should review subject-wise safe zone alerts before the next timetable cycle.",
			now,
			userDbId("ADMIN001"),
		],
	)
}
