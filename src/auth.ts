import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Nodemailer from "next-auth/providers/nodemailer"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from '@/lib/prisma'

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
              email:    credentials.email as string,
              name:     "Debug User",
              username: "debug_" + Math.random().toString(36).slice(2, 7),
            }
          })
        }
        return user
      } catch (error) {
        console.error("Debug Login Error:", error)
        return { id: "mock-id", email: credentials.email as string, name: "Mock User" }
      }
    }
  })
]

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google({
    clientId:  process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
    allowDangerousEmailAccountLinking: true,
  }))
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(GitHub({
    clientId:  process.env.AUTH_GITHUB_ID,
    clientSecret: process.env.AUTH_GITHUB_SECRET,
    allowDangerousEmailAccountLinking: true,
  }))
}

if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  providers.push(Nodemailer({
    server: process.env.EMAIL_SERVER,
    from:   process.env.EMAIL_FROM,
  }))
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter:  PrismaAdapter(prisma),
  providers,
  session: {
    // JWT is required for Credentials provider to work.
    // GitHub OAuth also works with JWT — PrismaAdapter handles account/user creation,
    // JWT handles the session cookie. They are compatible.
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string
        // Forward the GitHub access token to the client session
        if (token.githubAccessToken) {
          (session.user as any).githubToken = token.githubAccessToken as string
        }
      }
      return session
    },
    async jwt({ token, user, account }) {
      // On first sign-in, persist the user id into the token
      if (user?.id) token.sub = user.id
      // Capture GitHub OAuth token on first sign-in
      if (account?.provider === 'github' && account.access_token) {
        token.githubAccessToken = account.access_token
      }
      return token
    },
  },
  debug: process.env.NODE_ENV === "development",
})
