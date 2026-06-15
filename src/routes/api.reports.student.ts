import { createFileRoute } from "@tanstack/react-router"
import {
	dataTable,
	keyValueGrid,
	pdfResponse,
	renderPdf,
	reportTitle,
	sectionTitle,
} from "../server/pdf-report"
import { studentReport } from "../server/sams-service"

export const Route = createFileRoute("/api/reports/student")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				try {
					const token = new URL(request.url).searchParams.get("token") ?? ""
					const data = await studentReport(token)
					const buffer = await renderPdf((doc) => {
						reportTitle(
							doc,
							"SAMS Student Attendance Report",
							`Generated ${new Date().toLocaleString()}`,
						)
						keyValueGrid(doc, [
							["Student", data.user.fullName],
							["Roll Number", data.student.profile.rollNumber],
							[
								"Department",
								`${data.student.profile.departmentName} (${data.student.profile.departmentCode})`,
							],
							[
								"Cohort",
								`Semester ${data.student.profile.semester}, Section ${data.student.profile.section}`,
							],
						])
						sectionTitle(doc, "Summary")
						dataTable(
							doc,
							[
								{ header: "Total", key: "total", width: 80, align: "right" },
								{
									header: "Present",
									key: "present",
									width: 80,
									align: "right",
								},
								{ header: "Absent", key: "absent", width: 80, align: "right" },
								{ header: "Late", key: "late", width: 80, align: "right" },
								{
									header: "Attendance",
									key: "percentage",
									width: 110,
									align: "right",
								},
							],
							[
								{
									total: data.student.summary.total,
									present: data.student.summary.present,
									absent: data.student.summary.absent,
									late: data.student.summary.late,
									percentage: `${data.student.summary.percentage}%`,
								},
							],
						)
						sectionTitle(doc, "Subject Safe Zone")
						dataTable(
							doc,
							[
								{ header: "Subject", key: "subject", width: 190 },
								{ header: "Code", key: "code", width: 55 },
								{
									header: "Attendance",
									key: "percentage",
									width: 75,
									align: "right",
								},
								{ header: "Needed", key: "needed", width: 70, align: "right" },
								{ header: "Status", key: "status", width: 80 },
							],
							data.student.subjectWise.map((subject) => ({
								subject: subject.subjectName,
								code: subject.subjectCode,
								percentage: `${subject.percentage}%`,
								needed: subject.classesNeeded,
								status: subject.isSafe ? "Safe" : "Below 75%",
							})),
						)
						sectionTitle(doc, "Recent Records")
						dataTable(
							doc,
							[
								{ header: "Date", key: "date", width: 70 },
								{ header: "Subject", key: "subject", width: 170 },
								{ header: "Status", key: "status", width: 70 },
								{ header: "Teacher", key: "teacher", width: 150 },
							],
							data.student.attendance.slice(0, 140).map((record) => ({
								date: record.date,
								subject: `${record.subjectName} (${record.subjectCode})`,
								status: record.status,
								teacher: record.teacherName,
							})),
						)
					})
					return pdfResponse(buffer, "sams-student-report.pdf")
				} catch (error) {
					return new Response(
						error instanceof Error ? error.message : "Report failed",
						{
							status: 401,
						},
					)
				}
			},
		},
	},
})
