import { NextResponse } from "next/server"

export async function GET() {
  const hasSecret = !!process.env.NEXTAUTH_SECRET
  const secretPreview = process.env.NEXTAUTH_SECRET
    ? process.env.NEXTAUTH_SECRET.substring(0, 5) + "..."
    : "NO SET"

  return NextResponse.json({
    hasSecret,
    secretPreview,
    vercelEnv: process.env.VERCEL,
    nodeEnv: process.env.NODE_ENV,
  })
}
