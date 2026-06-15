import { createFileRoute } from "@tanstack/react-router"
import SamsApp from "../components/SamsApp"

export const Route = createFileRoute("/teacher/analysis")({
	component: () => <SamsApp section="teacher-analysis" />,
})
