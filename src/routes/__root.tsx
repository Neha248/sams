import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
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
		],
	}),
	shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
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
