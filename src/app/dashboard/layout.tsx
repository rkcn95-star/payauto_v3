"use client";
import React, { useEffect, useState } from "react";
import { useSidebar } from "@/context/SidebarContext";
import Header from "@/components/Layouts/Header";
import Sidebar from "@/components/Layouts/Sidebar";
import Backdrop from "@/layout/Backdrop";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const { isExpanded, isHovered, isMobileOpen } = useSidebar();
	const [checkingAuth, setCheckingAuth] = useState(true);
	const router = useRouter();

	useEffect(() => {
		let isMounted = true;
		(async () => {
			try {
				const { data, error } = await supabase.auth.getSession();
				if (error) {
					console.warn("Auth check failed:", error.message);
					if (isMounted) router.replace("/login");
					return;
				}
				if (!data.session && isMounted) {
					router.replace("/login");
				} else if (isMounted) {
					setCheckingAuth(false);
				}
			} catch (err) {
				console.warn("Auth check error:", err);
				if (isMounted) router.replace("/login");
			}
		})();
		return () => {
			isMounted = false;
		};
	}, [router]);

	const mainContentMargin = isMobileOpen ? "ml-0" : isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]";
	
	if (checkingAuth) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-gray-500">Loading...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen xl:flex">
			<Sidebar />
			<Backdrop />
			<div className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}>
				<Header />
				<div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
			</div>
		</div>
	);
} 