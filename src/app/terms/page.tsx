import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 py-20 px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-12">
        <header>
          <Link href="/login" className="text-indigo-500 hover:text-indigo-400 text-sm transition-colors mb-8 inline-block">
            ← Back to login
          </Link>
          <h1 className="text-4xl font-bold text-white tracking-tight">Terms of Service</h1>
          <p className="mt-4 text-sm text-gray-500">Last updated: May 13, 2026</p>
        </header>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using CodeRealm, you agree to be bound by these Terms of Service. If you do not agree to all of the terms and conditions, you may not access the service.
          </p>

          <h2 className="text-2xl font-semibold text-white">2. Description of Service</h2>
          <p>
            CodeRealm is a collaborative coding platform. We provide tools for real-time code editing, private workspaces, and developer social interactions.
          </p>

          <h2 className="text-2xl font-semibold text-white">3. User Conduct</h2>
          <p>
            You are responsible for all activity that occurs under your account. You agree not to use the service for any illegal or unauthorized purpose, including the distribution of malware or copyrighted material without permission.
          </p>

          <h2 className="text-2xl font-semibold text-white">4. Intellectual Property</h2>
          <p>
            You retain all rights to the code you write in your private buffers. By participating in public rooms, you grant CodeRealm a non-exclusive license to display and distribute that content to other users of the room.
          </p>

          <h2 className="text-2xl font-semibold text-white">5. Limitation of Liability</h2>
          <p>
            CodeRealm is provided "as is" without warranty of any kind. We are not liable for any damages resulting from the use or inability to use the service, including data loss or service interruptions.
          </p>
        </section>

        <footer className="pt-12 border-t border-gray-800 text-sm text-gray-500 text-center">
          &copy; 2026 CodeRealm Technologies Inc. All rights reserved.
        </footer>
      </div>
    </div>
  )
}
