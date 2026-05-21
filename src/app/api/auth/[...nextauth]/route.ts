import { authConfig } from "@/lib/auth"
import NextAuth from "next-auth"

const { handlers } = NextAuth(authConfig)

export const GET = handlers.GET
export const POST = handlers.POST
