import { createFileRoute } from "@tanstack/react-router"
import SamsApp from "../components/SamsApp"

export const Route = createFileRoute("/login")({
	component: () => <SamsApp section="login" />,
})
