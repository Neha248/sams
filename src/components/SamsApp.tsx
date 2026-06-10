import {
	AlertCircle,
	BarChart3,
	Bell,
	BookOpen,
	Building2,
	CalendarCheck,
	CalendarDays,
	CheckCircle2,
	ClipboardCheck,
	Clock3,
	Download,
	FileText,
	GraduationCap,
	History,
	KeyRound,
	LayoutDashboard,
	LogOut,
	Menu,
	Moon,
	Pencil,
	Plus,
	Save,
	Search,
	Send,
	ShieldCheck,
	Trash2,
	UserCheck,
	UserPlus,
	Users,
	XCircle,
	type LucideIcon,
} from "lucide-react"
import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts"
import {
	createDepartmentAction,
	createStudentAction,
	createSubjectAction,
	createTeacherAction,
	deleteStudentAction,
	deleteTeacherAction,
	deleteTimetableSlotAction,
	exportAdminStudentsCsvAction,
	loadRosterAction,
	loadSnapshotAction,
	loginAction,
	logoutAction,
	markNotificationReadAction,
	publishTimetableAction,
	saveTimetableSlotAction,
	sendNotificationAction,
	submitAttendanceAction,
} from "../lib/sams-actions"
import type {
	AppSection,
	AppSnapshot,
	AttendanceStatus,
	CreateStudentInput,
	CreateTeacherInput,
	NotificationInput,
	RosterInput,
	RosterResult,
	StudentAttendanceOverview,
	SubmitAttendanceInput,
	TeacherAnalyticsRow,
	TimetableInput,
	TimetableSlot,
	UserRole,
} from "../lib/sams-types"

const sessionKey = "sams-sqlite-session"
const themeKey = "sams-theme"
const statusValues: AttendanceStatus[] = ["present", "absent", "late"]
const days = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
]

type SamsAppProps = {
	section: AppSection
}

type MutationContext = {
	token: string
	snapshot: AppSnapshot
	setSnapshot: (snapshot: AppSnapshot) => void
	setError: (message: string) => void
}

function defaultPath(role: UserRole) {
	if (role === "admin") return "/"
	if (role === "teacher") return "/teacher/dashboard"
	return "/"
}

function todayInput() {
	return new Date().toISOString().slice(0, 10)
}

function downloadText(
	filename: string,
	body: string,
	type = "text/csv;charset=utf-8",
) {
	const blob = new Blob([body], { type })
	const url = URL.createObjectURL(blob)
	const link = document.createElement("a")
	link.href = url
	link.download = filename
	link.click()
	URL.revokeObjectURL(url)
}

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Operation failed."
}

function filterText(...values: Array<string | number | undefined>) {
	return values.join(" ").toLowerCase()
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

function statusBadge(status: AttendanceStatus | "pending" | "complete") {
	if (status === "present" || status === "complete")
		return "badge badge-success"
	if (status === "late" || status === "pending") return "badge badge-warning"
	return "badge badge-error"
}

function StatusIcon({
	status,
}: {
	status: AttendanceStatus | "pending" | "complete"
}) {
	if (status === "present" || status === "complete")
		return <CheckCircle2 size={14} />
	if (status === "late" || status === "pending") return <Clock3 size={14} />
	return <XCircle size={14} />
}

function statusLabel(status: AttendanceStatus | "pending" | "complete") {
	return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatDateTime(value: string) {
	if (!value) return "-"
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return value
	return date.toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	})
}

function notificationHref(role: UserRole) {
	if (role === "admin") return "/admin/notifications"
	if (role === "teacher") return "/teacher/notifications"
	return "/notifications"
}

function unreadNotificationCount(snapshot: AppSnapshot) {
	const notifications =
		snapshot.user.role === "admin"
			? snapshot.admin?.notifications
			: snapshot.user.role === "teacher"
				? snapshot.teacher?.notifications
				: snapshot.student?.notifications
	return (
		notifications?.filter((notification) => !notification.isRead).length ?? 0
	)
}

function unreadLabel(count: number) {
	return count > 99 ? "99+" : String(count)
}

export default function SamsApp({ section }: SamsAppProps) {
	const [token, setToken] = useState<string | null>(null)
	const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState("")

	useEffect(() => {
		const savedTheme = localStorage.getItem(themeKey)
		document.documentElement.setAttribute(
			"data-theme",
			savedTheme === "cupcake" ? "cupcake" : "dracula",
		)

		const savedToken = localStorage.getItem(sessionKey)
		setToken(savedToken)
		if (!savedToken) {
			setLoading(false)
			return
		}
		loadSnapshotAction({ data: { token: savedToken } })
			.then((data) => {
				setSnapshot(data)
				setError("")
			})
			.catch(() => {
				localStorage.removeItem(sessionKey)
				setToken(null)
				setSnapshot(null)
			})
			.finally(() => setLoading(false))
	}, [])

	async function handleLogout() {
		if (token) await logoutAction({ data: { token } }).catch(() => null)
		localStorage.removeItem(sessionKey)
		setToken(null)
		setSnapshot(null)
		window.location.assign("/login")
	}

	if (loading) {
		return (
			<main className="grid min-h-screen place-items-center bg-base-200 p-6">
				<div className="loading loading-spinner loading-lg text-primary" />
			</main>
		)
	}

	if (section === "login" || !token || !snapshot) {
		return (
			<LoginPage
				onLogin={(nextToken, nextSnapshot) => {
					localStorage.setItem(sessionKey, nextToken)
					setToken(nextToken)
					setSnapshot(nextSnapshot)
					window.location.assign(defaultPath(nextSnapshot.user.role))
				}}
			/>
		)
	}

	const effectiveSection =
		section === "admin-dashboard" && snapshot.user.role === "teacher"
			? "teacher-dashboard"
			: section === "admin-dashboard" && snapshot.user.role === "student"
				? "student-dashboard"
				: section

	return (
		<AppShell
			section={effectiveSection}
			snapshot={snapshot}
			onLogout={() => void handleLogout()}
			onThemeChange={() => {
				const current =
					document.documentElement.getAttribute("data-theme") === "cupcake"
						? "cupcake"
						: "dracula"
				const next = current === "cupcake" ? "dracula" : "cupcake"
				localStorage.setItem(themeKey, next)
				document.documentElement.setAttribute("data-theme", next)
			}}
		>
			{error ? (
				<div className="alert alert-error mb-4">
					<span>{error}</span>
					<button
						className="btn btn-sm"
						type="button"
						onClick={() => setError("")}
					>
						Dismiss
					</button>
				</div>
			) : null}
			<PageRouter
				section={effectiveSection}
				context={{ token, snapshot, setSnapshot, setError }}
			/>
		</AppShell>
	)
}

function LoginPage({
	onLogin,
}: {
	onLogin: (token: string, snapshot: AppSnapshot) => void
}) {
	const [userId, setUserId] = useState("ADMIN001")
	const [password, setPassword] = useState("Admin@123")
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState("")

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setBusy(true)
		setError("")
		try {
			const result = await loginAction({ data: { userId, password } })
			onLogin(result.token, result.snapshot)
		} catch (cause) {
			setError(errorMessage(cause))
		} finally {
			setBusy(false)
		}
	}

	return (
		<main className="min-h-svh bg-base-200">
			<div className="mx-auto grid min-h-svh w-full max-w-6xl items-center gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10 lg:py-10">
				<section className="order-2 space-y-5 lg:order-1">
					<div className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-sm font-bold text-primary-content">
						<GraduationCap size={18} />
						SAMS
					</div>
					<div className="space-y-3">
						<h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
							Smart Attendance Management System
						</h1>
						<p className="max-w-2xl text-base leading-7 text-base-content/70 sm:text-lg">
							Admin, teacher, and student attendance workflows in one local
							TanStack Start app backed by SQLite.
						</p>
					</div>
					<div className="grid gap-2 sm:grid-cols-3">
						<CredentialButton
							label="Admin"
							login="ADMIN001"
							password="Admin@123"
							icon={ShieldCheck}
							onPick={(login, pass) => {
								setUserId(login)
								setPassword(pass)
							}}
						/>
						<CredentialButton
							label="Teacher"
							login="TCH001"
							password="Teacher@123"
							icon={UserCheck}
							onPick={(login, pass) => {
								setUserId(login)
								setPassword(pass)
							}}
						/>
						<CredentialButton
							label="Student"
							login="STU001"
							password="Student@123"
							icon={GraduationCap}
							onPick={(login, pass) => {
								setUserId(login)
								setPassword(pass)
							}}
						/>
					</div>
				</section>
				<form
					className="card order-1 w-full bg-base-100 shadow-xl lg:order-2"
					onSubmit={(event) => void submit(event)}
				>
					<div className="card-body gap-5 p-5 sm:p-6">
						<div>
							<h2 className="card-title text-2xl">
								<KeyRound size={22} />
								Sign in
							</h2>
							<p className="mt-1 text-sm text-base-content/60">
								Use one of the seeded role accounts below.
							</p>
						</div>
						{error ? <div className="alert alert-error">{error}</div> : null}
						<label className="grid gap-1">
							<span className="label-text">Login ID</span>
							<input
								className="input input-bordered"
								value={userId}
								onChange={(event) => setUserId(event.target.value)}
							/>
						</label>
						<label className="grid gap-1">
							<span className="label-text">Password</span>
							<input
								className="input input-bordered"
								type="password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
							/>
						</label>
						<button className="btn btn-primary" disabled={busy} type="submit">
							{busy ? <span className="loading loading-spinner" /> : null}
							Sign in
						</button>
					</div>
				</form>
			</div>
		</main>
	)
}

