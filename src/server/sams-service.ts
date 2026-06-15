import bcrypt from "bcryptjs"
import type { Database } from "sql.js"
import {
	allRows,
	firstRow,
	newId,
	readDb,
	runSql,
	todayIso,
	toIsoDate,
	writeDb,
} from "./sams-db"
import type {
	AdminDashboard,
	AppSnapshot,
	AppUser,
	AttendanceCounts,
	AttendanceRecord,
	AttendanceStatus,
	CreateStudentInput,
	CreateTeacherInput,
	Department,
	FacultyAttendanceRow,
	NotificationInput,
	NotificationItem,
	RosterInput,
	RosterResult,
	StudentAttendanceOverview,
	StudentProfile,
	StudentSubjectAttendance,
	Subject,
	SubmitAttendanceInput,
	TeacherAnalyticsRow,
	TeacherAssignmentRow,
	TeacherClassItem,
	TeacherDashboard,
	TeacherProfile,
	TimetableInput,
	TimetableSlot,
	UserRole,
} from "../lib/sams-types"

const safeZoneThreshold = 75
const lateToAbsentRatio = 2

type UserRow = {
	id: string
	login_id: string
	full_name: string
	email: string
	password_hash: string
	role: UserRole
	is_active: number
}

type CountRow = { count: number }

const dayRank = new Map(
	[
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
		"Sunday",
	].map((day, index) => [day, index]),
)

function requireValue(value: string | undefined, message: string) {
	if (!value?.trim()) throw new Error(message)
	return value.trim()
}

function normalizeSection(section: string) {
	return requireValue(section, "Section is required").toUpperCase()
}

function mapUser(row: UserRow): AppUser {
	return {
		id: row.id,
		userId: row.login_id,
		fullName: row.full_name,
		email: row.email,
		role: row.role,
	}
}

function userByToken(db: Database, token: string, roles?: UserRole[]) {
	const user = firstRow<UserRow>(
		db,
		`select users.*
		 from sessions
		 join users on users.id = sessions.user_id
		 where sessions.token = ? and sessions.expires_at > ? and users.is_active = 1`,
		[token, new Date().toISOString()],
	)
	if (!user) throw new Error("Session expired. Sign in again.")
	if (roles && !roles.includes(user.role)) {
		throw new Error("You do not have permission to perform this action.")
	}
	return mapUser(user)
}

function appCatalogs(db: Database) {
	const students = selectStudents(db)
	const teachers = selectTeachers(db)
	const subjects = selectSubjects(db)
	const semesters = Array.from(
		new Set([
			...subjects.map((subject) => subject.semester),
			...students.map((student) => student.semester),
		]),
	).sort((a, b) => a - b)
	const sections = Array.from(
		new Set(students.map((student) => student.section).filter(Boolean)),
	).sort()

	return {
		departments: selectDepartments(db),
		subjects,
		students,
		teachers,
		semesters,
		sections,
	}
}

function selectDepartments(db: Database): Department[] {
	return allRows<Department>(
		db,
		"select id, name, code from departments order by name",
	)
}

function selectSubjects(db: Database): Subject[] {
	return allRows<Subject>(
		db,
		`select
			subjects.id,
			subjects.name,
			subjects.code,
			subjects.department_id as departmentId,
			departments.name as departmentName,
			departments.code as departmentCode,
			subjects.semester,
			subjects.credits
		 from subjects
		 join departments on departments.id = subjects.department_id
		 order by departments.code, subjects.semester, subjects.code`,
	)
}

function selectStudents(db: Database): StudentProfile[] {
	return allRows<StudentProfile>(
		db,
		`select
			student_profiles.id as profileId,
			users.id as userId,
			users.login_id as loginId,
			users.full_name as fullName,
			users.email,
			student_profiles.roll_number as rollNumber,
			departments.id as departmentId,
			departments.name as departmentName,
			departments.code as departmentCode,
			student_profiles.semester,
			student_profiles.section,
			student_profiles.phone,
			users.is_active as isActive
		 from student_profiles
		 join users on users.id = student_profiles.user_id
		 join departments on departments.id = student_profiles.department_id
		 where users.is_active = 1
		 order by student_profiles.roll_number`,
	).map((student) => ({ ...student, isActive: Boolean(student.isActive) }))
}

function selectTeachers(db: Database): TeacherProfile[] {
	const rows = allRows<{
		profileId: string
		userId: string
		loginId: string
		fullName: string
		email: string
		employeeId: string
		phone: string
		isActive: number
	}>(
		db,
		`select
			teacher_profiles.id as profileId,
			users.id as userId,
			users.login_id as loginId,
			users.full_name as fullName,
			users.email,
			teacher_profiles.employee_id as employeeId,
			teacher_profiles.phone,
			users.is_active as isActive
		 from teacher_profiles
		 join users on users.id = teacher_profiles.user_id
		 where users.is_active = 1
		 order by users.full_name`,
	)
	const depts = allRows<{
		profileId: string
		id: string
		name: string
		code: string
	}>(
		db,
		`select
			teacher_departments.profile_id as profileId,
			departments.id,
			departments.name,
			departments.code
		 from teacher_departments
		 join departments on departments.id = teacher_departments.department_id`,
	)
	const subjects = allRows<Subject & { profileId: string }>(
		db,
		`select
			teacher_subjects.profile_id as profileId,
			subjects.id,
			subjects.name,
			subjects.code,
			subjects.department_id as departmentId,
			departments.name as departmentName,
			departments.code as departmentCode,
			subjects.semester,
			subjects.credits
		 from teacher_subjects
		 join subjects on subjects.id = teacher_subjects.subject_id
		 join departments on departments.id = subjects.department_id
		 order by subjects.semester, subjects.code`,
	)

	return rows.map((teacher) => ({
		...teacher,
		isActive: Boolean(teacher.isActive),
		departments: depts
			.filter((department) => department.profileId === teacher.profileId)
			.map(({ id, name, code }) => ({ id, name, code })),
		subjects: subjects
			.filter((subject) => subject.profileId === teacher.profileId)
			.map(({ profileId: _profileId, ...subject }) => subject),
	}))
}

