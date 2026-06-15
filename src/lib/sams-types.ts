export type UserRole = "admin" | "teacher" | "student"

export type AttendanceStatus = "present" | "absent" | "late"

export type AppSection =
	| "login"
	| "admin-dashboard"
	| "admin-students"
	| "admin-teachers"
	| "admin-timetable"
	| "admin-notifications"
	| "student-dashboard"
	| "student-attendance"
	| "student-timetable"
	| "student-notifications"
	| "teacher-dashboard"
	| "teacher-attendance"
	| "teacher-analysis"
	| "teacher-notifications"

export type AppUser = {
	id: string
	userId: string
	fullName: string
	email: string
	role: UserRole
}

export type Department = {
	id: string
	name: string
	code: string
}

export type Subject = {
	id: string
	name: string
	code: string
	departmentId: string
	departmentName: string
	departmentCode: string
	semester: number
	credits: number
}

export type StudentProfile = {
	profileId: string
	userId: string
	loginId: string
	fullName: string
	email: string
	rollNumber: string
	departmentId: string
	departmentName: string
	departmentCode: string
	semester: number
	section: string
	phone: string
	isActive: boolean
}

export type TeacherProfile = {
	profileId: string
	userId: string
	loginId: string
	fullName: string
	email: string
	employeeId: string
	departments: Department[]
	subjects: Subject[]
	phone: string
	isActive: boolean
}

export type TimetableSlot = {
	id: string
	uid: string
	teacherId: string
	teacherName: string
	teacherUid: string
	subjectId: string
	subjectName: string
	subjectCode: string
	departmentId: string
	departmentName: string
	departmentCode: string
	section: string
	semester: number
	day: string
	startTime: string
	endTime: string
	timing: string
	roomNo: string
	isPublished: boolean
}

export type AttendanceRecord = {
	id: string
	studentId: string
	studentName: string
	rollNumber: string
	subjectId: string
	subjectName: string
	subjectCode: string
	teacherId: string
	teacherName: string
	timetableId: string
	date: string
	status: AttendanceStatus
	remarks: string
	createdAt: string
	updatedAt: string
	updatedByName: string
	departmentId: string
	departmentName: string
	semester: number
	section: string
}

export type AttendanceCounts = {
	present: number
	absent: number
	late: number
	total: number
}

export type StudentSubjectAttendance = AttendanceCounts & {
	subjectId: string
	subjectName: string
	subjectCode: string
	lateAsAbsent: number
	effectiveAbsent: number
	remainingLate: number
	percentage: number
	isSafe: boolean
	classesNeeded: number
	upcomingClassesNextWeek: number
	canReachSafeZone: boolean
	suggestion: string
}

export type StudentAttendanceOverview = {
	profileId: string
	studentUserId: string
	uniNo: string
	name: string
	email: string
	semester: number
	section: string
	department: Department
	subjects: Array<{
		subjectId: string
		subjectName: string
		subjectCode: string
		present: number
		absent: number
		late: number
		total: number
	}>
	totals: AttendanceCounts
}

export type AdminDashboard = {
	totalStudents: number
	totalTeachers: number
	totalDepartments: number
	totalClassesConducted: number
	todayPresent: number
	todayAbsent: number
	todayLate: number
}

export type FacultyAttendanceRow = {
	teacherProfileId: string
	teacherUserId: string
	teacherName: string
	teacherEmail: string
	subjectId: string
	subjectName: string
	subjectCode: string
	departmentId: string
	presentCount: number
	absentCount: number
	lateCount: number
	totalRecords: number
}

export type TeacherAssignmentRow = {
	rowId: string
	profileId: string
	uniqueId: string
	loginId: string
	teacherName: string
	email: string
	assignedAt: string
	subjectName: string
	subjectCode: string
	departmentName: string
	departmentCode: string
	departmentId: string
	semester: number
}

