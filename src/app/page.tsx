export default function LandingPage() {
	return (
		<main className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
			<div className="max-w-3xl px-6 text-center">
				<h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 dark:text-white mb-4">
					PayAuto Enterprise Payroll
				</h1>
				<p className="text-gray-600 dark:text-gray-400 mb-8">
					A modern payroll platform built on TailAdmin + Next.js with Supabase auth.
				</p>
				<div className="flex items-center justify-center gap-4">
					<a href="/login" className="px-6 py-3 rounded-lg bg-brand-500 text-white hover:bg-brand-600">Sign In</a>
					<a href="/signup" className="px-6 py-3 rounded-lg ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:text-gray-300">Create Account</a>
				</div>
			</div>
		</main>
	);
} 