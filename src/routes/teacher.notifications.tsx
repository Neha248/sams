import { createFileRoute } from "@tanstack/react-router"
import SamsApp from "../components/SamsApp"

export const Route = createFileRoute("/teacher/notifications")({
	component: () => <SamsApp section="teacher-notifications" />,
})
