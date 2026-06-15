import { createFileRoute } from "@tanstack/react-router"
import SamsApp from "../components/SamsApp"

export const Route = createFileRoute("/timetable")({
	component: () => <SamsApp section="student-timetable" />,
})
