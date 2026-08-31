import "server-only"

import {Resend} from "resend"

import {certificatePagePath} from "@/lib/certificate"

const DEFAULT_FROM = "EOS Academy <onboarding@resend.dev>"
const DEFAULT_REPLY_TO = "info@eosacademy.global"
const ORANGE = "#f97316"
const NAVY = "#0f172a"
const MUTED = "#64748b"

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) return null
  return new Resend(key)
}

function fromAddress(): string {
  return process.env.RESEND_FROM?.trim() || DEFAULT_FROM
}

function replyToAddress(): string {
  return process.env.RESEND_REPLY_TO?.trim() || DEFAULT_REPLY_TO
}

export function greetingName(fullName: string): string {
  const trimmed = fullName.trim()
  if (!trimmed) return "there"
  const space = trimmed.indexOf(" ")
  return space === -1 ? trimmed : trimmed.slice(0, space)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function wrapHtml(title: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#fafafc;font-family:Georgia,'Times New Roman',serif;">
    <div lang="en" dir="ltr" style="margin:0 auto;max-width:560px;padding:32px 24px;background:#ffffff;">
      ${inner}
      <p style="margin:32px 0 0;font-size:14px;line-height:1.5;color:${MUTED};">
        EOS Academy · Education · Opportunity · Support
      </p>
    </div>
  </body>
</html>`
}

function buttonHtml(href: string, label: string): string {
  return `<p style="margin:28px 0 0;">
      <a href="${escapeHtml(href)}" style="display:inline-block;min-height:44px;padding:12px 20px;background:${ORANGE};color:#ffffff;font-family:system-ui,-apple-system,sans-serif;font-size:16px;font-weight:600;line-height:20px;text-decoration:none;border-radius:6px;">
        ${escapeHtml(label)}
      </a>
    </p>`
}

function paragraph(text: string): string {
  return `<p style="margin:16px 0 0;font-size:16px;line-height:1.6;color:${NAVY};font-family:system-ui,-apple-system,sans-serif;">${escapeHtml(text)}</p>`
}

async function sendEmail(input: {
  to: string
  subject: string
  html: string
  text: string
  idempotencyKey: string
}): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.info("RESEND_API_KEY is not set; skipping email", {
      idempotencyKey: input.idempotencyKey,
    })
    return
  }

  try {
    const {error} = await resend.emails.send(
      {
        from: fromAddress(),
        to: [input.to],
        replyTo: replyToAddress(),
        subject: input.subject,
        html: input.html,
        text: input.text,
      },
      {idempotencyKey: input.idempotencyKey},
    )

    if (error) {
      console.error("Failed to send email", {
        idempotencyKey: input.idempotencyKey,
        message: error.message,
      })
    }
  } catch (error) {
    console.error("Failed to send email", {
      idempotencyKey: input.idempotencyKey,
      error,
    })
  }
}

export async function sendWelcomeEmail(input: {
  to: string
  fullName: string
  origin: string
  userId: string
}): Promise<void> {
  const to = input.to.trim()
  if (!to) {
    console.error("Skipping welcome email: missing recipient")
    return
  }

  const name = greetingName(input.fullName)
  const startUrl = `${input.origin.replace(/\/$/, "")}/courses`
  const subject = "Welcome to EOS Academy"
  const html = wrapHtml(
    subject,
    [
      `<h1 style="margin:0;font-size:24px;line-height:1.3;color:${NAVY};">${escapeHtml(subject)}</h1>`,
      paragraph(`Hi ${name},`),
      paragraph(
        "Thanks for joining EOS Academy. Your place on the programme is confirmed.",
      ),
      paragraph("You can start a course whenever you are ready."),
      buttonHtml(startUrl, "Start learning"),
    ].join(""),
  )
  const text = [
    "Welcome to EOS Academy",
    "",
    `Hi ${name},`,
    "",
    "Thanks for joining EOS Academy. Your place on the programme is confirmed.",
    "You can start a course whenever you are ready.",
    "",
    `Start learning: ${startUrl}`,
    "",
    "EOS Academy · Education · Opportunity · Support",
  ].join("\n")

  await sendEmail({
    to,
    subject,
    html,
    text,
    idempotencyKey: `welcome/${input.userId}`,
  })
}

export async function sendCertificateReadyEmail(input: {
  to: string
  fullName: string
  courseTitle: string
  courseSlug: string
  origin: string
  userId: string
  courseId: string
}): Promise<void> {
  const to = input.to.trim()
  if (!to) {
    console.error("Skipping certificate email: missing recipient")
    return
  }

  const name = greetingName(input.fullName)
  const title = input.courseTitle.trim()
  const slug = input.courseSlug.trim()
  if (!title || !slug) {
    console.error("Skipping certificate email: missing course title or slug")
    return
  }
  const downloadUrl = `${input.origin.replace(/\/$/, "")}${certificatePagePath(input.courseSlug)}`
  const subject = `Your certificate for ${title} is ready`
  const html = wrapHtml(
    "Your certificate is ready",
    [
      `<h1 style="margin:0;font-size:24px;line-height:1.3;color:${NAVY};">Your certificate is ready</h1>`,
      paragraph(`Hi ${name},`),
      paragraph(
        `You have completed ${title}. Your certificate of completion is ready to download.`,
      ),
      buttonHtml(downloadUrl, "Download certificate"),
    ].join(""),
  )
  const text = [
    "Your certificate is ready",
    "",
    `Hi ${name},`,
    "",
    `You have completed ${title}. Your certificate of completion is ready to download.`,
    "",
    `Download certificate: ${downloadUrl}`,
    "",
    "EOS Academy · Education · Opportunity · Support",
  ].join("\n")

  await sendEmail({
    to,
    subject,
    html,
    text,
    idempotencyKey: `certificate-ready/${input.userId}/${input.courseId}`,
  })
}
