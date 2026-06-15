import { createFileRoute } from "@tanstack/react-router"
import SamsApp from "../components/SamsApp"

export const Route = createFileRoute("/admin/timetable")({
	component: () => <SamsApp section="admin-timetable" />,
})
