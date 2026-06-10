import { createFileRoute } from "@tanstack/react-router"
import SamsApp from "../components/SamsApp"

export const Route = createFileRoute("/admin/students")({
	component: () => <SamsApp section="admin-students" />,
})