function CredentialButton({
	label,
	login,
	password,
	icon: Icon,
	onPick,
}: {
	label: string
	login: string
	password: string
	icon: LucideIcon
	onPick: (login: string, password: string) => void
}) {
	return (
		<button
			className="btn btn-outline h-auto min-h-0 w-full items-center justify-start gap-3 py-4 text-left"
			type="button"
			onClick={() => onPick(login, password)}
		>
			<Icon className="shrink-0" size={20} />
			<span className="min-w-0">
				<span className="block font-bold">{label}</span>
				<span className="block truncate text-xs opacity-70">
					{login} / {password}
				</span>
			</span>
		</button>
	)
}

function AppShell({
	children,
	section,
	snapshot,
	onLogout,
	onThemeChange,
}: {
	children: ReactNode
	section: AppSection
	snapshot: AppSnapshot
	onLogout: () => void
	onThemeChange: () => void
}) {
	const nav = navItems(snapshot.user.role)
	const unreadNotifications = unreadNotificationCount(snapshot)
	const unreadNotificationsLabel = unreadLabel(unreadNotifications)
	const hasUnreadNotifications = unreadNotifications > 0
	return (
		<div className="drawer lg:drawer-open min-h-screen bg-base-200">
			<input id="sams-drawer" type="checkbox" className="drawer-toggle" />
			<div className="drawer-content flex min-w-0 flex-col">
				<header className="navbar sticky top-0 z-30 min-h-16 border-b border-base-300 bg-base-100/90 px-3 backdrop-blur sm:px-4">
					<div className="flex-none lg:hidden">
						<label htmlFor="sams-drawer" className="btn btn-square btn-ghost">
							<Menu size={20} />
						</label>
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex min-w-0 items-center gap-3">
							<div className="truncate font-black">SAMS</div>
							<div className="hidden min-w-0 items-center gap-2 text-sm text-base-content/60 sm:flex">
								<span className="h-1 w-1 rounded-full bg-base-content/30" />
								<span className="truncate">{snapshot.user.fullName}</span>
								<span className="badge badge-ghost badge-sm capitalize">
									{snapshot.user.role}
								</span>
							</div>
						</div>
					</div>
					<div className="flex shrink-0 items-center gap-1 sm:gap-2">
						<a
							aria-label={
								hasUnreadNotifications
									? `${unreadNotificationsLabel} unread notifications`
									: "Notifications"
							}
							className={`btn btn-sm btn-square relative ${
								hasUnreadNotifications ? "btn-warning" : "btn-ghost"
							}`}
							href={notificationHref(snapshot.user.role)}
							title={
								hasUnreadNotifications
									? `${unreadNotificationsLabel} unread notifications`
									: "Notifications"
							}
						>
							<Bell size={16} />
							{hasUnreadNotifications ? (
								<span className="badge badge-error badge-xs absolute -right-1 -top-1 h-5 min-w-5 border border-base-100 px-1 text-[10px]">
									{unreadNotificationsLabel}
								</span>
							) : null}
						</a>
						<button
							className="btn btn-ghost btn-sm"
							type="button"
							onClick={onThemeChange}
							title="Toggle theme"
						>
							<Moon size={16} />
						</button>
						<button
							className="btn btn-outline btn-sm"
							type="button"
							onClick={onLogout}
						>
							<LogOut size={16} />
							<span className="hidden sm:inline">Logout</span>
						</button>
					</div>
				</header>
				<main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
					{children}
				</main>
			</div>
			<div className="drawer-side z-40">
				<label
					htmlFor="sams-drawer"
					className="drawer-overlay"
					aria-label="Close navigation"
				/>
				<aside className="min-h-full w-72 border-r border-base-300 bg-base-100 p-4">
					<div className="mb-6 flex items-center gap-3 px-2">
						<div className="grid h-11 w-11 place-items-center rounded bg-primary text-primary-content">
							<GraduationCap />
						</div>
						<div>
							<div className="font-black">SAMS</div>
							<div className="text-xs uppercase tracking-wide text-base-content/60">
								{snapshot.user.role} console
							</div>
						</div>
					</div>
					<nav className="menu gap-1">
						{nav.map((item) => (
							<li key={item.href}>
								<a
									aria-label={
										item.section.endsWith("notifications") &&
										hasUnreadNotifications
											? `${item.label}, ${unreadNotificationsLabel} unread`
											: item.label
									}
									className={[
										item.section === section ? "active" : "",
										item.section.endsWith("notifications") &&
										hasUnreadNotifications
											? "border border-warning/40 bg-warning/15 font-semibold text-warning"
											: "",
									]
										.filter(Boolean)
										.join(" ")}
									href={item.href}
								>
									<item.icon size={18} />
									<span className="flex-1">{item.label}</span>
									{item.section.endsWith("notifications") &&
									hasUnreadNotifications ? (
										<span className="badge badge-warning badge-sm ml-auto">
											{unreadNotificationsLabel}
										</span>
									) : null}
								</a>
							</li>
						))}
					</nav>
				</aside>
			</div>
		</div>
	)
}

function navItems(role: UserRole) {
	if (role === "admin") {
		return [
			{
				label: "Dashboard",
				href: "/",
				section: "admin-dashboard" as const,
				icon: LayoutDashboard,
			},
			{
				label: "Students",
				href: "/admin/students",
				section: "admin-students" as const,
				icon: Users,
			},
			{
				label: "Teachers",
				href: "/admin/teachers",
				section: "admin-teachers" as const,
				icon: UserPlus,
			},
			{
				label: "Timetable",
				href: "/admin/timetable",
				section: "admin-timetable" as const,
				icon: CalendarDays,
			},
			{
				label: "Notifications",
				href: "/admin/notifications",
				section: "admin-notifications" as const,
				icon: Bell,
			},
		]
	}
	if (role === "teacher") {
		return [
			{
				label: "Dashboard",
				href: "/teacher/dashboard",
				section: "teacher-dashboard" as const,
				icon: LayoutDashboard,
			},
			{
				label: "Mark Attendance",
				href: "/teacher/attendance",
				section: "teacher-attendance" as const,
				icon: ClipboardCheck,
			},
			{
				label: "Analysis",
				href: "/teacher/analysis",
				section: "teacher-analysis" as const,
				icon: BarChart3,
			},
			{
				label: "Notifications",
				href: "/teacher/notifications",
				section: "teacher-notifications" as const,
				icon: Bell,
			},
		]
	}
	return [
		{
			label: "Dashboard",
			href: "/",
			section: "student-dashboard" as const,
			icon: LayoutDashboard,
		},
		{
			label: "Attendance",
			href: "/attendance",
			section: "student-attendance" as const,
			icon: ClipboardCheck,
		},
		{
			label: "Timetable",
			href: "/timetable",
			section: "student-timetable" as const,
			icon: CalendarDays,
		},
		{
			label: "Notifications",
			href: "/notifications",
			section: "student-notifications" as const,
			icon: Bell,
		},
	]
}

function PageRouter({
	section,
	context,
}: {
	section: AppSection
	context: MutationContext
}) {
	const role = context.snapshot.user.role
	if (section.startsWith("admin") && role !== "admin") return <Unauthorized />
	if (section.startsWith("teacher") && role !== "teacher")
		return <Unauthorized />
	if (section.startsWith("student") && role !== "student")
		return <Unauthorized />

	switch (section) {
		case "admin-dashboard":
			return <AdminDashboardPage context={context} />
		case "admin-students":
			return <AdminStudentsPage context={context} />
		case "admin-teachers":
			return <AdminTeachersPage context={context} />
		case "admin-timetable":
			return <AdminTimetablePage context={context} />
		case "admin-notifications":
			return <AdminNotificationsPage context={context} />
		case "student-attendance":
			return <StudentAttendancePage context={context} />
		case "student-timetable":
			return (
				<TimetableTable slots={context.snapshot.student?.timetable ?? []} />
			)
		case "student-notifications":
			return (
				<NotificationsPage
					context={context}
					notifications={context.snapshot.student?.notifications ?? []}
				/>
			)
		case "teacher-dashboard":
			return <TeacherDashboardPage context={context} />
		case "teacher-attendance":
			return <TeacherAttendancePage context={context} />
		case "teacher-analysis":
			return <TeacherAnalysisPage context={context} />
		case "teacher-notifications":
			return (
				<NotificationsPage
					context={context}
					notifications={context.snapshot.teacher?.notifications ?? []}
				/>
			)
		default:
			return <StudentDashboardPage context={context} />
	}
}

function Unauthorized() {
	return (
		<div className="alert alert-warning">
			<span>This route is not available for the signed-in role.</span>
		</div>
	)
}

function PageHeader({
	title,
	description,
	action,
}: {
	title: string
	description: string
	action?: ReactNode
}) {
	return (
		<div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
			<div className="min-w-0">
				<h1 className="text-2xl font-black tracking-tight sm:text-3xl">
					{title}
				</h1>
				<p className="mt-1 max-w-3xl text-sm leading-6 text-base-content/70 sm:text-base">
					{description}
				</p>
			</div>
			{action ? (
				<div className="flex shrink-0 flex-wrap gap-2">{action}</div>
			) : null}
		</div>
	)
}

function MetricCard({
	label,
	value,
	helper,
	icon: Icon,
}: {
	label: string
	value: string | number
	helper?: string
	icon?: LucideIcon
}) {
	return (
		<div className="rounded bg-base-100 p-4 shadow-sm ring-1 ring-base-300/70">
			<div className="flex min-w-0 items-start justify-between gap-3">
				<div className="min-w-0">
					<div className="text-xs font-bold uppercase tracking-wide text-base-content/55">
						{label}
					</div>
					<div className="mt-2 break-words text-2xl font-black leading-tight text-primary sm:text-3xl">
						{value}
					</div>
					{helper ? (
						<div className="mt-1 text-xs leading-5 text-base-content/60">
							{helper}
						</div>
					) : null}
				</div>
				{Icon ? (
					<div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-primary/10 text-primary">
						<Icon size={20} />
					</div>
				) : null}
			</div>
		</div>
	)
}

