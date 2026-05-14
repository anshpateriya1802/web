import Link from "next/link"
import { loginWithDebug, loginWithEmail, loginWithGithub, loginWithGoogle } from "./actions"
import { Mail, ShieldAlert } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-[#ededed] font-sans">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-gray-800 bg-[#111111] p-10 shadow-[0_0_50px_-12px_rgba(79,70,229,0.2)]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-lg bg-indigo-600 flex items-center justify-center mb-4">
            <span className="text-2xl font-black text-white">CR</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            CodeRealm
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            The collaborative coding ecosystem.
          </p>
        </div>

        {/* Debug Login Section - Highlighted for testing */}
        <div className="rounded-lg border border-yellow-900/30 bg-yellow-900/10 p-4">
           <div className="flex items-center space-x-2 text-yellow-500 mb-3">
             <ShieldAlert size={16} />
             <span className="text-xs font-semibold uppercase tracking-wider">Development Mode</span>
           </div>
           <form action={loginWithDebug} className="space-y-3">
              <input
                id="email-debug"
                name="email"
                type="email"
                required
                className="block w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                placeholder="debug@example.com"
              />
              <button
                type="submit"
                className="w-full rounded-md bg-yellow-600 px-4 py-2 text-xs font-bold text-black hover:bg-yellow-500 transition-colors uppercase"
              >
                Bypass Auth (Debug)
              </button>
           </form>
        </div>

        <div className="space-y-4">
          <form action={loginWithGoogle}>
            <button
              type="submit"
              className="flex w-full items-center justify-center space-x-3 rounded-md border border-gray-700 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-all shadow-sm"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>

          <form action={loginWithGithub}>
            <button
              type="submit"
              className="flex w-full items-center justify-center space-x-3 rounded-md border border-gray-700 bg-gray-800 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-all shadow-sm"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </form>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#111111] px-2 text-gray-500 font-medium">
              Work with email
            </span>
          </div>
        </div>

        <form action={loginWithEmail} className="space-y-4">
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Mail size={18} />
             </div>
             <input
                id="email-main"
                name="email"
                type="email"
                required
                className="block w-full rounded-md border border-gray-700 bg-gray-900 pl-10 pr-3 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="name@company.com"
              />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            Send Magic Link
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          By continuing, you agree to CodeRealm&apos;s <br />
          <Link href="/terms" className="underline hover:text-gray-400 cursor-pointer">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-gray-400 cursor-pointer">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