export type NotificationItem = {
	id: string
	title: string
	message: string
	priority: "low" | "normal" | "high"
	targetType: "all" | "student" | "teacher" | "department"
	targetId: string
	sentAt: string
	createdBy: string
	isRead: boolean
}

export type TeacherClassItem = {
	id: string
	subject: string
	dept: string
	section: string
	semester: number
	classTiming: string
	status: "pending" | "complete"
}

export type TeacherDashboard = {
	date: string
	time: string
	totalAssignedClasses: number
	totalClassesToTake: number
	totalClassesCompleted: number
	classes: TeacherClassItem[]
}

export type TeacherAnalyticsRow = {
	studentId: string
	universityRoll: string
	classRoll: string
	studentName: string
	subjectId: string
	subjectName: string
	subjectCode: string
	departmentId: string
	semester: number
	section: string
	status: AttendanceStatus
	date: string
	percentage: number
}

export type RosterStudent = {
	studentId: string
	universityRoll: string
	classRoll: string
	studentName: string
	status: AttendanceStatus
	remarks: string
	hasSavedRecord: boolean
	updatedAt: string
	updatedByName: string
}

export type RosterResult = {
	timetableId: string
	subjectId: string
	date: string
	slotLabel: string
	existingRecords: number
	lastEditedAt: string
	lastEditedByName: string
	students: RosterStudent[]
}

export type AppSnapshot = {
	user: AppUser
	catalogs: {
		departments: Department[]
		subjects: Subject[]
		students: StudentProfile[]
		teachers: TeacherProfile[]
		semesters: number[]
		sections: string[]
	}
	admin?: {
		dashboard: AdminDashboard
		students: StudentAttendanceOverview[]
		studentChart: { present: number; absent: number; late: number }
		teachers: TeacherAssignmentRow[]
		timetable: TimetableSlot[]
		facultyAttendance: FacultyAttendanceRow[]
		notifications: NotificationItem[]
	}
	student?: {
		profile: StudentProfile
		summary: AttendanceCounts & {
			lateAsAbsent: number
			effectiveAbsent: number
			remainingLate: number
			percentage: number
			classesNeeded: number
		}
		attendanceRules: {
			safeZonePerSubject: number
			lateToAbsentRatio: number
			description: string
		}
		subjectWise: StudentSubjectAttendance[]
		subjectSafeSummary: {
			totalSubjects: number
			safeSubjects: number
			unsafeSubjects: StudentSubjectAttendance[]
		}
		isSafe: boolean
		hasUnsafeSubjects: boolean
		attendance: AttendanceRecord[]
		timetable: TimetableSlot[]
		notifications: NotificationItem[]
	}
	teacher?: {
		profile: TeacherProfile
		dashboard: TeacherDashboard
		timetable: TimetableSlot[]
		analytics: TeacherAnalyticsRow[]
		notifications: NotificationItem[]
	}
}

export type CreateStudentInput = {
	fullName: string
	userId: string
	email: string
	password: string
	rollNumber: string
	departmentId: string
	semester: number
	section: string
	phone?: string
}

export type CreateTeacherInput = {
	fullName: string
	userId: string
	email: string
	password: string
	employeeId: string
	departmentIds: string[]
	subjectIds: string[]
	phone?: string
}

export type TimetableInput = {
	id?: string
	departmentId: string
	semester: number
	section: string
	day: string
	startTime: string
	endTime: string
	subjectId: string
	teacherId: string
	roomNo: string
	isPublished: boolean
}

export type NotificationInput = {
	title: string
	message: string
	priority: "low" | "normal" | "high"
	targetType: "all" | "student" | "teacher" | "department"
	targetId?: string
}

export type RosterInput = {
	departmentId: string
	semester: number
	section: string
	subjectId: string
	timetableId?: string
	date: string
}

export type SubmitAttendanceInput = RosterInput & {
	students: Array<{
		studentId: string
		status: AttendanceStatus
		remarks?: string
	}>
}
