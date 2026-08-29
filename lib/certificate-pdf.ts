import "server-only"

import {PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage} from "pdf-lib"

import {formatCertificateDate} from "@/lib/certificate"
import type {CertificatePayload} from "@/lib/certificate-server"

const PAGE_WIDTH = 841.89
const PAGE_HEIGHT = 595.28

const NAVY = rgb(15 / 255, 23 / 255, 42 / 255)
const MUTED = rgb(100 / 255, 116 / 255, 139 / 255)
const ORANGE = rgb(249 / 255, 115 / 255, 22 / 255)
const WHITE = rgb(1, 1, 1)

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next
      continue
    }
    if (current) lines.push(current)
    current = word
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : [text]
}

function drawCentered(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  y: number,
  color: ReturnType<typeof rgb>,
) {
  const width = font.widthOfTextAtSize(text, size)
  page.drawText(text, {
    x: (PAGE_WIDTH - width) / 2,
    y,
    size,
    font,
    color,
  })
}

function drawCenteredLines(
  page: PDFPage,
  lines: string[],
  font: PDFFont,
  size: number,
  topY: number,
  color: ReturnType<typeof rgb>,
  lineGap: number,
): number {
  let y = topY
  for (const line of lines) {
    drawCentered(page, line, font, size, y, color)
    y -= size + lineGap
  }
  return y
}

/** Three-segment triangle from the Eos mark, flipped into PDF coordinates. */
function drawEosMark(page: PDFPage, x: number, y: number, scale: number) {
  page.drawSvgPath("M11 0 L4 12 H11 L11 0 Z", {
    x,
    y,
    color: ORANGE,
    opacity: 0.55,
    scale,
  })
  page.drawSvgPath("M11 0 L18 12 H11 L11 0 Z", {
    x,
    y,
    color: ORANGE,
    opacity: 0.85,
    scale,
  })
  page.drawSvgPath("M4 12 L11 20 L18 12 H4 Z", {
    x,
    y,
    color: ORANGE,
    scale,
  })
}

export async function buildCertificatePdf(payload: CertificatePayload): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Certificate of Completion — ${payload.courseTitle}`)
  pdf.setAuthor("EOS Academy")
  pdf.setSubject("Certificate of Completion")
  pdf.setCreator("EOS Academy")

  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold)
  const serifItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic)
  const sans = await pdf.embedFont(StandardFonts.Helvetica)

  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: WHITE,
  })
  page.drawRectangle({
    x: 28,
    y: 28,
    width: PAGE_WIDTH - 56,
    height: PAGE_HEIGHT - 56,
    borderColor: rgb(226 / 255, 232 / 255, 240 / 255),
    borderWidth: 1,
  })
  page.drawRectangle({
    x: 36,
    y: 36,
    width: PAGE_WIDTH - 72,
    height: PAGE_HEIGHT - 72,
    borderColor: ORANGE,
    borderWidth: 1.25,
  })

  const markScale = 1.15
  const markWidth = 22 * markScale
  const brand = "EOS Academy"
  const brandSize = 13
  const brandWidth = sans.widthOfTextAtSize(brand, brandSize)
  const headerWidth = markWidth + 10 + brandWidth
  const headerX = (PAGE_WIDTH - headerWidth) / 2
  const headerY = PAGE_HEIGHT - 88
  drawEosMark(page, headerX, headerY - 2, markScale)
  page.drawText(brand, {
    x: headerX + markWidth + 10,
    y: headerY + 4,
    size: brandSize,
    font: sans,
    color: NAVY,
  })

  const maxTextWidth = PAGE_WIDTH - 160

  drawCentered(page, "Certificate of Completion", serifBold, 32, PAGE_HEIGHT - 150, NAVY)

  page.drawRectangle({
    x: PAGE_WIDTH / 2 - 48,
    y: PAGE_HEIGHT - 168,
    width: 96,
    height: 1.5,
    color: ORANGE,
  })

  drawCentered(page, "This certifies that", serifItalic, 14, PAGE_HEIGHT - 200, MUTED)

  const nameLines = wrapText(payload.learnerName, serifBold, 36, maxTextWidth)
  let y = drawCenteredLines(page, nameLines, serifBold, 36, PAGE_HEIGHT - 248, NAVY, 6)

  y -= 10
  drawCentered(page, "has successfully completed", serifItalic, 14, y, MUTED)
  y -= 36

  const titleSize = payload.courseTitle.length > 60 ? 18 : 22
  const titleLines = wrapText(payload.courseTitle, serifBold, titleSize, maxTextWidth)
  y = drawCenteredLines(page, titleLines, serifBold, titleSize, y, NAVY, 4)

  y -= 18
  drawCentered(page, formatCertificateDate(payload.issueDate), sans, 12, y, MUTED)

  drawCentered(
    page,
    "Education · Opportunity · Support",
    sans,
    11,
    64,
    MUTED,
  )

  return pdf.save()
}
