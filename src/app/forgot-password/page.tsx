"use client";
import React, { useState } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setMessage(null);
		setLoading(true);
		try {
			const redirectUrl = `${window.location.origin}/reset-password`;
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: redirectUrl,
			});
			if (error) setError(error.message);
			else setMessage(`Check your email for a password reset link. The reset link will redirect to: ${redirectUrl}`);
		} catch {
			setError("Failed to send reset email. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<form onSubmit={onSubmit} className="w-full max-w-md space-y-6">
				<div>
					<h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Forgot Password</h1>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
						Enter your email address and we&apos;ll send you a link to reset your password.
					</p>
				</div>
				<div>
					<Label>Email</Label>
					<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
				</div>
				{error && <p className="text-error-500 text-sm">{error}</p>}
				{message && <p className="text-success-500 text-sm">{message}</p>}
				<button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-4 py-3 text-sm bg-brand-500 text-white hover:bg-brand-600 disabled:bg-brand-300">
					{loading ? "Sending..." : "Send reset link"}
				</button>
				<div className="text-center">
					<a href="/login" className="text-sm text-brand-500 hover:text-brand-600">Back to Sign In</a>
				</div>
			</form>
		</div>
	);
} 