function ChartCard({
	title,
	children,
}: {
	title: string
	children: ReactNode
}) {
	return (
		<section className="card bg-base-100 shadow-sm ring-1 ring-base-300/70">
			<div className="card-body gap-3 p-4 sm:p-5">
				<h2 className="card-title text-base">{title}</h2>
				<div className="h-64 sm:h-72">{children}</div>
			</div>
		</section>
	)
}

function AdminDashboardPage({ context }: { context: MutationContext }) {
	const admin = context.snapshot.admin
	const [departmentForm, setDepartmentForm] = useState({ name: "", code: "" })
	const [subjectForm, setSubjectForm] = useState({
		name: "",
		code: "",
		departmentId: context.snapshot.catalogs.departments[0]?.id ?? "",
		semester: 1,
		credits: 3,
	})
	const [facultyDepartmentId, setFacultyDepartmentId] = useState(
		context.snapshot.catalogs.departments[0]?.id ?? "",
	)
	const [busy, setBusy] = useState("")
	if (!admin) return null
	const facultyRows = admin.facultyAttendance.filter(
		(row) => !facultyDepartmentId || row.departmentId === facultyDepartmentId,
	)

	async function createDepartment(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setBusy("department")
		try {
			const next = await createDepartmentAction({
				data: { token: context.token, department: departmentForm },
			})
			context.setSnapshot(next)
			setDepartmentForm({ name: "", code: "" })
		} catch (cause) {
			context.setError(errorMessage(cause))
		} finally {
			setBusy("")
		}
	}

	async function createSubject(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setBusy("subject")
		try {
			const next = await createSubjectAction({
				data: { token: context.token, subject: subjectForm },
			})
			context.setSnapshot(next)
			setSubjectForm((current) => ({ ...current, name: "", code: "" }))
		} catch (cause) {
			context.setError(errorMessage(cause))
		} finally {
			setBusy("")
		}
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Admin Dashboard"
				description="Institution-wide attendance, faculty activity, and catalog controls."
			/>
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					icon={Users}
					label="Students"
					value={admin.dashboard.totalStudents}
				/>
				<MetricCard
					icon={UserCheck}
					label="Teachers"
					value={admin.dashboard.totalTeachers}
				/>
				<MetricCard
					icon={Building2}
					label="Departments"
					value={admin.dashboard.totalDepartments}
				/>
				<MetricCard
					icon={CalendarCheck}
					label="Classes Conducted"
					value={admin.dashboard.totalClassesConducted}
					helper={`${admin.dashboard.todayPresent} present today`}
				/>
			</div>
			<div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
				<ChartCard title="Attendance Distribution">
					<ResponsiveContainer>
						<PieChart>
							<Pie
								data={[
									{ name: "Present", value: admin.studentChart.present },
									{ name: "Absent", value: admin.studentChart.absent },
									{ name: "Late", value: admin.studentChart.late },
								].filter((row) => row.value > 0)}
								dataKey="value"
								nameKey="name"
								outerRadius={95}
								label
							>
								{["#36d399", "#f87272", "#fbbd23"].map((color) => (
									<Cell key={color} fill={color} />
								))}
							</Pie>
							<Tooltip />
							<Legend />
						</PieChart>
					</ResponsiveContainer>
				</ChartCard>
				<section className="card bg-base-100 shadow">
					<div className="card-body gap-4">
						<h2 className="card-title text-base">Catalog Management</h2>
						<form
							className="grid gap-3"
							onSubmit={(event) => void createDepartment(event)}
						>
							<div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_auto]">
								<input
									className="input input-bordered w-full"
									placeholder="Department name"
									value={departmentForm.name}
									onChange={(event) =>
										setDepartmentForm((current) => ({
											...current,
											name: event.target.value,
										}))
									}
								/>
								<input
									className="input input-bordered w-full"
									placeholder="Code"
									value={departmentForm.code}
									onChange={(event) =>
										setDepartmentForm((current) => ({
											...current,
											code: event.target.value,
										}))
									}
								/>
								<button
									aria-label="Add department"
									className="btn btn-primary"
									title="Add department"
									type="submit"
								>
									{busy === "department" ? (
										<span className="loading loading-spinner" />
									) : (
										<Plus size={16} />
									)}
								</button>
							</div>
						</form>
						<form
							className="grid gap-3"
							onSubmit={(event) => void createSubject(event)}
						>
							<input
								className="input input-bordered"
								placeholder="Subject name"
								value={subjectForm.name}
								onChange={(event) =>
									setSubjectForm((current) => ({
										...current,
										name: event.target.value,
									}))
								}
							/>
							<div className="grid gap-3 sm:grid-cols-2">
								<input
									className="input input-bordered"
									placeholder="Subject code"
									value={subjectForm.code}
									onChange={(event) =>
										setSubjectForm((current) => ({
											...current,
											code: event.target.value,
										}))
									}
								/>
								<select
									className="select select-bordered"
									value={subjectForm.departmentId}
									onChange={(event) =>
										setSubjectForm((current) => ({
											...current,
											departmentId: event.target.value,
										}))
									}
								>
									{context.snapshot.catalogs.departments.map((department) => (
										<option key={department.id} value={department.id}>
											{department.name}
										</option>
									))}
								</select>
							</div>
							<div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
								<input
									className="input input-bordered"
									min={1}
									type="number"
									value={subjectForm.semester}
									onChange={(event) =>
										setSubjectForm((current) => ({
											...current,
											semester: Number(event.target.value),
										}))
									}
								/>
								<input
									className="input input-bordered"
									min={1}
									type="number"
									value={subjectForm.credits}
									onChange={(event) =>
										setSubjectForm((current) => ({
											...current,
											credits: Number(event.target.value),
										}))
									}
								/>
								<button className="btn btn-secondary" type="submit">
									{busy === "subject" ? (
										<span className="loading loading-spinner" />
									) : (
										<Save size={16} />
									)}
									Subject
								</button>
							</div>
						</form>
					</div>
				</section>
			</div>
			<section className="card bg-base-100 shadow">
				<div className="card-body">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<h2 className="card-title text-base">
							<UserCheck size={18} />
							Faculty Attendance
						</h2>
						<select
							className="select select-bordered select-sm w-full sm:w-72"
							value={facultyDepartmentId}
							onChange={(event) => setFacultyDepartmentId(event.target.value)}
						>
							<option value="">All departments</option>
							{context.snapshot.catalogs.departments.map((department) => (
								<option key={department.id} value={department.id}>
									{department.name}
								</option>
							))}
						</select>
					</div>
					<div className="overflow-x-auto">
						<table className="table table-zebra table-sm">
							<thead>
								<tr>
									<th>Teacher</th>
									<th>Subject</th>
									<th>Present</th>
									<th>Absent</th>
									<th>Late</th>
									<th>Total</th>
								</tr>
							</thead>
							<tbody>
								{facultyRows.slice(0, 20).map((row) => (
									<tr key={`${row.teacherUserId}-${row.subjectId}`}>
										<td>{row.teacherName}</td>
										<td>
											{row.subjectName} ({row.subjectCode})
										</td>
										<td>{row.presentCount}</td>
										<td>{row.absentCount}</td>
										<td>{row.lateCount}</td>
										<td>{row.totalRecords}</td>
									</tr>
								))}
								{facultyRows.length === 0 ? (
									<tr>
										<td
											className="py-6 text-center text-base-content/60"
											colSpan={6}
										>
											No faculty attendance rows for this filter.
										</td>
									</tr>
								) : null}
							</tbody>
						</table>
					</div>
				</div>
			</section>
		</div>
	)
}

