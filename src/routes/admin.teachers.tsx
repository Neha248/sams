import { createFileRoute } from "@tanstack/react-router"
import SamsApp from "../components/SamsApp"

export const Route = createFileRoute("/admin/teachers")({
	component: () => <SamsApp section="admin-teachers" />,
})
