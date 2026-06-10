import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import {
	createDepartment,
	createStudent,
	createSubject,
	createTeacher,
	deleteStudent,
	deleteTeacher,
	deleteTimetableSlot,
	exportAdminStudentsCsv,
	loadRoster,
	loadSnapshot,
	login,
	logout,
	markNotificationRead,
	publishTimetable,
	saveTimetableSlot,
	sendNotification,
	submitAttendance,
} from "../server/sams-service"

const sessionSchema = z.object({ token: z.string().min(1) })

const loginSchema = z.object({
	userId: z.string().min(1),
	password: z.string().min(1),
})

const studentSchema = z.object({
	token: z.string().min(1),
	student: z.object({
		fullName: z.string().min(1),
		userId: z.string().min(1),
		email: z.string().email(),
		password: z.string().min(6),
		rollNumber: z.string().min(1),
		departmentId: z.string().min(1),
		semester: z.coerce.number().int().min(1).max(12),
		section: z.string().min(1),
		phone: z.string().optional(),
	}),
})

const teacherSchema = z.object({
	token: z.string().min(1),
	teacher: z.object({
		fullName: z.string().min(1),
		userId: z.string().min(1),
		email: z.string().email(),
		password: z.string().min(6),
		employeeId: z.string().min(1),
		departmentIds: z.array(z.string().min(1)).min(1),
		subjectIds: z.array(z.string().min(1)).min(1),
		phone: z.string().optional(),
	}),
})

const idSchema = z.object({
	token: z.string().min(1),
	id: z.string().min(1),
})

const departmentSchema = z.object({
	token: z.string().min(1),
	department: z.object({
		name: z.string().min(1),
		code: z.string().min(1),
	}),
})

const subjectSchema = z.object({
	token: z.string().min(1),
	subject: z.object({
		name: z.string().min(1),
		code: z.string().min(1),
		departmentId: z.string().min(1),
		semester: z.coerce.number().int().min(1).max(12),
		credits: z.coerce.number().int().min(1).max(10),
	}),
})

const timetableSchema = z.object({
	token: z.string().min(1),
	slot: z.object({
		id: z.string().optional(),
		departmentId: z.string().min(1),
		semester: z.coerce.number().int().min(1).max(12),
		section: z.string().min(1),
		day: z.string().min(1),
		startTime: z.string().min(1),
		endTime: z.string().min(1),
		subjectId: z.string().min(1),
		teacherId: z.string().min(1),
		roomNo: z.string().min(1),
		isPublished: z.boolean(),
	}),
})

const publishSchema = z.object({
	token: z.string().min(1),
	cohort: z.object({
		departmentId: z.string().min(1),
		semester: z.coerce.number().int().min(1).max(12),
		section: z.string().min(1),
	}),
})

const notificationSchema = z.object({
	token: z.string().min(1),
	notification: z.object({
		title: z.string().min(1),
		message: z.string().min(1),
		priority: z.enum(["low", "normal", "high"]),
		targetType: z.enum(["all", "student", "teacher", "department"]),
		targetId: z.string().optional(),
	}),
})

const rosterSchema = z.object({
	token: z.string().min(1),
	roster: z.object({
		departmentId: z.string().min(1),
		semester: z.coerce.number().int().min(1).max(12),
		section: z.string().min(1),
		subjectId: z.string().min(1),
		timetableId: z.string().optional(),
		date: z.string().min(1),
	}),
})

const attendanceSchema = z.object({
	token: z.string().min(1),
	attendance: rosterSchema.shape.roster.extend({
		students: z
			.array(
				z.object({
					studentId: z.string().min(1),
					status: z.enum(["present", "absent", "late"]),
					remarks: z.string().optional(),
				}),
			)
			.min(1),
	}),
})

export const loginAction = createServerFn({ method: "POST" })
	.inputValidator(loginSchema)
	.handler(({ data }) => login(data))

export const logoutAction = createServerFn({ method: "POST" })
	.inputValidator(sessionSchema)
	.handler(({ data }) => logout(data.token))

export const loadSnapshotAction = createServerFn({ method: "GET" })
	.inputValidator(sessionSchema)
	.handler(({ data }) => loadSnapshot(data.token))

export const createStudentAction = createServerFn({ method: "POST" })
	.inputValidator(studentSchema)
	.handler(({ data }) => createStudent(data.token, data.student))

export const deleteStudentAction = createServerFn({ method: "POST" })
	.inputValidator(idSchema)
	.handler(({ data }) => deleteStudent(data.token, data.id))

export const createTeacherAction = createServerFn({ method: "POST" })
	.inputValidator(teacherSchema)
	.handler(({ data }) => createTeacher(data.token, data.teacher))

export const deleteTeacherAction = createServerFn({ method: "POST" })
	.inputValidator(idSchema)
	.handler(({ data }) => deleteTeacher(data.token, data.id))

export const createDepartmentAction = createServerFn({ method: "POST" })
	.inputValidator(departmentSchema)
	.handler(({ data }) => createDepartment(data.token, data.department))

export const createSubjectAction = createServerFn({ method: "POST" })
	.inputValidator(subjectSchema)
	.handler(({ data }) => createSubject(data.token, data.subject))

export const saveTimetableSlotAction = createServerFn({ method: "POST" })
	.inputValidator(timetableSchema)
	.handler(({ data }) => saveTimetableSlot(data.token, data.slot))

export const deleteTimetableSlotAction = createServerFn({ method: "POST" })
	.inputValidator(idSchema)
	.handler(({ data }) => deleteTimetableSlot(data.token, data.id))

export const publishTimetableAction = createServerFn({ method: "POST" })
	.inputValidator(publishSchema)
	.handler(({ data }) => publishTimetable(data.token, data.cohort))

export const sendNotificationAction = createServerFn({ method: "POST" })
	.inputValidator(notificationSchema)
	.handler(({ data }) => sendNotification(data.token, data.notification))

export const markNotificationReadAction = createServerFn({ method: "POST" })
	.inputValidator(idSchema)
	.handler(({ data }) => markNotificationRead(data.token, data.id))

export const loadRosterAction = createServerFn({ method: "POST" })
	.inputValidator(rosterSchema)
	.handler(({ data }) => loadRoster(data.token, data.roster))

export const submitAttendanceAction = createServerFn({ method: "POST" })
	.inputValidator(attendanceSchema)
	.handler(({ data }) => submitAttendance(data.token, data.attendance))

export const exportAdminStudentsCsvAction = createServerFn({ method: "GET" })
	.inputValidator(sessionSchema)
	.handler(({ data }) => exportAdminStudentsCsv(data.token))
