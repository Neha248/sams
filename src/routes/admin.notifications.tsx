import { createFileRoute } from "@tanstack/react-router"
import SamsApp from "../components/SamsApp"

export const Route = createFileRoute("/admin/notifications")({
	component: () => <SamsApp section="admin-notifications" />,
})
