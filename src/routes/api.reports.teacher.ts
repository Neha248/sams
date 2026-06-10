import { createFileRoute } from "@tanstack/react-router"
import {
	dataTable,
	keyValueGrid,
	pdfResponse,
	renderPdf,
	reportTitle,
	sectionTitle,
} from "../server/pdf-report"
import { teacherReport } from "../server/sams-service"

export const Route = createFileRoute("/api/reports/teacher")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				try {
					const token = new URL(request.url).searchParams.get("token") ?? ""
					const data = await teacherReport(token)
					const buffer = await renderPdf((doc) => {
						const summary = {
							total: data.records.length,
							present: data.records.filter(
								(record) => record.status === "present",
							).length,
							absent: data.records.filter(
								(record) => record.status === "absent",
							).length,
							late: data.records.filter((record) => record.status === "late")
								.length,
						}
						reportTitle(
							doc,
							"SAMS Teacher Attendance Report",
							`Generated ${new Date().toLocaleString()}`,
						)
						keyValueGrid(doc, [
							["Teacher", data.user.fullName],
							["Employee ID", data.profile.employeeId],
							[
								"Departments",
								data.profile.departments
									.map((department) => department.code)
									.join(", "),
							],
							[
								"Subjects",
								data.profile.subjects.map((subject) => subject.code).join(", "),
							],
						])
						sectionTitle(doc, "Summary")
						dataTable(
							doc,
							[
								{ header: "Total", key: "total", width: 90, align: "right" },
								{
									header: "Present",
									key: "present",
									width: 90,
									align: "right",
								},
								{ header: "Absent", key: "absent", width: 90, align: "right" },
								{ header: "Late", key: "late", width: 90, align: "right" },
							],
							[summary],
						)
						sectionTitle(doc, "Attendance Records")
						dataTable(
							doc,
							[
								{ header: "Date", key: "date", width: 70 },
								{ header: "Roll", key: "roll", width: 75 },
								{ header: "Student", key: "student", width: 145 },
								{ header: "Subject", key: "subject", width: 125 },
								{ header: "Status", key: "status", width: 60 },
							],
							data.records.map((record) => ({
								date: record.date,
								roll: record.rollNumber,
								student: record.studentName,
								subject: `${record.subjectName} (${record.subjectCode})`,
								status: record.status,
							})),
						)
					})
					return pdfResponse(buffer, "sams-teacher-report.pdf")
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
