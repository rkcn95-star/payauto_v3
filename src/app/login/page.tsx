"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
// import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function LoginPage() {
	const [showPassword, setShowPassword] = useState(false);
	const [isChecked, setIsChecked] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [checkingSession, setCheckingSession] = useState(true);
	const router = useRouter();

	useEffect(() => {
		let isMounted = true;
		(async () => {
			try {
				const { data, error } = await supabase.auth.getSession();
				if (error) {
					console.warn("Session check failed:", error.message);
					setCheckingSession(false);
					return;
				}
				if (data.session && isMounted) {
					router.replace("/dashboard");
				} else if (isMounted) {
					setCheckingSession(false);
				}
			} catch (err) {
				console.warn("Session check error:", err);
				if (isMounted) setCheckingSession(false);
			}
		})();
		return () => {
			isMounted = false;
		};
	}, [router]);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			const { data, error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) {
				setError(error.message);
			} else if (data.user) {
				// Get company_id from sessionStorage if available
				// Get company_id for the user
				const { data: companyData, error: companyError } = await supabase.rpc('get_user_company_id', {
					user_id: data.user.id
				});

				if (companyError) {
					console.error('Error getting company_id:', companyError);
				} else if (companyData) {
					// Set company_id in sessionStorage
					window.sessionStorage.setItem('company_id', companyData);
					console.log('Set company_id in sessionStorage:', companyData);
				}
				const companyId = window.sessionStorage.getItem('company_id');
				if (companyId) {
					console.log('Using company_id from sessionStorage:', companyId);
				}
				router.replace("/dashboard");
			}
		} catch {
			setError("An unexpected error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	if (checkingSession) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-gray-500">Checking session...</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-[calc(100vh_-_0px)]">
			<div className="items-center justify-center hidden w-1/2 overflow-hidden bg-gray-100 lg:flex dark:bg-white/5">
				<div className="w-full max-w-[740px] p-12 text-center">
					<h1 className="mb-2 text-4xl font-semibold text-gray-900 dark:text-white">Welcome back</h1>
					<p className="text-gray-500">Sign in to access your dashboard</p>
					<div className="mt-10">
						<img src="/images/brand/brand-11.svg" alt="Illustration" className="mx-auto" />
					</div>
				</div>
			</div>
			<div className="flex flex-col flex-1 lg:w-1/2 w-full">
				<div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
					<Link href="/" className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
						<ChevronLeftIcon />
						Back to dashboard
					</Link>
				</div>
				<div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
					<div>
						<div className="mb-5 sm:mb-8">
							<h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Sign In</h1>
							<p className="text-sm text-gray-500 dark:text-gray-400">Enter your email and password to sign in!</p>
						</div>
						<div>
							<form onSubmit={onSubmit}>
								<div className="space-y-6">
									<div>
										<Label>
											Email <span className="text-error-500">*</span>{" "}
										</Label>
										<Input placeholder="info@gmail.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
									</div>
									<div>
										<Label>
											Password <span className="text-error-500">*</span>{" "}
										</Label>
										<div className="relative">
											<Input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
											<span onClick={() => setShowPassword(!showPassword)} className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2">
												{showPassword ? <EyeIcon className="fill-gray-500 dark:fill-gray-400" /> : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />}
											</span>
										</div>
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<Checkbox checked={isChecked} onChange={setIsChecked} />
											<span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">Keep me logged in</span>
										</div>
										<Link href="/forgot-password" className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">Forgot password?</Link>
									</div>
									{error && <p className="text-sm text-error-500">{error}</p>}
									<div>
										<button className="w-full inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-4 py-3 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300" type="submit" disabled={loading}>
											{loading ? "Signing in..." : "Sign in"}
										</button>
									</div>
								</div>
							</form>
							<div className="mt-5">
								<p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
									Don&apos;t have an account? {""}
									<Link href="/signup" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">Sign Up</Link>
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
} 