function buildSlotUid(id: string) {
	return `TT-${id
		.replace(/[^a-z0-9]/gi, "")
		.slice(-6)
		.toUpperCase()}`
}

function selectTimetable(db: Database): TimetableSlot[] {
	const slots = allRows<TimetableSlot>(
		db,
		`select
			timetable.id,
			'' as uid,
			timetable.teacher_id as teacherId,
			teachers.full_name as teacherName,
			teachers.login_id as teacherUid,
			subjects.id as subjectId,
			subjects.name as subjectName,
			subjects.code as subjectCode,
			departments.id as departmentId,
			departments.name as departmentName,
			departments.code as departmentCode,
			timetable.section,
			timetable.semester,
			timetable.day,
			timetable.start_time as startTime,
			timetable.end_time as endTime,
			'' as timing,
			timetable.room_no as roomNo,
			timetable.is_published as isPublished
		 from timetable
		 join users teachers on teachers.id = timetable.teacher_id
		 join subjects on subjects.id = timetable.subject_id
		 join departments on departments.id = timetable.department_id`,
	)
	return slots
		.map((slot) => ({
			...slot,
			uid: buildSlotUid(slot.id),
			timing: `${slot.day} | ${slot.startTime}-${slot.endTime} | Room ${slot.roomNo}`,
			isPublished: Boolean(slot.isPublished),
		}))
		.sort((a, b) => {
			const dayCompare = (dayRank.get(a.day) ?? 99) - (dayRank.get(b.day) ?? 99)
			if (a.semester !== b.semester) return a.semester - b.semester
			if (a.section !== b.section) return a.section.localeCompare(b.section)
			if (dayCompare !== 0) return dayCompare
			return a.startTime.localeCompare(b.startTime)
		})
}

function selectAttendanceRecords(db: Database): AttendanceRecord[] {
	return allRows<AttendanceRecord>(
		db,
		`select
			attendance.id,
			student_users.id as studentId,
			student_users.full_name as studentName,
			student_profiles.roll_number as rollNumber,
			subjects.id as subjectId,
			subjects.name as subjectName,
			subjects.code as subjectCode,
			teacher_users.id as teacherId,
			teacher_users.full_name as teacherName,
			attendance.timetable_id as timetableId,
			attendance.date,
			attendance.status,
			attendance.remarks,
			attendance.created_at as createdAt,
			coalesce(nullif(attendance.updated_at, ''), attendance.created_at) as updatedAt,
			coalesce(editor_users.full_name, teacher_users.full_name) as updatedByName,
			departments.id as departmentId,
			departments.name as departmentName,
			student_profiles.semester,
			student_profiles.section
		 from attendance
		 join users student_users on student_users.id = attendance.student_id
		 join student_profiles on student_profiles.user_id = student_users.id
		 join subjects on subjects.id = attendance.subject_id
		 join departments on departments.id = student_profiles.department_id
		 join users teacher_users on teacher_users.id = attendance.teacher_id
		 left join users editor_users on editor_users.id = nullif(attendance.updated_by, '')
		 where student_users.is_active = 1
		 order by attendance.date desc, student_profiles.roll_number`,
	)
}

function applyLateToAbsentRule(counts: AttendanceCounts) {
	const lateAsAbsent = Math.floor(counts.late / lateToAbsentRatio)
	const effectiveAbsent = counts.absent + lateAsAbsent
	const remainingLate = counts.late % lateToAbsentRatio
	const percentage =
		counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0
	return { ...counts, lateAsAbsent, effectiveAbsent, remainingLate, percentage }
}

function classesNeededForSafeZone(present: number, total: number) {
	if (total <= 0 || present < 0) return 0
	if ((present / total) * 100 >= safeZoneThreshold) return 0
	return Math.ceil(
		((safeZoneThreshold / 100) * total - present) /
			(1 - safeZoneThreshold / 100),
	)
}

function buildSafeZoneSuggestion(
	subjectName: string,
	classesNeeded: number,
	upcomingClassesNextWeek: number,
) {
	if (classesNeeded <= 0) return `${subjectName} is already in the safe zone.`
	if (upcomingClassesNextWeek <= 0) {
		return `No classes for ${subjectName} are scheduled in the next 7 days. Check the timetable or contact the teacher.`
	}
	if (upcomingClassesNextWeek >= classesNeeded) {
		return `Attend at least ${classesNeeded} of the ${upcomingClassesNextWeek} scheduled class(es) for ${subjectName} this week to reach 75%.`
	}
	return `Attend all ${upcomingClassesNextWeek} scheduled class(es) for ${subjectName}; ${classesNeeded - upcomingClassesNextWeek} more present class(es) will still be needed later.`
}

function countUpcomingBySubject(slots: TimetableSlot[], daysAhead = 7) {
	const counts = new Map<string, number>()
	const today = new Date()
	for (let offset = 0; offset < daysAhead; offset += 1) {
		const date = new Date(today)
		date.setDate(today.getDate() + offset)
		const day = date.toLocaleDateString("en-US", { weekday: "long" })
		for (const slot of slots) {
			if (slot.day === day) {
				counts.set(slot.subjectId, (counts.get(slot.subjectId) ?? 0) + 1)
			}
		}
	}
	return counts
}