function AdminStudentsPage({ context }: { context: MutationContext }) {
	const admin = context.snapshot.admin
	const [departmentId, setDepartmentId] = useState("")
	const [semester, setSemester] = useState("")
	const [search, setSearch] = useState("")
	const [busy, setBusy] = useState(false)
	const [form, setForm] = useState<CreateStudentInput>({
		fullName: "",
		userId: "",
		email: "",
		password: "Student@123",
		rollNumber: "",
		departmentId: context.snapshot.catalogs.departments[0]?.id ?? "",
		semester: context.snapshot.catalogs.semesters[0] ?? 1,
		section: "A",
		phone: "",
	})
	if (!admin) return null

	const rows = admin.students.filter((student) => {
		if (departmentId && student.department.id !== departmentId) return false
		if (semester && student.semester !== Number(semester)) return false
		if (
			search &&
			!filterText(student.name, student.uniNo, student.email).includes(
				search.toLowerCase(),
			)
		)
			return false
		return true
	})

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setBusy(true)
		try {
			const next = await createStudentAction({
				data: { token: context.token, student: form },
			})
			context.setSnapshot(next)
			setForm((current) => ({
				...current,
				fullName: "",
				userId: "",
				email: "",
				rollNumber: "",
				phone: "",
			}))
		} catch (cause) {
			context.setError(errorMessage(cause))
		} finally {
			setBusy(false)
		}
	}

	async function remove(id: string) {
		if (!window.confirm("Remove this student account?")) return
		try {
			context.setSnapshot(
				await deleteStudentAction({ data: { token: context.token, id } }),
			)
		} catch (cause) {
			context.setError(errorMessage(cause))
		}
	}

	async function exportCsv() {
		try {
			const csv = await exportAdminStudentsCsvAction({
				data: { token: context.token },
			})
			downloadText(`sams-students-${Date.now()}.csv`, csv)
		} catch (cause) {
			context.setError(errorMessage(cause))
		}
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Students"
				description="Subject-wise attendance overview with add, remove, filter, and CSV export."
				action={
					<button
						className="btn btn-primary"
						type="button"
						onClick={() => void exportCsv()}
					>
						<Download size={16} />
						Export CSV
					</button>
				}
			/>
			<Filters
				departmentId={departmentId}
				setDepartmentId={setDepartmentId}
				semester={semester}
				setSemester={setSemester}
				search={search}
				setSearch={setSearch}
				snapshot={context.snapshot}
			/>
			<section className="card bg-base-100 shadow">
				<div className="card-body">
					<h2 className="card-title text-base">Add Student</h2>
					<form
						className="grid gap-3 lg:grid-cols-4"
						onSubmit={(event) => void submit(event)}
					>
						<input
							className="input input-bordered"
							placeholder="Full name"
							value={form.fullName}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									fullName: event.target.value,
								}))
							}
						/>
						<input
							className="input input-bordered"
							placeholder="Login ID"
							value={form.userId}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									userId: event.target.value,
								}))
							}
						/>
						<input
							className="input input-bordered"
							placeholder="Email"
							value={form.email}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									email: event.target.value,
								}))
							}
						/>
						<input
							className="input input-bordered"
							placeholder="Password"
							value={form.password}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									password: event.target.value,
								}))
							}
						/>
						<input
							className="input input-bordered"
							placeholder="Roll number"
							value={form.rollNumber}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									rollNumber: event.target.value,
								}))
							}
						/>
						<select
							className="select select-bordered"
							value={form.departmentId}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									departmentId: event.target.value,
								}))
							}
						>
							{context.snapshot.catalogs.departments.map((department) => (
								<option key={department.id} value={department.id}>
									{department.name}
								</option>
							))}
						</select>
						<input
							className="input input-bordered"
							min={1}
							type="number"
							value={form.semester}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									semester: Number(event.target.value),
								}))
							}
						/>
						<select
							className="select select-bordered"
							value={form.section}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									section: event.target.value,
								}))
							}
						>
							{["A", "B", "C"].map((sectionValue) => (
								<option key={sectionValue}>{sectionValue}</option>
							))}
						</select>
						<button
							className="btn btn-secondary lg:col-span-4"
							disabled={busy}
							type="submit"
						>
							{busy ? (
								<span className="loading loading-spinner" />
							) : (
								<Plus size={16} />
							)}
							Add Student
						</button>
					</form>
				</div>
			</section>
			<StudentsTable rows={rows} onRemove={(id) => void remove(id)} />
		</div>
	)
}

function Filters({
	departmentId,
	setDepartmentId,
	semester,
	setSemester,
	search,
	setSearch,
	snapshot,
}: {
	departmentId: string
	setDepartmentId: (value: string) => void
	semester: string
	setSemester: (value: string) => void
	search: string
	setSearch: (value: string) => void
	snapshot: AppSnapshot
}) {
	return (
		<div className="grid gap-3 rounded bg-base-100 p-4 shadow md:grid-cols-[1fr_180px_1fr]">
			<select
				className="select select-bordered"
				value={departmentId}
				onChange={(event) => setDepartmentId(event.target.value)}
			>
				<option value="">All departments</option>
				{snapshot.catalogs.departments.map((department) => (
					<option key={department.id} value={department.id}>
						{department.name}
					</option>
				))}
			</select>
			<select
				className="select select-bordered"
				value={semester}
				onChange={(event) => setSemester(event.target.value)}
			>
				<option value="">All semesters</option>
				{snapshot.catalogs.semesters.map((semesterValue) => (
					<option key={semesterValue} value={semesterValue}>
						Semester {semesterValue}
					</option>
				))}
			</select>
			<label className="input input-bordered flex items-center gap-2">
				<Search size={16} />
				<input
					className="grow"
					placeholder="Search"
					value={search}
					onChange={(event) => setSearch(event.target.value)}
				/>
			</label>
		</div>
	)
}

