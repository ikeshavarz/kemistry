import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-6 text-6xl">⚗️</div>
        <h1 className="text-5xl font-bold text-white mb-4">
          Chemistry Learning Platform
        </h1>
        <p className="text-blue-200 text-lg mb-10">
          Your secure portal for chemistry lessons, assignments, and guidance.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-white text-blue-900 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="border border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  )
}