function groupStudentSubjectAttendance(
	records: AttendanceRecord[],
	upcomingBySubject = new Map<string, number>(),
): StudentSubjectAttendance[] {
	const grouped = new Map<string, StudentSubjectAttendance>()
	for (const record of records) {
		const existing =
			grouped.get(record.subjectId) ??
			({
				subjectId: record.subjectId,
				subjectName: record.subjectName,
				subjectCode: record.subjectCode,
				present: 0,
				absent: 0,
				late: 0,
				total: 0,
				lateAsAbsent: 0,
				effectiveAbsent: 0,
				remainingLate: 0,
				percentage: 0,
				isSafe: false,
				classesNeeded: 0,
				upcomingClassesNextWeek: 0,
				canReachSafeZone: false,
				suggestion: "",
			} satisfies StudentSubjectAttendance)
		existing[record.status] += 1
		existing.total += 1
		grouped.set(record.subjectId, existing)
	}
	return Array.from(grouped.values())
		.map((subject) => {
			const ruled = applyLateToAbsentRule(subject)
			const percentage =
				subject.total > 0
					? Math.round((subject.present / subject.total) * 1000) / 10
					: 0
			const classesNeeded = classesNeededForSafeZone(
				subject.present,
				subject.total,
			)
			const upcomingClassesNextWeek =
				upcomingBySubject.get(subject.subjectId) ?? 0
			return {
				...subject,
				lateAsAbsent: ruled.lateAsAbsent,
				effectiveAbsent: ruled.effectiveAbsent,
				remainingLate: ruled.remainingLate,
				percentage,
				isSafe: percentage >= safeZoneThreshold,
				classesNeeded,
				upcomingClassesNextWeek,
				canReachSafeZone:
					classesNeeded > 0 && upcomingClassesNextWeek >= classesNeeded,
				suggestion: buildSafeZoneSuggestion(
					subject.subjectName,
					classesNeeded,
					upcomingClassesNextWeek,
				),
			}
		})
		.sort((a, b) => a.subjectName.localeCompare(b.subjectName))
}

function buildStudentOverview(
	students: StudentProfile[],
	records: AttendanceRecord[],
) {
	const overviews: StudentAttendanceOverview[] = []
	const chart = { present: 0, absent: 0, late: 0 }

	for (const student of students) {
		const studentRecords = records.filter(
			(record) => record.studentId === student.userId,
		)
		const subjects = groupStudentSubjectAttendance(studentRecords).map(
			(subject) => ({
				subjectId: subject.subjectId,
				subjectName: subject.subjectName,
				subjectCode: subject.subjectCode,
				present: subject.present + subject.late,
				absent: subject.absent,
				late: subject.late,
				total: subject.total,
			}),
		)
		const totals = studentRecords.reduce<AttendanceCounts>(
			(acc, record) => {
				acc[record.status] += 1
				acc.total += 1
				return acc
			},
			{ present: 0, absent: 0, late: 0, total: 0 },
		)
		chart.present += totals.present
		chart.absent += totals.absent
		chart.late += totals.late
		overviews.push({
			profileId: student.profileId,
			studentUserId: student.userId,
			uniNo: student.rollNumber,
			name: student.fullName,
			email: student.email,
			semester: student.semester,
			section: student.section,
			department: {
				id: student.departmentId,
				name: student.departmentName,
				code: student.departmentCode,
			},
			subjects,
			totals,
		})
	}

	return { students: overviews, chart }
}

function buildFacultyAttendance(
	teachers: TeacherProfile[],
	records: AttendanceRecord[],
) {
	const rows: FacultyAttendanceRow[] = []
	for (const teacher of teachers) {
		for (const subject of teacher.subjects) {
			const subjectRecords = records.filter(
				(record) =>
					record.teacherId === teacher.userId &&
					record.subjectId === subject.id,
			)
			rows.push({
				teacherProfileId: teacher.profileId,
				teacherUserId: teacher.userId,
				teacherName: teacher.fullName,
				teacherEmail: teacher.email,
				subjectId: subject.id,
				subjectName: subject.name,
				subjectCode: subject.code,
				departmentId: subject.departmentId,
				presentCount: subjectRecords.filter(
					(record) => record.status === "present" || record.status === "late",
				).length,
				absentCount: subjectRecords.filter(
					(record) => record.status === "absent",
				).length,
				lateCount: subjectRecords.filter((record) => record.status === "late")
					.length,
				totalRecords: subjectRecords.length,
			})
		}
	}
	return rows.sort((a, b) => a.teacherName.localeCompare(b.teacherName))
}

function buildTeacherAssignments(teachers: TeacherProfile[]) {
	const assignments: TeacherAssignmentRow[] = []
	for (const teacher of teachers) {
		if (teacher.subjects.length === 0) {
			assignments.push({
				rowId: `${teacher.profileId}-none`,
				profileId: teacher.profileId,
				uniqueId: teacher.employeeId,
				loginId: teacher.loginId,
				teacherName: teacher.fullName,
				email: teacher.email,
				assignedAt: "",
				subjectName: "-",
				subjectCode: "-",
				departmentName: "-",
				departmentCode: "-",
				departmentId: "",
				semester: 0,
			})
			continue
		}
		for (const subject of teacher.subjects) {
			assignments.push({
				rowId: `${teacher.profileId}-${subject.id}`,
				profileId: teacher.profileId,
				uniqueId: teacher.employeeId,
				loginId: teacher.loginId,
				teacherName: teacher.fullName,
				email: teacher.email,
				assignedAt: "",
				subjectName: subject.name,
				subjectCode: subject.code,
				departmentName: `${subject.departmentName} (${subject.departmentCode})`,
				departmentCode: subject.departmentCode,
				departmentId: subject.departmentId,
				semester: subject.semester,
			})
		}
	}
	return assignments.sort((a, b) => {
		const byName = a.teacherName.localeCompare(b.teacherName)
		if (byName !== 0) return byName
		return a.subjectName.localeCompare(b.subjectName)
	})
}

