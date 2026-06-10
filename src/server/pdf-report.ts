import PDFDocument from "pdfkit"

type PdfColumn = {
	header: string
	key: string
	width: number
	align?: "left" | "center" | "right"
}

type PdfRow = Record<string, string | number>

export function renderPdf(write: (doc: PDFKit.PDFDocument) => void) {
	return new Promise<Buffer>((resolve) => {
		const doc = new PDFDocument({ margin: 40, size: "A4" })
		const chunks: Buffer[] = []
		doc.on("data", (chunk: Buffer) => chunks.push(chunk))
		doc.on("end", () => resolve(Buffer.concat(chunks)))
		write(doc)
		doc.end()
	})
}

export function pdfResponse(buffer: Buffer, filename: string) {
	return new Response(new Uint8Array(buffer), {
		headers: {
			"content-type": "application/pdf",
			"content-disposition": `attachment; filename="${filename}"`,
		},
	})
}

export function reportTitle(
	doc: PDFKit.PDFDocument,
	title: string,
	subtitle: string,
) {
	doc.font("Helvetica-Bold").fontSize(18).fillColor("#111827").text(title)
	doc.moveDown(0.3)
	doc.font("Helvetica").fontSize(9).fillColor("#6b7280").text(subtitle)
	doc.moveDown()
}

export function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
	doc.moveDown(0.6)
	doc.font("Helvetica-Bold").fontSize(12).fillColor("#111827").text(title)
	doc.moveDown(0.3)
}

export function keyValueGrid(
	doc: PDFKit.PDFDocument,
	rows: Array<[string, string | number]>,
) {
	const startX = doc.page.margins.left
	const labelWidth = 110
	const valueWidth = 360
	for (const [label, value] of rows) {
		if (needsPage(doc, 18)) doc.addPage()
		const y = doc.y
		doc
			.font("Helvetica-Bold")
			.fontSize(9)
			.fillColor("#374151")
			.text(label, startX, y, { width: labelWidth })
		doc
			.font("Helvetica")
			.fontSize(9)
			.fillColor("#111827")
			.text(String(value), startX + labelWidth + 8, y, { width: valueWidth })
		doc.y = y + 18
	}
}

export function dataTable(
	doc: PDFKit.PDFDocument,
	columns: PdfColumn[],
	rows: PdfRow[],
) {
	const startX = doc.page.margins.left
	const rowHeight = 22
	const tableWidth = columns.reduce((sum, column) => sum + column.width, 0)
	drawHeader(doc, columns, startX, rowHeight)
	rows.forEach((row, index) => {
		if (needsPage(doc, rowHeight + 6)) {
			doc.addPage()
			drawHeader(doc, columns, startX, rowHeight)
		}
		const y = doc.y
		if (index % 2 === 0) {
			doc.save()
			doc.rect(startX, y, tableWidth, rowHeight).fill("#f9fafb")
			doc.restore()
		}
		let x = startX
		for (const column of columns) {
			doc
				.font("Helvetica")
				.fontSize(8)
				.fillColor("#111827")
				.text(String(row[column.key] ?? ""), x + 4, y + 6, {
					width: column.width - 8,
					height: rowHeight - 8,
					ellipsis: true,
					align: column.align ?? "left",
				})
			x += column.width
		}
		doc.y = y + rowHeight
	})
	doc.moveDown()
}

function drawHeader(
	doc: PDFKit.PDFDocument,
	columns: PdfColumn[],
	startX: number,
	rowHeight: number,
) {
	if (needsPage(doc, rowHeight + 6)) doc.addPage()
	const y = doc.y
	const tableWidth = columns.reduce((sum, column) => sum + column.width, 0)
	doc.save()
	doc.rect(startX, y, tableWidth, rowHeight).fill("#e5e7eb")
	doc.restore()
	let x = startX
	for (const column of columns) {
		doc
			.font("Helvetica-Bold")
			.fontSize(8)
			.fillColor("#111827")
			.text(column.header, x + 4, y + 6, {
				width: column.width - 8,
				height: rowHeight - 8,
				ellipsis: true,
				align: column.align ?? "left",
			})
		x += column.width
	}
	doc.y = y + rowHeight
}

function needsPage(doc: PDFKit.PDFDocument, height: number) {
	return doc.y + height > doc.page.height - doc.page.margins.bottom
}
