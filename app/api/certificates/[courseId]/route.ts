import {auth} from "@clerk/nextjs/server"
import {NextResponse} from "next/server"

import {certificateFilename} from "@/lib/certificate"
import {buildCertificatePdf} from "@/lib/certificate-pdf"
import {loadCertificatePayload} from "@/lib/certificate-server"
import {isSafeSanityId} from "@/lib/forms/ids"

export const runtime = "nodejs"

type RouteContext = {
  params: Promise<{courseId: string}>
}

export async function GET(_request: Request, context: RouteContext) {
  const {isAuthenticated, userId} = await auth()
  if (!isAuthenticated || !userId) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401})
  }

  const {courseId: rawId} = await context.params
  const courseId = decodeURIComponent(rawId)
  if (!isSafeSanityId(courseId)) {
    return NextResponse.json({error: "Invalid course id"}, {status: 400})
  }

  const result = await loadCertificatePayload(userId, courseId)
  if (!result.ok) {
    const message = result.status === 404 ? "Unknown course" : "Certificate is not available"
    return NextResponse.json({error: message}, {status: result.status})
  }

  const bytes = await buildCertificatePdf(result.data)
  const filename = certificateFilename(result.data.courseSlug)

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
