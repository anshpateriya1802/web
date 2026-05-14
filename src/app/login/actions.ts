"use server"

import { signIn } from "@/auth"

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/" })
}

export async function loginWithGithub() {
  await signIn("github", { redirectTo: "/" })
}

export async function loginWithEmail(formData: FormData) {
  const email = formData.get("email")
  if (typeof email !== "string" || !email) {
    throw new Error("Invalid email")
  }
  await signIn("nodemailer", { email, redirectTo: "/" })
}

export async function loginWithDebug(formData: FormData) {
  const email = formData.get("email")
  await signIn("credentials", { email, redirectTo: "/" })
}