function StudentsTable({
	rows,
	onRemove,
}: {
	rows: StudentAttendanceOverview[]
	onRemove: (studentUserId: string) => void
}) {
	return (
		<section className="card bg-base-100 shadow">
			<div className="card-body">
				<h2 className="card-title text-base">Attendance Overview</h2>
				<div className="overflow-x-auto">
					<table className="table table-zebra table-sm">
						<thead>
							<tr>
								<th>Student</th>
								<th>Semester</th>
								<th>Section</th>
								<th>Subjects</th>
								<th>Total</th>
								<th>Present</th>
								<th>Absent</th>
								<th>Late</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{rows.map((student) => (
								<tr key={student.profileId}>
									<td>
										<div className="font-semibold">{student.name}</div>
										<div className="text-xs opacity-60">{student.uniNo}</div>
									</td>
									<td>{student.semester}</td>
									<td>{student.section}</td>
									<td>{student.subjects.length}</td>
									<td>{student.totals.total}</td>
									<td>{student.totals.present}</td>
									<td>{student.totals.absent}</td>
									<td>{student.totals.late}</td>
									<td className="text-right">
										<button
											className="btn btn-ghost btn-xs text-error"
											type="button"
											onClick={() => onRemove(student.studentUserId)}
										>
											<Trash2 size={14} />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	)
}

function AdminTeachersPage({ context }: { context: MutationContext }) {
	const admin = context.snapshot.admin
	const [departmentId, setDepartmentId] = useState("")
	const [semester, setSemester] = useState("")
	const [search, setSearch] = useState("")
	const [busy, setBusy] = useState(false)
	const [form, setForm] = useState<CreateTeacherInput>({
		fullName: "",
		userId: "",
		email: "",
		password: "Teacher@123",
		employeeId: "",
		departmentIds: [context.snapshot.catalogs.departments[0]?.id ?? ""].filter(
			Boolean,
		),
		subjectIds: [],
		phone: "",
	})
	if (!admin) return null
	const subjectsForForm = context.snapshot.catalogs.subjects.filter(
		(subject) =>
			form.departmentIds.length > 0
				? form.departmentIds.includes(subject.departmentId)
				: true,
	)
	const rows = admin.teachers.filter((teacher) => {
		if (departmentId && teacher.departmentId !== departmentId) return false
		if (semester && teacher.semester !== Number(semester)) return false
		if (
			search &&
			!filterText(
				teacher.teacherName,
				teacher.uniqueId,
				teacher.email,
				teacher.subjectName,
			).includes(search.toLowerCase())
		)
			return false
		return true
	})

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setBusy(true)
		try {
			const next = await createTeacherAction({
				data: { token: context.token, teacher: form },
			})
			context.setSnapshot(next)
			setForm((current) => ({
				...current,
				fullName: "",
				userId: "",
				email: "",
				employeeId: "",
				subjectIds: [],
			}))
		} catch (cause) {
			context.setError(errorMessage(cause))
		} finally {
			setBusy(false)
		}
	}

	async function remove(profileId: string) {
		if (!window.confirm("Remove this teacher account?")) return
		try {
			context.setSnapshot(
				await deleteTeacherAction({
					data: { token: context.token, id: profileId },
				}),
			)
		} catch (cause) {
			context.setError(errorMessage(cause))
		}
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Teachers"
				description="Teacher assignments, subjects, departments, and active accounts."
			/>
			<Filters
				departmentId={departmentId}
				setDepartmentId={setDepartmentId}
				semester={semester}
				setSemester={setSemester}
				search={search}
				setSearch={setSearch}
				snapshot={context.snapshot}
			/>
			<section className="card bg-base-100 shadow">
				<div className="card-body">
					<h2 className="card-title text-base">Assign Teacher</h2>
					<form
						className="grid gap-3 lg:grid-cols-4"
						onSubmit={(event) => void submit(event)}
					>
						<input
							className="input input-bordered"
							placeholder="Full name"
							value={form.fullName}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									fullName: event.target.value,
								}))
							}
						/>
						<input
							className="input input-bordered"
							placeholder="Login ID"
							value={form.userId}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									userId: event.target.value,
								}))
							}
						/>
						<input
							className="input input-bordered"
							placeholder="Email"
							value={form.email}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									email: event.target.value,
								}))
							}
						/>
						<input
							className="input input-bordered"
							placeholder="Employee ID"
							value={form.employeeId}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									employeeId: event.target.value,
								}))
							}
						/>
						<select
							className="select select-bordered"
							value={form.departmentIds[0] ?? ""}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									departmentIds: [event.target.value],
									subjectIds: [],
								}))
							}
						>
							{context.snapshot.catalogs.departments.map((department) => (
								<option key={department.id} value={department.id}>
									{department.name}
								</option>
							))}
						</select>
						<input
							className="input input-bordered"
							placeholder="Password"
							value={form.password}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									password: event.target.value,
								}))
							}
						/>
						<div className="lg:col-span-2 grid max-h-28 gap-1 overflow-y-auto rounded border border-base-300 p-2">
							{subjectsForForm.map((subject) => (
								<label
									key={subject.id}
									className="label cursor-pointer justify-start gap-2 py-1"
								>
									<input
										className="checkbox checkbox-sm"
										type="checkbox"
										checked={form.subjectIds.includes(subject.id)}
										onChange={(event) =>
											setForm((current) => ({
												...current,
												subjectIds: event.target.checked
													? [...current.subjectIds, subject.id]
													: current.subjectIds.filter(
															(id) => id !== subject.id,
														),
											}))
										}
									/>
									<span className="label-text">
										{subject.name} ({subject.code}) / Sem {subject.semester}
									</span>
								</label>
							))}
						</div>
						<button
							className="btn btn-secondary lg:col-span-4"
							disabled={busy}
							type="submit"
						>
							{busy ? (
								<span className="loading loading-spinner" />
							) : (
								<UserPlus size={16} />
							)}
							Create Teacher
						</button>
					</form>
				</div>
			</section>
			<section className="card bg-base-100 shadow">
				<div className="card-body">
					<h2 className="card-title text-base">Assignments</h2>
					<div className="overflow-x-auto">
						<table className="table table-zebra table-sm">
							<thead>
								<tr>
									<th>Teacher</th>
									<th>Subject</th>
									<th>Department</th>
									<th>Semester</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{rows.map((row) => (
									<tr key={row.rowId}>
										<td>
											<div className="font-semibold">{row.teacherName}</div>
											<div className="text-xs opacity-60">{row.uniqueId}</div>
										</td>
										<td>
											{row.subjectName} ({row.subjectCode})
										</td>
										<td>{row.departmentName}</td>
										<td>{row.semester || "-"}</td>
										<td className="text-right">
											<button
												className="btn btn-ghost btn-xs text-error"
												type="button"
												onClick={() => void remove(row.profileId)}
											>
												<Trash2 size={14} />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</section>
		</div>
	)
}

function AdminTimetablePage({ context }: { context: MutationContext }) {
	const admin = context.snapshot.admin
	const [departmentId, setDepartmentId] = useState("")
	const [semester, setSemester] = useState("")
	const [section, setSection] = useState("")
	const [search, setSearch] = useState("")
	const [busy, setBusy] = useState("")
	const [form, setForm] = useState<TimetableInput>({
		departmentId: context.snapshot.catalogs.departments[0]?.id ?? "",
		semester: context.snapshot.catalogs.semesters[0] ?? 1,
		section: "A",
		day: "Monday",
		startTime: "09:00",
		endTime: "10:00",
		subjectId: context.snapshot.catalogs.subjects[0]?.id ?? "",
		teacherId: context.snapshot.catalogs.teachers[0]?.userId ?? "",
		roomNo: "301",
		isPublished: true,
	})
	if (!admin) return null
	const rows = admin.timetable.filter((slot) => {
		if (departmentId && slot.departmentId !== departmentId) return false
		if (semester && slot.semester !== Number(semester)) return false
		if (section && slot.section !== section) return false
		if (
			search &&
			!filterText(
				slot.uid,
				slot.teacherName,
				slot.subjectName,
				slot.timing,
			).includes(search.toLowerCase())
		)
			return false
		return true
	})
	const subjects = context.snapshot.catalogs.subjects.filter(
		(subject) =>
			subject.departmentId === form.departmentId &&
			subject.semester === form.semester,
	)
	const teachers = context.snapshot.catalogs.teachers.filter((teacher) =>
		teacher.subjects.some((subject) => subject.id === form.subjectId),
	)

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setBusy("save")
		try {
			const next = await saveTimetableSlotAction({
				data: { token: context.token, slot: form },
			})
			context.setSnapshot(next)
			setForm((current) => ({ ...current, id: undefined }))
		} catch (cause) {
			context.setError(errorMessage(cause))
		} finally {
			setBusy("")
		}
	}

	async function publish() {
		if (!departmentId || !semester || !section) {
			context.setError(
				"Select department, semester, and section before publishing.",
			)
			return
		}
		setBusy("publish")
		try {
			context.setSnapshot(
				await publishTimetableAction({
					data: {
						token: context.token,
						cohort: { departmentId, semester: Number(semester), section },
					},
				}),
			)
		} catch (cause) {
			context.setError(errorMessage(cause))
		} finally {
			setBusy("")
		}
	}

	async function remove(slotId: string) {
		if (
			!window.confirm("Delete this timetable slot and its attendance records?")
		)
			return
		try {
			context.setSnapshot(
				await deleteTimetableSlotAction({
					data: { token: context.token, id: slotId },
				}),
			)
		} catch (cause) {
			context.setError(errorMessage(cause))
		}
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Timetable"
				description="Filter, add, edit, delete, and publish cohort timetable slots."
				action={
					<button
						className="btn btn-primary"
						type="button"
						onClick={() => void publish()}
						disabled={busy === "publish"}
					>
						{busy === "publish" ? (
							<span className="loading loading-spinner" />
						) : (
							<CalendarDays size={16} />
						)}
						Publish Cohort
					</button>
				}
			/>
			<div className="grid gap-3 rounded bg-base-100 p-4 shadow-sm ring-1 ring-base-300/70 sm:grid-cols-2 xl:grid-cols-4">
				<select
					className="select select-bordered"
					value={departmentId}
					onChange={(event) => setDepartmentId(event.target.value)}
				>
					<option value="">All departments</option>
					{context.snapshot.catalogs.departments.map((department) => (
						<option key={department.id} value={department.id}>
							{department.name}
						</option>
					))}
				</select>
				<select
					className="select select-bordered"
					value={semester}
					onChange={(event) => setSemester(event.target.value)}
				>
					<option value="">All semesters</option>
					{context.snapshot.catalogs.semesters.map((semesterValue) => (
						<option key={semesterValue} value={semesterValue}>
							Semester {semesterValue}
						</option>
					))}
				</select>
				<select
					className="select select-bordered"
					value={section}
					onChange={(event) => setSection(event.target.value)}
				>
					<option value="">All sections</option>
					{context.snapshot.catalogs.sections.map((sectionValue) => (
						<option key={sectionValue}>{sectionValue}</option>
					))}
				</select>
				<label className="input input-bordered flex items-center gap-2">
					<Search size={16} />
					<input
						className="grow"
						placeholder="Search timetable"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</label>
			</div>
			<section className="card bg-base-100 shadow">
				<div className="card-body">
					<h2 className="card-title text-base">
						{form.id ? "Edit Slot" : "Add Slot"}
					</h2>
					<form
						className="grid gap-3 lg:grid-cols-5"
						onSubmit={(event) => void submit(event)}
					>
						<select
							className="select select-bordered"
							value={form.departmentId}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									departmentId: event.target.value,
									subjectId: "",
								}))
							}
						>
							{context.snapshot.catalogs.departments.map((department) => (
								<option key={department.id} value={department.id}>
									{department.name}
								</option>
							))}
						</select>
						<input
							className="input input-bordered"
							min={1}
							type="number"
							value={form.semester}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									semester: Number(event.target.value),
									subjectId: "",
								}))
							}
						/>
						<select
							className="select select-bordered"
							value={form.section}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									section: event.target.value,
								}))
							}
						>
							{["A", "B", "C"].map((sectionValue) => (
								<option key={sectionValue}>{sectionValue}</option>
							))}
						</select>
						<select
							className="select select-bordered"
							value={form.day}
							onChange={(event) =>
								setForm((current) => ({ ...current, day: event.target.value }))
							}
						>
							{days.map((day) => (
								<option key={day}>{day}</option>
							))}
						</select>
						<input
							className="input input-bordered"
							placeholder="Room"
							value={form.roomNo}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									roomNo: event.target.value,
								}))
							}
						/>
						<input
							className="input input-bordered"
							type="time"
							value={form.startTime}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									startTime: event.target.value,
								}))
							}
						/>
						<input
							className="input input-bordered"
							type="time"
							value={form.endTime}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									endTime: event.target.value,
								}))
							}
						/>
						<select
							className="select select-bordered lg:col-span-2"
							value={form.subjectId}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									subjectId: event.target.value,
									teacherId: "",
								}))
							}
						>
							<option value="">Select subject</option>
							{subjects.map((subject) => (
								<option key={subject.id} value={subject.id}>
									{subject.name} ({subject.code})
								</option>
							))}
						</select>
						<select
							className="select select-bordered"
							value={form.teacherId}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									teacherId: event.target.value,
								}))
							}
						>
							<option value="">Select teacher</option>
							{teachers.map((teacher) => (
								<option key={teacher.userId} value={teacher.userId}>
									{teacher.fullName}
								</option>
							))}
						</select>
						<label className="label cursor-pointer justify-start gap-3">
							<input
								className="toggle toggle-primary"
								type="checkbox"
								checked={form.isPublished}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										isPublished: event.target.checked,
									}))
								}
							/>
							<span className="label-text">Published</span>
						</label>
						<button
							className="btn btn-secondary lg:col-span-4"
							disabled={busy === "save"}
							type="submit"
						>
							{busy === "save" ? (
								<span className="loading loading-spinner" />
							) : (
								<Save size={16} />
							)}
							{form.id ? "Save Slot" : "Add Slot"}
						</button>
					</form>
				</div>
			</section>
			<TimetableTable
				slots={rows}
				onEdit={(slot) =>
					setForm({
						id: slot.id,
						departmentId: slot.departmentId,
						semester: slot.semester,
						section: slot.section,
						day: slot.day,
						startTime: slot.startTime,
						endTime: slot.endTime,
						subjectId: slot.subjectId,
						teacherId: slot.teacherId,
						roomNo: slot.roomNo,
						isPublished: slot.isPublished,
					})
				}
				onRemove={(slotId) => void remove(slotId)}
			/>
		</div>
	)
}

