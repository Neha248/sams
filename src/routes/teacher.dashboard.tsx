import { createFileRoute } from "@tanstack/react-router"
import SamsApp from "../components/SamsApp"

export const Route = createFileRoute("/teacher/dashboard")({
	component: () => <SamsApp section="teacher-dashboard" />,
})
