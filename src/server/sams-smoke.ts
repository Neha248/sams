import fs from "node:fs"
import type { SubmitAttendanceInput } from "../lib/sams-types"
import {
	loadRoster,
	login,
	markNotificationRead,
	submitAttendance,
} from "./sams-service"

function assert(value: unknown, message: string): asserts value {
	if (!value) throw new Error(message)
}

const today = new Date().toISOString().slice(0, 10)
const smokeDbFile = process.env.SAMS_DB_FILE
if (smokeDbFile) fs.rmSync(smokeDbFile, { force: true })

const admin = await login({ userId: "ADMIN001", password: "Admin@123" })
assert(admin.snapshot.admin, "Admin snapshot failed to load.")
assert(
	admin.snapshot.catalogs.students.length >= 50,
	"Seeded students are missing.",
)
assert(
	admin.snapshot.catalogs.teachers.length >= 12,
	"Seeded teachers are missing.",
)

const teacher = await login({ userId: "TCH001", password: "Teacher@123" })
assert(teacher.snapshot.teacher, "Teacher snapshot failed to load.")
const slot = teacher.snapshot.teacher.timetable[0]
assert(slot, "Teacher has no assigned timetable slot.")

const roster = await loadRoster(teacher.token, {
	departmentId: slot.departmentId,
	semester: slot.semester,
	section: slot.section,
	subjectId: slot.subjectId,
	timetableId: slot.id,
	date: today,
})
assert(roster.students.length > 0, "Teacher roster is empty.")

const revisedStudents: SubmitAttendanceInput["students"] = roster.students.map(
	(student, index) =>
		index === 0
			? {
					studentId: student.studentId,
					status: student.status === "late" ? "present" : "late",
					remarks: "Smoke test revision",
				}
			: {
					studentId: student.studentId,
					status: student.status,
					remarks: student.remarks,
				},
)

const saved = await submitAttendance(teacher.token, {
	departmentId: slot.departmentId,
	semester: slot.semester,
	section: slot.section,
	subjectId: slot.subjectId,
	timetableId: slot.id,
	date: roster.date,
	students: revisedStudents,
})
assert(saved.roster.existingRecords > 0, "Attendance revision was not saved.")
assert(saved.roster.lastEditedByName, "Attendance edit metadata is missing.")

const notification = saved.snapshot.teacher?.notifications[0]
let notificationRead = false
if (notification) {
	const afterRead = await markNotificationRead(teacher.token, notification.id)
	notificationRead =
		afterRead.teacher?.notifications.find((item) => item.id === notification.id)
			?.isRead ?? false
	assert(notificationRead, "Notification read receipt was not saved.")
}

console.log(
	JSON.stringify(
		{
			admin: {
				students: admin.snapshot.catalogs.students.length,
				teachers: admin.snapshot.catalogs.teachers.length,
				departments: admin.snapshot.catalogs.departments.length,
			},
			teacherAttendance: {
				slot: saved.roster.slotLabel,
				rosterStudents: saved.roster.students.length,
				existingRecords: saved.roster.existingRecords,
				lastEditedBy: saved.roster.lastEditedByName,
			},
			notificationRead,
		},
		null,
		2,
	),
)