function TimetableTable({
	slots,
	onEdit,
	onRemove,
}: {
	slots: TimetableSlot[]
	onEdit?: (slot: TimetableSlot) => void
	onRemove?: (slotId: string) => void
}) {
	return (
		<section className="card bg-base-100 shadow">
			<div className="card-body">
				<h2 className="card-title text-base">Schedule</h2>
				<div className="overflow-x-auto">
					<table className="table table-zebra table-sm">
						<thead>
							<tr>
								<th>UID</th>
								<th>Teacher</th>
								<th>Subject</th>
								<th>Cohort</th>
								<th>Timing</th>
								<th>Status</th>
								{onEdit || onRemove ? <th /> : null}
							</tr>
						</thead>
						<tbody>
							{slots.map((slot) => (
								<tr key={slot.id}>
									<td>{slot.uid}</td>
									<td>{slot.teacherName}</td>
									<td>
										{slot.subjectName} ({slot.subjectCode})
									</td>
									<td>
										{slot.departmentCode} / Sem {slot.semester} / {slot.section}
									</td>
									<td>{slot.timing}</td>
									<td>
										<span
											className={
												slot.isPublished ? "badge badge-success" : "badge"
											}
										>
											{slot.isPublished ? "Published" : "Draft"}
										</span>
									</td>
									{onEdit || onRemove ? (
										<td className="text-right">
											{onEdit ? (
												<button
													className="btn btn-ghost btn-xs"
													type="button"
													onClick={() => onEdit(slot)}
												>
													<Pencil size={14} /> Edit
												</button>
											) : null}
											{onRemove ? (
												<button
													className="btn btn-ghost btn-xs text-error"
													type="button"
													onClick={() => onRemove(slot.id)}
												>
													<Trash2 size={14} />
												</button>
											) : null}
										</td>
									) : null}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	)
}

function AdminNotificationsPage({ context }: { context: MutationContext }) {
	const [form, setForm] = useState<NotificationInput>({
		title: "",
		message: "",
		priority: "normal",
		targetType: "all",
		targetId: "",
	})
	const [departmentId, setDepartmentId] = useState(
		context.snapshot.catalogs.departments[0]?.id ?? "",
	)
	const [busy, setBusy] = useState(false)
	const recipients =
		form.targetType === "student"
			? context.snapshot.catalogs.students
					.filter((student) => student.departmentId === departmentId)
					.map((student) => ({
						id: student.userId,
						label: `${student.fullName} (${student.loginId})`,
					}))
			: form.targetType === "teacher"
				? context.snapshot.catalogs.teachers
						.filter((teacher) =>
							teacher.departments.some(
								(department) => department.id === departmentId,
							),
						)
						.map((teacher) => ({
							id: teacher.userId,
							label: `${teacher.fullName} (${teacher.loginId})`,
						}))
				: []

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setBusy(true)
		try {
			const targetId =
				form.targetType === "department" ? departmentId : form.targetId
			context.setSnapshot(
				await sendNotificationAction({
					data: { token: context.token, notification: { ...form, targetId } },
				}),
			)
			setForm((current) => ({
				...current,
				title: "",
				message: "",
				targetId: "",
			}))
		} catch (cause) {
			context.setError(errorMessage(cause))
		} finally {
			setBusy(false)
		}
	}

	return (
		<div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
			<section>
				<PageHeader
					title="Notifications"
					description="Send global, department, student, or teacher notifications."
				/>
				<form
					className="card bg-base-100 shadow"
					onSubmit={(event) => void submit(event)}
				>
					<div className="card-body gap-4">
						<input
							className="input input-bordered"
							placeholder="Title"
							value={form.title}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									title: event.target.value,
								}))
							}
						/>
						<textarea
							className="textarea textarea-bordered min-h-32"
							placeholder="Message"
							value={form.message}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									message: event.target.value,
								}))
							}
						/>
						<div className="grid gap-3 sm:grid-cols-2">
							<select
								className="select select-bordered"
								value={form.priority}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										priority: event.target
											.value as NotificationInput["priority"],
									}))
								}
							>
								<option value="low">Low</option>
								<option value="normal">Normal</option>
								<option value="high">High</option>
							</select>
							<select
								className="select select-bordered"
								value={form.targetType}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										targetType: event.target
											.value as NotificationInput["targetType"],
										targetId: "",
									}))
								}
							>
								<option value="all">Global</option>
								<option value="department">Department</option>
								<option value="student">Student</option>
								<option value="teacher">Teacher</option>
							</select>
						</div>
						{form.targetType !== "all" ? (
							<select
								className="select select-bordered"
								value={departmentId}
								onChange={(event) => setDepartmentId(event.target.value)}
							>
								{context.snapshot.catalogs.departments.map((department) => (
									<option key={department.id} value={department.id}>
										{department.name}
									</option>
								))}
							</select>
						) : null}
						{form.targetType === "student" || form.targetType === "teacher" ? (
							<select
								className="select select-bordered"
								value={form.targetId}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										targetId: event.target.value,
									}))
								}
							>
								<option value="">Select recipient</option>
								{recipients.map((recipient) => (
									<option key={recipient.id} value={recipient.id}>
										{recipient.label}
									</option>
								))}
							</select>
						) : null}
						<button className="btn btn-primary" disabled={busy} type="submit">
							{busy ? (
								<span className="loading loading-spinner" />
							) : (
								<Send size={16} />
							)}
							Send
						</button>
					</div>
				</form>
			</section>
			<NotificationsPage
				context={context}
				notifications={context.snapshot.admin?.notifications ?? []}
			/>
		</div>
	)
}

