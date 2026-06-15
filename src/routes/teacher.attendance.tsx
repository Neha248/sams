import { createFileRoute } from "@tanstack/react-router"
import SamsApp from "../components/SamsApp"

export const Route = createFileRoute("/teacher/attendance")({
	component: () => <SamsApp section="teacher-attendance" />,
})
