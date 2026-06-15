import { createFileRoute } from "@tanstack/react-router"
import SamsApp from "../components/SamsApp"

export const Route = createFileRoute("/notifications")({
	component: () => <SamsApp section="student-notifications" />,
})
