import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 py-20 px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-12">
        <header>
          <Link href="/login" className="text-indigo-500 hover:text-indigo-400 text-sm transition-colors mb-8 inline-block">
            ← Back to login
          </Link>
          <h1 className="text-4xl font-bold text-white tracking-tight">Privacy Policy</h1>
          <p className="mt-4 text-sm text-gray-500">Last updated: May 13, 2026</p>
        </header>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account (email, name, GitHub/Google ID). We also collect data about your interactions with the platform, including room history and code snapshots (only when explicitly saved).
          </p>

          <h2 className="text-2xl font-semibold text-white">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to provide, maintain, and improve CodeRealm. This includes facilitating collaboration, managing your workspace, and communicating with you about service updates.
          </p>

          <h2 className="text-2xl font-semibold text-white">3. Information Sharing</h2>
          <p>
            We do not share your private code or personal information with third parties except as required by law or to provide the service (e.g., using a third-party email provider to send magic links).
          </p>

          <h2 className="text-2xl font-semibold text-white">4. Data Security</h2>
          <p>
            We take reasonable measures to protect your information from unauthorized access, loss, or disclosure. However, no method of transmission over the internet is 100% secure.
          </p>

          <h2 className="text-2xl font-semibold text-white">5. Your Choices</h2>
          <p>
            You can access and update your account information through your profile settings. You may also request the deletion of your account and associated data by contacting our support team.
          </p>
        </section>

        <footer className="pt-12 border-t border-gray-800 text-sm text-gray-500 text-center">
          &copy; 2026 CodeRealm Technologies Inc. All rights reserved.
        </footer>
      </div>
    </div>
  )
}
