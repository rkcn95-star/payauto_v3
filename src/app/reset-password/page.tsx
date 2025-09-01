"use client";
import React, { useState } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		if (!password || !confirmPassword) {
			setError("Please enter and confirm your new password.");
			return;
		}
		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}
		if (password.length < 8) {
			setError("Password must be at least 8 characters.");
			return;
		}
		setLoading(true);
		try {
			const { error } = await supabase.auth.updateUser({ password });
			if (error) setError(error.message);
			else router.replace("/login");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<form onSubmit={onSubmit} className="w-full max-w-md space-y-6">
				<h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Reset Password</h1>
				<div>
					<Label>New Password</Label>
					<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
				</div>
				<div>
					<Label>Confirm New Password</Label>
					<Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
				</div>
				{error && <p className="text-error-500 text-sm">{error}</p>}
				<button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-4 py-3 text-sm bg-brand-500 text-white hover:bg-brand-600 disabled:bg-brand-300">
					{loading ? "Updating..." : "Update password"}
				</button>
			</form>
		</div>
	);
} 