function buildAdminDashboard(
	students: StudentProfile[],
	teachers: TeacherProfile[],
	departments: Department[],
	records: AttendanceRecord[],
): AdminDashboard {
	const today = todayIso()
	const todayRecords = records.filter((record) => record.date === today)
	return {
		totalStudents: students.length,
		totalTeachers: teachers.length,
		totalDepartments: departments.length,
		totalClassesConducted: new Set(records.map((record) => record.timetableId))
			.size,
		todayPresent: todayRecords.filter((record) => record.status === "present")
			.length,
		todayAbsent: todayRecords.filter((record) => record.status === "absent")
			.length,
		todayLate: todayRecords.filter((record) => record.status === "late").length,
	}
}

function formatDatePartsInIst() {
	const now = new Date()
	const date = new Intl.DateTimeFormat("en-GB", {
		timeZone: "Asia/Kolkata",
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(now)
	const time = `${new Intl.DateTimeFormat("en-US", {
		timeZone: "Asia/Kolkata",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).format(now)} IST`
	const day = new Intl.DateTimeFormat("en-US", {
		timeZone: "Asia/Kolkata",
		weekday: "long",
	}).format(now)
	return { date, time, day }
}

function buildTeacherDashboard(
	teacherId: string,
	timetable: TimetableSlot[],
	records: AttendanceRecord[],
): TeacherDashboard {
	const { date, time, day } = formatDatePartsInIst()
	const today = todayIso()
	const todayClasses = timetable.filter(
		(slot) => slot.teacherId === teacherId && slot.day === day,
	)
	const completedIds = new Set(
		records
			.filter(
				(record) =>
					record.teacherId === teacherId &&
					record.date === today &&
					todayClasses.some((slot) => slot.id === record.timetableId),
			)
			.map((record) => record.timetableId),
	)
	const classes: TeacherClassItem[] = todayClasses
		.map((slot) => ({
			id: slot.id,
			subject: `${slot.subjectName} (${slot.subjectCode})`,
			dept: `${slot.departmentName} (${slot.departmentCode})`,
			section: slot.section,
			semester: slot.semester,
			classTiming: `${slot.startTime}-${slot.endTime}`,
			status: completedIds.has(slot.id)
				? ("complete" as const)
				: ("pending" as const),
		}))
		.sort((a, b) => {
			if (a.status !== b.status) return a.status === "pending" ? -1 : 1
			return a.classTiming.localeCompare(b.classTiming)
		})

	return {
		date,
		time,
		totalAssignedClasses: todayClasses.length,
		totalClassesCompleted: completedIds.size,
		totalClassesToTake: Math.max(todayClasses.length - completedIds.size, 0),
		classes,
	}
}

function buildTeacherAnalytics(
	teacherId: string,
	records: AttendanceRecord[],
): TeacherAnalyticsRow[] {
	const teacherRecords = records.filter(
		(record) => record.teacherId === teacherId,
	)
	const groupCounts = new Map<string, { present: number; total: number }>()
	for (const record of teacherRecords) {
		const key = `${record.studentId}:${record.subjectId}`
		const group = groupCounts.get(key) ?? { present: 0, total: 0 }
		if (record.status === "present") group.present += 1
		group.total += 1
		groupCounts.set(key, group)
	}
	return teacherRecords.map((record) => {
		const group = groupCounts.get(
			`${record.studentId}:${record.subjectId}`,
		) ?? {
			present: 0,
			total: 0,
		}
		return {
			studentId: record.studentId,
			universityRoll: record.rollNumber,
			classRoll: `${record.section}-${record.rollNumber.slice(-2)}`,
			studentName: record.studentName,
			subjectId: record.subjectId,
			subjectName: record.subjectName,
			subjectCode: record.subjectCode,
			departmentId: record.departmentId,
			semester: record.semester,
			section: record.section,
			status: record.status,
			date: record.date,
			percentage:
				group.total > 0
					? Math.round((group.present / group.total) * 1000) / 10
					: 0,
		}
	})
}

function selectNotifications(db: Database, user: AppUser): NotificationItem[] {
	let departmentIds: string[] = []
	if (user.role === "student") {
		const student = firstRow<{ departmentId: string }>(
			db,
			"select department_id as departmentId from student_profiles where user_id = ?",
			[user.id],
		)
		departmentIds = student ? [student.departmentId] : []
	}
	if (user.role === "teacher") {
		departmentIds = allRows<{ departmentId: string }>(
			db,
			`select teacher_departments.department_id as departmentId
			 from teacher_departments
			 join teacher_profiles on teacher_profiles.id = teacher_departments.profile_id
			 where teacher_profiles.user_id = ?`,
			[user.id],
		).map((row) => row.departmentId)
	}

	const notifications = allRows<
		Omit<NotificationItem, "isRead"> & { isRead: number; is_draft?: number }
	>(
		db,
		`select
			notifications.id,
			notifications.title,
			notifications.message,
			notifications.priority,
			notifications.target_type as targetType,
			notifications.target_id as targetId,
			notifications.sent_at as sentAt,
			notifications.created_by as createdBy,
			case when notification_reads.user_id is null then 0 else 1 end as isRead
		 from notifications
		 left join notification_reads
			on notification_reads.notification_id = notifications.id
			and notification_reads.user_id = ?
		 where notifications.is_draft = 0
		 order by notifications.sent_at desc`,
		[user.id],
	)

	return notifications
		.filter((notification) => {
			if (user.role === "admin") return true
			if (notification.targetType === "all") return true
			if (
				notification.targetType === user.role &&
				notification.targetId === user.id
			) {
				return true
			}
			return (
				notification.targetType === "department" &&
				departmentIds.includes(notification.targetId)
			)
		})
		.map((notification) => ({
			...notification,
			isRead: Boolean(notification.isRead),
		}))
}

function buildStudentData(
	db: Database,
	user: AppUser,
	timetable: TimetableSlot[],
	records: AttendanceRecord[],
) {
	const profile = selectStudents(db).find(
		(student) => student.userId === user.id,
	)
	if (!profile) throw new Error("Student profile not found.")
	const studentRecords = records.filter(
		(record) => record.studentId === user.id,
	)
	const studentSlots = timetable.filter(
		(slot) =>
			slot.departmentId === profile.departmentId &&
			slot.semester === profile.semester &&
			slot.section === profile.section &&
			slot.isPublished,
	)
	const subjectWise = groupStudentSubjectAttendance(
		studentRecords,
		countUpcomingBySubject(studentSlots),
	)
	const summaryCounts = studentRecords.reduce<AttendanceCounts>(
		(acc, record) => {
			acc[record.status] += 1
			acc.total += 1
			return acc
		},
		{ present: 0, absent: 0, late: 0, total: 0 },
	)
	const summaryStats = applyLateToAbsentRule(summaryCounts)
	const classesNeeded = classesNeededForSafeZone(
		summaryStats.present,
		summaryStats.total,
	)
	const unsafeSubjects = subjectWise.filter((subject) => !subject.isSafe)
	return {
		profile,
		summary: { ...summaryStats, classesNeeded },
		attendanceRules: {
			safeZonePerSubject: safeZoneThreshold,
			lateToAbsentRatio,
			description:
				"Safe zone requires every subject at or above 75% (present divided by total). Every 2 late marks count as 1 absent for policy display.",
		},
		subjectWise,
		subjectSafeSummary: {
			totalSubjects: subjectWise.length,
			safeSubjects: subjectWise.filter((subject) => subject.isSafe).length,
			unsafeSubjects,
		},
		isSafe: subjectWise.length > 0 && unsafeSubjects.length === 0,
		hasUnsafeSubjects: unsafeSubjects.length > 0,
		attendance: studentRecords,
		timetable: studentSlots,
		notifications: selectNotifications(db, user),
	}
}

function buildSnapshotFromDb(db: Database, user: AppUser): AppSnapshot {
	const catalogs = appCatalogs(db)
	const records = selectAttendanceRecords(db)
	const timetable = selectTimetable(db)
	const snapshot: AppSnapshot = { user, catalogs }

	if (user.role === "admin") {
		const studentOverview = buildStudentOverview(catalogs.students, records)
		snapshot.admin = {
			dashboard: buildAdminDashboard(
				catalogs.students,
				catalogs.teachers,
				catalogs.departments,
				records,
			),
			students: studentOverview.students,
			studentChart: studentOverview.chart,
			teachers: buildTeacherAssignments(catalogs.teachers),
			timetable,
			facultyAttendance: buildFacultyAttendance(catalogs.teachers, records),
			notifications: selectNotifications(db, user),
		}
	}

	if (user.role === "student") {
		snapshot.student = buildStudentData(db, user, timetable, records)
	}

	if (user.role === "teacher") {
		const profile = catalogs.teachers.find(
			(teacher) => teacher.userId === user.id,
		)
		if (!profile) throw new Error("Teacher profile not found.")
		snapshot.teacher = {
			profile,
			dashboard: buildTeacherDashboard(user.id, timetable, records),
			timetable: timetable.filter((slot) => slot.teacherId === user.id),
			analytics: buildTeacherAnalytics(user.id, records),
			notifications: selectNotifications(db, user),
		}
	}

	return snapshot
}

export async function login(input: { userId: string; password: string }) {
	return writeDb((db) => {
		const loginId = requireValue(input.userId, "Login ID is required")
		const password = requireValue(input.password, "Password is required")
		const user = firstRow<UserRow>(
			db,
			"select * from users where upper(login_id) = upper(?) and is_active = 1",
			[loginId],
		)
		if (!user || !bcrypt.compareSync(password, user.password_hash)) {
			throw new Error("Invalid login ID or password.")
		}
		const token = newId("session")
		const createdAt = new Date()
		const expiresAt = new Date(createdAt)
		expiresAt.setDate(createdAt.getDate() + 7)
		runSql(
			db,
			"insert into sessions (token, user_id, expires_at, created_at) values (?, ?, ?, ?)",
			[token, user.id, expiresAt.toISOString(), createdAt.toISOString()],
		)
		return {
			token,
			user: mapUser(user),
			snapshot: buildSnapshotFromDb(db, mapUser(user)),
		}
	})
}

export async function logout(token: string) {
	return writeDb((db) => {
		runSql(db, "delete from sessions where token = ?", [token])
		return { ok: true }
	})
}

export async function loadSnapshot(token: string) {
	return readDb((db) => buildSnapshotFromDb(db, userByToken(db, token)))
}

export async function createStudent(token: string, input: CreateStudentInput) {
	return writeDb((db) => {
		userByToken(db, token, ["admin"])
		const fullName = requireValue(input.fullName, "Student name is required")
		const loginId = requireValue(
			input.userId,
			"Student login ID is required",
		).toUpperCase()
		const email = requireValue(
			input.email,
			"Student email is required",
		).toLowerCase()
		const password = requireValue(
			input.password,
			"Student password is required",
		)
		const rollNumber = requireValue(
			input.rollNumber,
			"Roll number is required",
		).toUpperCase()
		const departmentId = requireValue(
			input.departmentId,
			"Department is required",
		)
		const section = normalizeSection(input.section)
		if (!Number.isFinite(input.semester))
			throw new Error("Semester is required")
		const exists = firstRow<CountRow>(
			db,
			`select count(*) as count
			 from users
			 where upper(login_id) = upper(?) or lower(email) = lower(?)`,
			[loginId, email],
		)?.count
		if (exists) throw new Error("User ID or email already exists.")
		const rollExists = firstRow<CountRow>(
			db,
			"select count(*) as count from student_profiles where upper(roll_number) = upper(?)",
			[rollNumber],
		)?.count
		if (rollExists) throw new Error("Roll number already exists.")
		const id = newId("user")
		const profileId = newId("profile")
		const now = new Date().toISOString()
		runSql(
			db,
			"insert into users (id, login_id, full_name, email, password_hash, role, is_active, created_at) values (?, ?, ?, ?, ?, 'student', 1, ?)",
			[id, loginId, fullName, email, bcrypt.hashSync(password, 10), now],
		)
		runSql(
			db,
			"insert into student_profiles (id, user_id, roll_number, department_id, semester, section, phone, created_at) values (?, ?, ?, ?, ?, ?, ?, ?)",
			[
				profileId,
				id,
				rollNumber,
				departmentId,
				input.semester,
				section,
				input.phone?.trim() ?? "",
				now,
			],
		)
		return buildSnapshotFromDb(db, userByToken(db, token, ["admin"]))
	})
}

export async function deleteStudent(token: string, studentUserId: string) {
	return writeDb((db) => {
		userByToken(db, token, ["admin"])
		runSql(
			db,
			"update users set is_active = 0 where id = ? and role = 'student'",
			[studentUserId],
		)
		return buildSnapshotFromDb(db, userByToken(db, token, ["admin"]))
	})
}

export async function createTeacher(token: string, input: CreateTeacherInput) {
	return writeDb((db) => {
		userByToken(db, token, ["admin"])
		if (input.departmentIds.length === 0)
			throw new Error("Select at least one department.")
		if (input.subjectIds.length === 0)
			throw new Error("Select at least one subject.")
		const fullName = requireValue(input.fullName, "Teacher name is required")
		const loginId = requireValue(
			input.userId,
			"Teacher login ID is required",
		).toUpperCase()
		const email = requireValue(
			input.email,
			"Teacher email is required",
		).toLowerCase()
		const password = requireValue(
			input.password,
			"Teacher password is required",
		)
		const employeeId = requireValue(
			input.employeeId,
			"Employee ID is required",
		).toUpperCase()
		const exists = firstRow<CountRow>(
			db,
			`select count(*) as count
			 from users
			 where upper(login_id) = upper(?) or lower(email) = lower(?)`,
			[loginId, email],
		)?.count
		if (exists) throw new Error("User ID or email already exists.")
		const empExists = firstRow<CountRow>(
			db,
			"select count(*) as count from teacher_profiles where upper(employee_id) = upper(?)",
			[employeeId],
		)?.count
		if (empExists) throw new Error("Employee ID already exists.")
		const id = newId("user")
		const profileId = newId("profile")
		const now = new Date().toISOString()
		runSql(
			db,
			"insert into users (id, login_id, full_name, email, password_hash, role, is_active, created_at) values (?, ?, ?, ?, ?, 'teacher', 1, ?)",
			[id, loginId, fullName, email, bcrypt.hashSync(password, 10), now],
		)
		runSql(
			db,
			"insert into teacher_profiles (id, user_id, employee_id, phone, created_at) values (?, ?, ?, ?, ?)",
			[profileId, id, employeeId, input.phone?.trim() ?? "", now],
		)
		for (const departmentId of input.departmentIds) {
			runSql(
				db,
				"insert or ignore into teacher_departments (profile_id, department_id) values (?, ?)",
				[profileId, departmentId],
			)
		}
		for (const subjectId of input.subjectIds) {
			runSql(
				db,
				"insert or ignore into teacher_subjects (profile_id, subject_id) values (?, ?)",
				[profileId, subjectId],
			)
		}
		return buildSnapshotFromDb(db, userByToken(db, token, ["admin"]))
	})
}

export async function deleteTeacher(token: string, profileId: string) {
	return writeDb((db) => {
		userByToken(db, token, ["admin"])
		const profile = firstRow<{ userId: string }>(
			db,
			"select user_id as userId from teacher_profiles where id = ?",
			[profileId],
		)
		if (!profile) throw new Error("Teacher profile not found.")
		runSql(
			db,
			"update users set is_active = 0 where id = ? and role = 'teacher'",
			[profile.userId],
		)
		return buildSnapshotFromDb(db, userByToken(db, token, ["admin"]))
	})
}

export async function createDepartment(
	token: string,
	input: { name: string; code: string },
) {
	return writeDb((db) => {
		userByToken(db, token, ["admin"])
		const name = requireValue(input.name, "Department name is required")
		const code = requireValue(
			input.code,
			"Department code is required",
		).toUpperCase()
		runSql(db, "insert into departments (id, name, code) values (?, ?, ?)", [
			newId("dept"),
			name,
			code,
		])
		return buildSnapshotFromDb(db, userByToken(db, token, ["admin"]))
	})
}

export async function createSubject(
	token: string,
	input: {
		name: string
		code: string
		departmentId: string
		semester: number
		credits: number
	},
) {
	return writeDb((db) => {
		userByToken(db, token, ["admin"])
		const name = requireValue(input.name, "Subject name is required")
		const code = requireValue(
			input.code,
			"Subject code is required",
		).toUpperCase()
		const departmentId = requireValue(
			input.departmentId,
			"Department is required",
		)
		if (!Number.isFinite(input.semester))
			throw new Error("Semester is required")
		if (!Number.isFinite(input.credits)) throw new Error("Credits are required")
		runSql(
			db,
			"insert into subjects (id, name, code, department_id, semester, credits) values (?, ?, ?, ?, ?, ?)",
			[newId("sub"), name, code, departmentId, input.semester, input.credits],
		)
		return buildSnapshotFromDb(db, userByToken(db, token, ["admin"]))
	})
}

export async function saveTimetableSlot(token: string, input: TimetableInput) {
	return writeDb((db) => {
		userByToken(db, token, ["admin"])
		const section = normalizeSection(input.section)
		const isPublished = input.isPublished ? 1 : 0
		if (input.id) {
			runSql(
				db,
				`update timetable
				 set department_id = ?, semester = ?, section = ?, day = ?, start_time = ?,
					 end_time = ?, subject_id = ?, teacher_id = ?, room_no = ?, is_published = ?
				 where id = ?`,
				[
					input.departmentId,
					input.semester,
					section,
					input.day,
					input.startTime,
					input.endTime,
					input.subjectId,
					input.teacherId,
					input.roomNo,
					isPublished,
					input.id,
				],
			)
		} else {
			runSql(
				db,
				`insert into timetable
				 (id, department_id, semester, section, day, start_time, end_time, subject_id, teacher_id, room_no, is_published)
				 values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					newId("tt"),
					input.departmentId,
					input.semester,
					section,
					input.day,
					input.startTime,
					input.endTime,
					input.subjectId,
					input.teacherId,
					input.roomNo,
					isPublished,
				],
			)
		}
		return buildSnapshotFromDb(db, userByToken(db, token, ["admin"]))
	})
}

export async function deleteTimetableSlot(token: string, slotId: string) {
	return writeDb((db) => {
		userByToken(db, token, ["admin"])
		runSql(db, "delete from attendance where timetable_id = ?", [slotId])
		runSql(db, "delete from timetable where id = ?", [slotId])
		return buildSnapshotFromDb(db, userByToken(db, token, ["admin"]))
	})
}

export async function publishTimetable(
	token: string,
	input: { departmentId: string; semester: number; section: string },
) {
	return writeDb((db) => {
		userByToken(db, token, ["admin"])
		runSql(
			db,
			"update timetable set is_published = 1 where department_id = ? and semester = ? and section = ?",
			[input.departmentId, input.semester, normalizeSection(input.section)],
		)
		return buildSnapshotFromDb(db, userByToken(db, token, ["admin"]))
	})
}

export async function sendNotification(
	token: string,
	input: NotificationInput,
) {
	return writeDb((db) => {
		const user = userByToken(db, token, ["admin"])
		const title = requireValue(input.title, "Notification title is required")
		const message = requireValue(
			input.message,
			"Notification message is required",
		)
		const targetId =
			input.targetType === "all"
				? ""
				: requireValue(input.targetId, "Select a target")
		if (input.targetType === "student" || input.targetType === "teacher") {
			const recipient = firstRow<{ role: UserRole; active: number }>(
				db,
				"select role, is_active as active from users where id = ?",
				[targetId],
			)
			if (!recipient?.active || recipient.role !== input.targetType) {
				throw new Error("Selected recipient is invalid.")
			}
		}
		if (input.targetType === "department") {
			const department = firstRow<CountRow>(
				db,
				"select count(*) as count from departments where id = ?",
				[targetId],
			)
			if (!department?.count) throw new Error("Selected department is invalid.")
		}
		runSql(
			db,
			`insert into notifications
			 (id, title, message, priority, target_type, target_id, sent_at, created_by, is_draft)
			 values (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
			[
				newId("notif"),
				title,
				message,
				input.priority,
				input.targetType,
				targetId,
				new Date().toISOString(),
				user.id,
			],
		)
		return buildSnapshotFromDb(db, userByToken(db, token, ["admin"]))
	})
}

function findTeacherSlot(
	db: Database,
	teacherId: string,
	input: RosterInput,
): TimetableSlot {
	const timetable = selectTimetable(db)
	const slot =
		(input.timetableId
			? timetable.find(
					(candidate) =>
						candidate.id === input.timetableId &&
						candidate.teacherId === teacherId,
				)
			: undefined) ??
		timetable.find(
			(candidate) =>
				candidate.teacherId === teacherId &&
				candidate.departmentId === input.departmentId &&
				candidate.semester === input.semester &&
				candidate.section === normalizeSection(input.section) &&
				candidate.subjectId === input.subjectId,
		)
	if (!slot) throw new Error("No assigned timetable slot matches this roster.")
	return slot
}

export async function loadRoster(token: string, input: RosterInput) {
	return readDb((db): RosterResult => {
		const user = userByToken(db, token, ["teacher"])
		return loadRosterFromDb(db, user.id, input)
	})
}

export async function submitAttendance(
	token: string,
	input: SubmitAttendanceInput,
) {
	return writeDb((db) => {
		const user = userByToken(db, token, ["teacher"])
		const slot = findTeacherSlot(db, user.id, input)
		const date = toIsoDate(input.date)
		if (input.students.length === 0)
			throw new Error("Attendance roster is empty.")
		const allowedStudentIds = new Set(
			selectStudents(db)
				.filter(
					(student) =>
						student.departmentId === slot.departmentId &&
						student.semester === slot.semester &&
						student.section === slot.section,
				)
				.map((student) => student.userId),
		)
		const now = new Date().toISOString()
		for (const student of input.students) {
			if (!allowedStudentIds.has(student.studentId)) {
				throw new Error(
					"Attendance roster contains a student outside this class.",
				)
			}
			runSql(
				db,
				`insert into attendance
				 (id, student_id, subject_id, teacher_id, timetable_id, date, status, remarks, created_at, updated_at, updated_by)
				 values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				 on conflict(student_id, subject_id, date)
				 do update set
					status = excluded.status,
					teacher_id = excluded.teacher_id,
					timetable_id = excluded.timetable_id,
					remarks = excluded.remarks,
					updated_at = excluded.updated_at,
					updated_by = excluded.updated_by`,
				[
					newId("att"),
					student.studentId,
					slot.subjectId,
					user.id,
					slot.id,
					date,
					student.status,
					student.remarks?.trim() ?? "",
					now,
					now,
					user.id,
				],
			)
		}
		return {
			snapshot: buildSnapshotFromDb(db, userByToken(db, token, ["teacher"])),
			roster: loadRosterFromDb(db, user.id, {
				...input,
				timetableId: slot.id,
				date,
			}),
		}
	})
}

function loadRosterFromDb(
	db: Database,
	teacherId: string,
	input: RosterInput,
): RosterResult {
	const slot = findTeacherSlot(db, teacherId, input)
	const date = toIsoDate(input.date)
	const students = selectStudents(db).filter(
		(student) =>
			student.departmentId === slot.departmentId &&
			student.semester === slot.semester &&
			student.section === slot.section,
	)
	const savedRows = allRows<{
		id: string
		studentId: string
		status: AttendanceStatus
		remarks: string
		createdAt: string
		updatedAt: string
		updatedByName: string
	}>(
		db,
		`select
			attendance.id,
			attendance.student_id as studentId,
			attendance.status,
			attendance.remarks,
			attendance.created_at as createdAt,
			coalesce(nullif(attendance.updated_at, ''), attendance.created_at) as updatedAt,
			coalesce(editor_users.full_name, teacher_users.full_name) as updatedByName
		 from attendance
		 join student_profiles on student_profiles.user_id = attendance.student_id
		 join users teacher_users on teacher_users.id = attendance.teacher_id
		 left join users editor_users on editor_users.id = nullif(attendance.updated_by, '')
		 where attendance.subject_id = ?
			and attendance.date = ?
			and student_profiles.department_id = ?
			and student_profiles.semester = ?
			and student_profiles.section = ?`,
		[slot.subjectId, date, slot.departmentId, slot.semester, slot.section],
	)
	const savedByStudent = new Map(savedRows.map((row) => [row.studentId, row]))
	const sortedSavedRows = [...savedRows].sort((a, b) =>
		(b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt),
	)
	const lastSaved = sortedSavedRows[0]
	return {
		timetableId: slot.id,
		subjectId: slot.subjectId,
		date,
		slotLabel: `${slot.day} ${slot.startTime}-${slot.endTime} / ${slot.subjectName} (${slot.subjectCode}) / Sem ${slot.semester}-${slot.section}`,
		existingRecords: savedRows.length,
		lastEditedAt: lastSaved?.updatedAt ?? "",
		lastEditedByName: lastSaved?.updatedByName ?? "",
		students: students.map((student, index) => {
			const existing = savedByStudent.get(student.userId)
			return {
				studentId: student.userId,
				universityRoll: student.rollNumber,
				classRoll: `${student.section}-${String(index + 1).padStart(2, "0")}`,
				studentName: student.fullName,
				status: existing?.status ?? "present",
				remarks: existing?.remarks ?? "",
				hasSavedRecord: Boolean(existing),
				updatedAt: existing?.updatedAt ?? "",
				updatedByName: existing?.updatedByName ?? "",
			}
		}),
	}
}

export async function markNotificationRead(
	token: string,
	notificationId: string,
) {
	return writeDb((db) => {
		const user = userByToken(db, token)
		const allowed = selectNotifications(db, user).some(
			(notification) => notification.id === notificationId,
		)
		if (!allowed) throw new Error("Notification not found.")
		runSql(
			db,
			"insert or ignore into notification_reads (notification_id, user_id, read_at) values (?, ?, ?)",
			[notificationId, user.id, new Date().toISOString()],
		)
		return buildSnapshotFromDb(db, userByToken(db, token))
	})
}

function csvEscape(value: string | number) {
	const text = String(value)
	if (text.includes(",") || text.includes('"') || text.includes("\n")) {
		return `"${text.replaceAll('"', '""')}"`
	}
	return text
}

function csvRows(rows: Array<Array<string | number>>) {
	return rows.map((row) => row.map(csvEscape).join(",")).join("\n")
}

export async function exportAdminStudentsCsv(token: string) {
	return readDb((db) => {
		const user = userByToken(db, token, ["admin"])
		const { students } = buildStudentOverview(
			selectStudents(db),
			selectAttendanceRecords(db),
		)
		const rows: Array<Array<string | number>> = [
			["Report", "SAMS Student Attendance Overview"],
			["Generated At", new Date().toISOString()],
			["Generated By", user.fullName],
			["Students", students.length],
			[],
			[
				"Uni No",
				"Name",
				"Department",
				"Subject",
				"Subject Code",
				"Semester",
				"Section",
				"Total",
				"Present",
				"Absent",
				"Late",
			],
		]
		for (const student of students) {
			const subjects =
				student.subjects.length > 0
					? student.subjects
					: [
							{
								subjectName: "-",
								subjectCode: "-",
								total: 0,
								present: 0,
								absent: 0,
								late: 0,
							},
						]
			for (const subject of subjects) {
				rows.push([
					student.uniNo,
					student.name,
					student.department.name,
					subject.subjectName,
					subject.subjectCode,
					student.semester,
					student.section,
					subject.total,
					subject.present,
					subject.absent,
					subject.late,
				])
			}
		}
		return csvRows(rows)
	})
}

export async function studentReport(token: string) {
	return readDb((db) => {
		const user = userByToken(db, token, ["student"])
		const timetable = selectTimetable(db)
		const records = selectAttendanceRecords(db)
		const student = buildStudentData(db, user, timetable, records)
		return { user, student }
	})
}

export async function teacherReport(token: string) {
	return readDb((db) => {
		const user = userByToken(db, token, ["teacher"])
		const records = selectAttendanceRecords(db)
		const profile = selectTeachers(db).find(
			(teacher) => teacher.userId === user.id,
		)
		if (!profile) throw new Error("Teacher profile not found.")
		return {
			user,
			profile,
			records: records
				.filter((record) => record.teacherId === user.id)
				.slice(0, 500),
		}
	})
}