function StudentDashboardPage({ context }: { context: MutationContext }) {
	const student = context.snapshot.student
	if (!student) return null
	const pdfUrl = `/api/reports/student?token=${encodeURIComponent(context.token)}`
	return (
		<div className="space-y-6">
			<PageHeader
				title="Student Dashboard"
				description={`Attendance profile for ${student.profile.fullName}, semester ${student.profile.semester}, section ${student.profile.section}.`}
				action={
					<a className="btn btn-primary" href={pdfUrl}>
						<FileText size={16} /> PDF Report
					</a>
				}
			/>
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					icon={BookOpen}
					label="Total Classes"
					value={student.summary.total}
				/>
				<MetricCard
					icon={CheckCircle2}
					label="Present"
					value={student.summary.present}
				/>
				<MetricCard
					icon={AlertCircle}
					label="Absent"
					value={student.summary.absent}
				/>
				<MetricCard
					icon={ClipboardCheck}
					label="Attendance"
					value={`${student.summary.percentage}%`}
					helper={
						student.isSafe ? "All subjects safe" : "Review unsafe subjects"
					}
				/>
			</div>
			<div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
				<ChartCard title="Overall Mix">
					<ResponsiveContainer>
						<BarChart data={[student.summary]}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="total" hide />
							<YAxis allowDecimals={false} />
							<Tooltip />
							<Bar dataKey="present" fill="#36d399" />
							<Bar dataKey="absent" fill="#f87272" />
							<Bar dataKey="late" fill="#fbbd23" />
						</BarChart>
					</ResponsiveContainer>
				</ChartCard>
				<section className="card bg-base-100 shadow">
					<div className="card-body">
						<h2 className="card-title text-base">75% Safe Zone</h2>
						<div className="overflow-x-auto">
							<table className="table table-sm">
								<thead>
									<tr>
										<th>Subject</th>
										<th>Attendance</th>
										<th>Needed</th>
										<th>Status</th>
									</tr>
								</thead>
								<tbody>
									{student.subjectWise.map((subject) => (
										<tr key={subject.subjectId}>
											<td>
												{subject.subjectName} ({subject.subjectCode})
											</td>
											<td>{subject.percentage}%</td>
											<td>
												{subject.classesNeeded === 0
													? "OK"
													: `+${subject.classesNeeded}`}
											</td>
											<td>
												<span
													className={
														subject.isSafe
															? "badge badge-success gap-1"
															: "badge badge-error gap-1"
													}
												>
													{subject.isSafe ? (
														<CheckCircle2 size={14} />
													) : (
														<AlertCircle size={14} />
													)}
													{subject.isSafe ? "Safe" : "Unsafe"}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</section>
			</div>
		</div>
	)
}

function StudentAttendancePage({ context }: { context: MutationContext }) {
	const student = context.snapshot.student
	const [subjectId, setSubjectId] = useState("")
	const [status, setStatus] = useState("")
	if (!student) return null
	const rows = student.attendance.filter((record) => {
		if (subjectId && record.subjectId !== subjectId) return false
		if (status && record.status !== status) return false
		return true
	})
	return (
		<div className="space-y-6">
			<PageHeader
				title="Attendance"
				description="Personal attendance records with subject and status filters."
				action={
					<a
						className="btn btn-primary"
						href={`/api/reports/student?token=${encodeURIComponent(context.token)}`}
					>
						<FileText size={16} /> PDF
					</a>
				}
			/>
			<div className="grid gap-3 rounded bg-base-100 p-4 shadow md:grid-cols-2">
				<select
					className="select select-bordered"
					value={subjectId}
					onChange={(event) => setSubjectId(event.target.value)}
				>
					<option value="">All subjects</option>
					{student.subjectWise.map((subject) => (
						<option key={subject.subjectId} value={subject.subjectId}>
							{subject.subjectName}
						</option>
					))}
				</select>
				<select
					className="select select-bordered"
					value={status}
					onChange={(event) => setStatus(event.target.value)}
				>
					<option value="">All statuses</option>
					{statusValues.map((statusValue) => (
						<option key={statusValue} value={statusValue}>
							{statusValue}
						</option>
					))}
				</select>
			</div>
			<AttendanceRecordsTable rows={rows} />
		</div>
	)
}

function AttendanceRecordsTable({
	rows,
}: {
	rows: NonNullable<AppSnapshot["student"]>["attendance"]
}) {
	return (
		<section className="card bg-base-100 shadow">
			<div className="card-body">
				<h2 className="card-title text-base">Records</h2>
				<div className="overflow-x-auto">
					<table className="table table-zebra table-sm">
						<thead>
							<tr>
								<th>Date</th>
								<th>Student</th>
								<th>Subject</th>
								<th>Teacher</th>
								<th>Status</th>
								<th>Remarks</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((record) => (
								<tr key={record.id}>
									<td>{record.date}</td>
									<td>{record.studentName}</td>
									<td>
										{record.subjectName} ({record.subjectCode})
									</td>
									<td>{record.teacherName}</td>
									<td>
										<span className={`${statusBadge(record.status)} gap-1`}>
											<StatusIcon status={record.status} />
											{statusLabel(record.status)}
										</span>
									</td>
									<td>{record.remarks || "-"}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	)
}

function TeacherDashboardPage({ context }: { context: MutationContext }) {
	const teacher = context.snapshot.teacher
	if (!teacher) return null
	return (
		<div className="space-y-6">
			<PageHeader
				title="Teacher Dashboard"
				description={`Live IST schedule for ${context.snapshot.user.fullName}.`}
				action={
					<a
						className="btn btn-primary"
						href={`/api/reports/teacher?token=${encodeURIComponent(context.token)}`}
					>
						<FileText size={16} /> PDF Report
					</a>
				}
			/>
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					icon={CalendarDays}
					label="Date"
					value={teacher.dashboard.date}
				/>
				<MetricCard
					icon={Clock3}
					label="IST Time"
					value={teacher.dashboard.time}
				/>
				<MetricCard
					icon={BookOpen}
					label="Today Assigned"
					value={teacher.dashboard.totalAssignedClasses}
				/>
				<MetricCard
					icon={History}
					label="Pending"
					value={teacher.dashboard.totalClassesToTake}
				/>
			</div>
			<section className="card bg-base-100 shadow-sm ring-1 ring-base-300/70">
				<div className="card-body gap-4 p-4 sm:p-5">
					<h2 className="card-title text-base">
						<CalendarCheck size={18} />
						Today Classes
					</h2>
					{teacher.dashboard.classes.length > 0 ? (
						<>
							<div className="grid gap-3 md:hidden">
								{teacher.dashboard.classes.map((slot) => (
									<article
										className="rounded border border-base-300 bg-base-200/40 p-3"
										key={slot.id}
									>
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<div className="break-words font-semibold">
													{slot.subject}
												</div>
												<div className="mt-1 text-sm text-base-content/65">
													Sem {slot.semester} / Section {slot.section}
												</div>
											</div>
											<span
												className={`${statusBadge(slot.status)} shrink-0 gap-1`}
											>
												<StatusIcon status={slot.status} />
												{statusLabel(slot.status)}
											</span>
										</div>
										<div className="mt-3 flex items-center gap-2 text-sm font-medium">
											<Clock3 size={15} />
											{slot.classTiming}
										</div>
									</article>
								))}
							</div>
							<div className="hidden overflow-x-auto md:block">
								<table className="table table-zebra table-sm">
									<thead>
										<tr>
											<th>Subject</th>
											<th>Cohort</th>
											<th>Timing</th>
											<th>Status</th>
										</tr>
									</thead>
									<tbody>
										{teacher.dashboard.classes.map((slot) => (
											<tr key={slot.id}>
												<td className="font-medium">{slot.subject}</td>
												<td>
													Sem {slot.semester} / {slot.section}
												</td>
												<td>{slot.classTiming}</td>
												<td>
													<span className={`${statusBadge(slot.status)} gap-1`}>
														<StatusIcon status={slot.status} />
														{statusLabel(slot.status)}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</>
					) : (
						<div className="rounded bg-base-200 p-4 text-sm text-base-content/65">
							No classes scheduled for today.
						</div>
					)}
				</div>
			</section>
		</div>
	)
}

function TeacherAttendancePage({ context }: { context: MutationContext }) {
	const teacher = context.snapshot.teacher
	const defaultSlot = teacher?.timetable[0]
	const [input, setInput] = useState<RosterInput>({
		departmentId: defaultSlot?.departmentId ?? "",
		semester: defaultSlot?.semester ?? 1,
		section: defaultSlot?.section ?? "A",
		subjectId: defaultSlot?.subjectId ?? "",
		timetableId: defaultSlot?.id,
		date: todayInput(),
	})
	const [roster, setRoster] = useState<RosterResult | null>(null)
	const [busy, setBusy] = useState("")
	if (!teacher) return null
	const slots = teacher.timetable.filter(
		(slot) =>
			slot.departmentId === input.departmentId &&
			slot.semester === input.semester &&
			slot.section === input.section,
	)
	const selectedSlot = teacher.timetable.find(
		(slot) => slot.id === input.timetableId,
	)
	const rosterSummary = roster
		? statusValues.map((status) => ({
				status,
				count: roster.students.filter((student) => student.status === status)
					.length,
			}))
		: []

	async function load() {
		setBusy("load")
		try {
			setRoster(
				await loadRosterAction({
					data: { token: context.token, roster: input },
				}),
			)
		} catch (cause) {
			context.setError(errorMessage(cause))
		} finally {
			setBusy("")
		}
	}

	async function submit() {
		if (!roster) return
		setBusy("submit")
		try {
			const attendance: SubmitAttendanceInput = {
				...input,
				timetableId: roster.timetableId,
				subjectId: roster.subjectId,
				date: roster.date,
				students: roster.students.map((student) => ({
					studentId: student.studentId,
					status: student.status,
					remarks: student.remarks,
				})),
			}
			const result = await submitAttendanceAction({
				data: { token: context.token, attendance },
			})
			context.setSnapshot(result.snapshot)
			setRoster(result.roster)
		} catch (cause) {
			context.setError(errorMessage(cause))
		} finally {
			setBusy("")
		}
	}

	function setAll(status: AttendanceStatus) {
		setRoster((current) =>
			current
				? {
						...current,
						students: current.students.map((student) => ({
							...student,
							status,
						})),
					}
				: current,
		)
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Mark Attendance"
				description="Open any assigned slot/date, revise saved statuses, and persist the latest attendance sheet."
			/>
			<section className="card bg-base-100 shadow">
				<div className="card-body">
					<div className="grid gap-3 lg:grid-cols-5">
						<select
							className="select select-bordered"
							value={input.departmentId}
							onChange={(event) =>
								setInput((current) => ({
									...current,
									departmentId: event.target.value,
									timetableId: undefined,
								}))
							}
						>
							{Array.from(
								new Map(
									teacher.timetable.map((slot) => [slot.departmentId, slot]),
								).values(),
							).map((slot) => (
								<option key={slot.departmentId} value={slot.departmentId}>
									{slot.departmentName}
								</option>
							))}
						</select>
						<select
							className="select select-bordered"
							value={input.semester}
							onChange={(event) =>
								setInput((current) => ({
									...current,
									semester: Number(event.target.value),
									timetableId: undefined,
								}))
							}
						>
							{Array.from(
								new Set(teacher.timetable.map((slot) => slot.semester)),
							).map((semester) => (
								<option key={semester} value={semester}>
									Semester {semester}
								</option>
							))}
						</select>
						<select
							className="select select-bordered"
							value={input.section}
							onChange={(event) =>
								setInput((current) => ({
									...current,
									section: event.target.value,
									timetableId: undefined,
								}))
							}
						>
							{Array.from(
								new Set(teacher.timetable.map((slot) => slot.section)),
							).map((sectionValue) => (
								<option key={sectionValue}>{sectionValue}</option>
							))}
						</select>
						<input
							className="input input-bordered"
							type="date"
							value={input.date}
							onChange={(event) =>
								setInput((current) => ({
									...current,
									date: event.target.value,
								}))
							}
						/>
						<button
							className="btn btn-primary"
							type="button"
							onClick={() => void load()}
							disabled={busy === "load"}
						>
							{busy === "load" ? (
								<span className="loading loading-spinner" />
							) : (
								<BookOpen size={16} />
							)}
							Load Roster
						</button>
						<select
							className="select select-bordered lg:col-span-5"
							value={input.timetableId ?? ""}
							onChange={(event) => {
								const slot = teacher.timetable.find(
									(candidate) => candidate.id === event.target.value,
								)
								if (slot)
									setInput({
										departmentId: slot.departmentId,
										semester: slot.semester,
										section: slot.section,
										subjectId: slot.subjectId,
										timetableId: slot.id,
										date: input.date,
									})
							}}
						>
							<option value="">Select assigned timetable slot</option>
							{slots.map((slot) => (
								<option key={slot.id} value={slot.id}>
									{slot.day} / {slot.startTime}-{slot.endTime} /{" "}
									{slot.subjectName} / Sem {slot.semester}-{slot.section}
								</option>
							))}
						</select>
					</div>
					{selectedSlot ? (
						<div className="mt-4 grid gap-3 md:grid-cols-3">
							<div className="rounded border border-base-300 p-3">
								<div className="flex items-center gap-2 text-sm font-semibold">
									<BookOpen size={16} />
									{selectedSlot.subjectName}
								</div>
								<div className="mt-1 text-xs text-base-content/60">
									{selectedSlot.subjectCode}
								</div>
							</div>
							<div className="rounded border border-base-300 p-3">
								<div className="flex items-center gap-2 text-sm font-semibold">
									<Building2 size={16} />
									Sem {selectedSlot.semester} / Section {selectedSlot.section}
								</div>
								<div className="mt-1 text-xs text-base-content/60">
									{selectedSlot.departmentName}
								</div>
							</div>
							<div className="rounded border border-base-300 p-3">
								<div className="flex items-center gap-2 text-sm font-semibold">
									<Clock3 size={16} />
									{selectedSlot.day}, {selectedSlot.startTime}-
									{selectedSlot.endTime}
								</div>
								<div className="mt-1 text-xs text-base-content/60">
									Room {selectedSlot.roomNo}
								</div>
							</div>
						</div>
					) : null}
				</div>
			</section>
			{roster ? (
				<section className="card bg-base-100 shadow">
					<div className="card-body">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<h2 className="card-title text-base">
									Roster ({roster.students.length})
								</h2>
								<div className="mt-2 flex flex-wrap gap-2">
									<span
										className={
											roster.existingRecords
												? "badge badge-info gap-1"
												: "badge badge-outline gap-1"
										}
									>
										<History size={14} />
										{roster.existingRecords
											? `${roster.existingRecords} saved`
											: "New sheet"}
									</span>
									<span className="badge badge-outline gap-1">
										<CalendarCheck size={14} />
										{roster.date}
									</span>
									{roster.lastEditedAt ? (
										<span className="badge badge-outline gap-1">
											<UserCheck size={14} />
											{roster.lastEditedByName} /{" "}
											{formatDateTime(roster.lastEditedAt)}
										</span>
									) : null}
								</div>
							</div>
							<div className="grid gap-2 sm:flex sm:flex-wrap">
								{statusValues.map((status) => (
									<button
										key={status}
										className="btn btn-sm gap-1 sm:w-auto"
										type="button"
										onClick={() => setAll(status)}
									>
										<StatusIcon status={status} />
										{statusLabel(status)}
									</button>
								))}
							</div>
						</div>
						<div className="grid gap-3 md:grid-cols-3">
							{rosterSummary.map((row) => (
								<div key={row.status} className="rounded bg-base-200 p-3">
									<div className="flex items-center gap-2 text-sm font-semibold">
										<StatusIcon status={row.status} />
										{statusLabel(row.status)}
									</div>
									<div className="mt-1 text-2xl font-black">{row.count}</div>
								</div>
							))}
						</div>
						<div className="overflow-x-auto">
							<table className="table table-zebra table-sm">
								<thead>
									<tr>
										<th>Roll</th>
										<th>Name</th>
										<th>Status</th>
										<th>Remarks</th>
										<th>Saved</th>
									</tr>
								</thead>
								<tbody>
									{roster.students.map((student) => (
										<tr key={student.studentId}>
											<td>{student.universityRoll}</td>
											<td>{student.studentName}</td>
											<td>
												<select
													className="select select-bordered select-sm"
													value={student.status}
													onChange={(event) =>
														setRoster((current) =>
															current
																? {
																		...current,
																		students: current.students.map((row) =>
																			row.studentId === student.studentId
																				? {
																						...row,
																						status: event.target
																							.value as AttendanceStatus,
																					}
																				: row,
																		),
																	}
																: current,
														)
													}
												>
													{statusValues.map((status) => (
														<option key={status} value={status}>
															{status}
														</option>
													))}
												</select>
											</td>
											<td>
												<input
													className="input input-bordered input-sm w-full"
													value={student.remarks}
													onChange={(event) =>
														setRoster((current) =>
															current
																? {
																		...current,
																		students: current.students.map((row) =>
																			row.studentId === student.studentId
																				? {
																						...row,
																						remarks: event.target.value,
																					}
																				: row,
																		),
																	}
																: current,
														)
													}
												/>
											</td>
											<td>
												{student.hasSavedRecord ? (
													<div className="text-xs">
														<span className="badge badge-success badge-sm gap-1">
															<CheckCircle2 size={12} /> Saved
														</span>
														<div className="mt-1 opacity-60">
															{formatDateTime(student.updatedAt)}
														</div>
													</div>
												) : (
													<span className="badge badge-outline badge-sm">
														New
													</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<button
							className="btn btn-primary self-end"
							type="button"
							onClick={() => void submit()}
							disabled={busy === "submit"}
						>
							{busy === "submit" ? (
								<span className="loading loading-spinner" />
							) : (
								<ClipboardCheck size={16} />
							)}
							{roster.existingRecords
								? "Save Attendance Changes"
								: "Submit Attendance"}
						</button>
					</div>
				</section>
			) : null}
		</div>
	)
}

function TeacherAnalysisPage({ context }: { context: MutationContext }) {
	const teacher = context.snapshot.teacher
	const [subjectId, setSubjectId] = useState("")
	const [status, setStatus] = useState("")
	const [query, setQuery] = useState("")
	if (!teacher) return null
	const teacherData = teacher
	const rows = teacherData.analytics.filter((row) => {
		if (subjectId && row.subjectId !== subjectId) return false
		if (status && row.status !== status) return false
		if (
			query &&
			!filterText(row.studentName, row.universityRoll, row.classRoll).includes(
				query.toLowerCase(),
			)
		)
			return false
		return true
	})
	const summary = statusValues.map((statusValue) => ({
		status: statusValue,
		count: rows.filter((row) => row.status === statusValue).length,
	}))
	function exportCsv() {
		const subjectLabel =
			teacherData.profile.subjects.find((subject) => subject.id === subjectId)
				?.name ?? "All subjects"
		const csv = csvRows([
			["Report", "SAMS Teacher Attendance Analysis"],
			["Generated At", new Date().toISOString()],
			["Teacher", context.snapshot.user.fullName],
			["Subject Filter", subjectLabel],
			["Status Filter", status || "All statuses"],
			["Search", query || ""],
			[],
			[
				"University Roll",
				"Class Roll",
				"Student",
				"Subject",
				"Subject Code",
				"Status",
				"Date",
				"Percentage",
			],
			...rows.map((row) => [
				row.universityRoll,
				row.classRoll,
				row.studentName,
				row.subjectName,
				row.subjectCode,
				statusLabel(row.status),
				row.date,
				row.percentage,
			]),
		])
		downloadText(`sams-teacher-analysis-${Date.now()}.csv`, csv)
	}
	return (
		<div className="space-y-6">
			<PageHeader
				title="Analysis Console"
				description="Filter attendance extraction by subject, status, student name, or roll number."
				action={
					<div className="flex gap-2">
						<button
							className="btn btn-outline"
							type="button"
							onClick={exportCsv}
						>
							<Download size={16} /> CSV
						</button>
						<a
							className="btn btn-primary"
							href={`/api/reports/teacher?token=${encodeURIComponent(context.token)}`}
						>
							<FileText size={16} /> PDF
						</a>
					</div>
				}
			/>
			<div className="grid gap-3 rounded bg-base-100 p-4 shadow md:grid-cols-3">
				<select
					className="select select-bordered"
					value={subjectId}
					onChange={(event) => setSubjectId(event.target.value)}
				>
					<option value="">All subjects</option>
					{teacherData.profile.subjects.map((subject) => (
						<option key={subject.id} value={subject.id}>
							{subject.name}
						</option>
					))}
				</select>
				<select
					className="select select-bordered"
					value={status}
					onChange={(event) => setStatus(event.target.value)}
				>
					<option value="">All statuses</option>
					{statusValues.map((statusValue) => (
						<option key={statusValue} value={statusValue}>
							{statusValue}
						</option>
					))}
				</select>
				<label className="input input-bordered flex items-center gap-2">
					<Search size={16} />
					<input
						className="grow"
						placeholder="Student or roll"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>
				</label>
			</div>
			<ChartCard title="Filtered Distribution">
				<ResponsiveContainer>
					<BarChart data={summary}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="status" />
						<YAxis allowDecimals={false} />
						<Tooltip />
						<Bar dataKey="count" fill="#60a5fa" />
					</BarChart>
				</ResponsiveContainer>
			</ChartCard>
			<AnalyticsTable rows={rows} />
		</div>
	)
}

function AnalyticsTable({ rows }: { rows: TeacherAnalyticsRow[] }) {
	return (
		<section className="card bg-base-100 shadow">
			<div className="card-body">
				<h2 className="card-title text-base">Analytics Rows</h2>
				<div className="overflow-x-auto">
					<table className="table table-zebra table-sm">
						<thead>
							<tr>
								<th>Date</th>
								<th>Roll</th>
								<th>Student</th>
								<th>Subject</th>
								<th>Status</th>
								<th>%</th>
							</tr>
						</thead>
						<tbody>
							{rows.slice(0, 300).map((row, index) => (
								<tr
									key={`${row.studentId}-${row.subjectId}-${row.date}-${index}`}
								>
									<td>{row.date}</td>
									<td>{row.universityRoll}</td>
									<td>{row.studentName}</td>
									<td>
										{row.subjectName} ({row.subjectCode})
									</td>
									<td>
										<span className={`${statusBadge(row.status)} gap-1`}>
											<StatusIcon status={row.status} />
											{statusLabel(row.status)}
										</span>
									</td>
									<td>{row.percentage}%</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	)
}

function NotificationsPage({
	notifications,
	context,
}: {
	notifications: NonNullable<AppSnapshot["admin"]>["notifications"]
	context?: MutationContext
}) {
	async function markRead(notificationId: string) {
		if (!context) return
		try {
			context.setSnapshot(
				await markNotificationReadAction({
					data: { token: context.token, id: notificationId },
				}),
			)
		} catch (cause) {
			context.setError(errorMessage(cause))
		}
	}

	return (
		<section className="card bg-base-100 shadow">
			<div className="card-body">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2 className="card-title">
						<Bell size={20} /> Notifications
					</h2>
					<span className="badge badge-outline">
						{
							notifications.filter((notification) => !notification.isRead)
								.length
						}{" "}
						unread
					</span>
				</div>
				<div className="space-y-3">
					{notifications.length === 0 ? (
						<div className="rounded border border-dashed border-base-300 p-6 text-sm text-base-content/60">
							No notifications yet.
						</div>
					) : null}
					{notifications.map((notification) => (
						<article
							key={notification.id}
							className="rounded border border-base-300 p-4"
						>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<h3 className="flex items-center gap-2 font-bold">
									{notification.isRead ? (
										<CheckCircle2 size={16} className="text-success" />
									) : (
										<Bell size={16} className="text-primary" />
									)}
									{notification.title}
								</h3>
								<div className="flex flex-wrap gap-2">
									<span className="badge">{notification.priority}</span>
									<span className="badge badge-outline">
										{notification.targetType}
									</span>
									<span
										className={
											notification.isRead
												? "badge badge-success"
												: "badge badge-warning"
										}
									>
										{notification.isRead ? "Read" : "Unread"}
									</span>
								</div>
							</div>
							<p className="mt-2 text-sm text-base-content/75">
								{notification.message}
							</p>
							<div className="mt-3 flex flex-wrap items-center justify-between gap-3">
								<p className="text-xs text-base-content/50">
									{new Date(notification.sentAt).toLocaleString()}
								</p>
								{context && !notification.isRead ? (
									<button
										className="btn btn-ghost btn-xs"
										type="button"
										onClick={() => void markRead(notification.id)}
									>
										<CheckCircle2 size={14} />
										Mark read
									</button>
								) : null}
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	)
}
