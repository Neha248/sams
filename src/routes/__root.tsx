import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import type { ReactNode } from "react"
import "../styles.css"

const THEME_INIT_SCRIPT = `
try {
	var t = localStorage.getItem('sams-theme');
	if (t !== 'cupcake' && t !== 'dracula') t = 'dracula';
	document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
`

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "SAMS | Smart Attendance Management System" },
			{
				name: "description",
				content:
					"TanStack Start attendance management system with SQLite storage.",
			},
			{ name: "theme-color", content: "#111827" },
			{ name: "application-name", content: "SAMS" },
			{ name: "apple-mobile-web-app-capable", content: "yes" },
			{ name: "apple-mobile-web-app-title", content: "SAMS" },
		],
		links: [
			{ rel: "manifest", href: "/manifest.webmanifest" },
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
		],
	}),
	shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
	useEffect(() => {
		if (!("serviceWorker" in navigator)) return

		const registerServiceWorker = () => {
			void navigator.serviceWorker.register("/sw.js").catch((error) => {
				console.warn("SAMS service worker registration failed:", error)
			})
		}

		if (document.readyState === "complete") {
			registerServiceWorker()
			return
		}

		window.addEventListener("load", registerServiceWorker, { once: true })
		return () => window.removeEventListener("load", registerServiceWorker)
	}, [])

	return (
		<html lang="en" data-theme="dracula" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body className="min-h-screen bg-base-200 font-sans antialiased">
				{children}
				<Scripts />
			</body>
		</html>
	)
}
