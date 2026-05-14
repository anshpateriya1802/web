import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Nodemailer from "next-auth/providers/nodemailer"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Dynamically build providers based on ENV presence to avoid config errors
const providers: any[] = [
  Credentials({
    name: "Debug Login",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "test@example.com" },
    },
    async authorize(credentials) {
      if (!credentials?.email) return null
      
      try {
        let user = await prisma.user.findUnique({ where: { email: credentials.email as string } })
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: credentials.email as string,
              name: "Debug User",
              username: "debug_" + Math.random().toString(36).slice(2, 7),
            }
          })
        }
        return user
      } catch (error) {
        console.error("Debug Login Error (DB likely not running):", error)
        // Fallback: return a mock user if DB fails, though adapter might still complain
        return { id: "mock-id", email: credentials.email as string, name: "Mock User" }
      }
    }
  })
]

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google({
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
  }))
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(GitHub({
    clientId: process.env.AUTH_GITHUB_ID,
    clientSecret: process.env.AUTH_GITHUB_SECRET,
  }))
}

if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  providers.push(Nodemailer({
    server: process.env.EMAIL_SERVER,
    from: process.env.EMAIL_FROM,
  }))
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  debug: process.env.NODE_ENV === "development",
})
