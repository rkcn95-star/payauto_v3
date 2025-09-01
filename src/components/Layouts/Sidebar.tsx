"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { ChevronDownIcon, HorizontaLDots, GridIcon, CalenderIcon, UserCircleIcon } from "@/icons";
import SidebarWidget from "@/layout/SidebarWidget";
import { supabase } from "@/lib/supabaseClient";

type MenuRow = {
	id: string;
	name: string;
	path: string | null;
	icon: string | null;
	parent_id: string | null;
	sort_order?: number | null;
};

type NavNode = {
	id: string;
	name: string;
	path?: string | null;
	children: NavNode[];
	icon?: React.ReactNode;
};

// Fallback static menu when dynamic loading fails
const staticFallbackMenu: NavNode[] = [
	{
		id: "dashboard",
		name: "Dashboard",
		path: "/dashboard",
		children: [],
		icon: <GridIcon />
	},
	{
		id: "calendar",
		name: "Calendar",
		path: "/calendar",
		children: [],
		icon: <CalenderIcon />
	},
	{
		id: "profile",
		name: "Profile",
		path: "/profile",
		children: [],
		icon: <UserCircleIcon />
	},
	{
		id: "products",
		name: "Products",
		path: "/dashboard/products",
		children: [],
		icon: <GridIcon />
	},
	{
		id: "masters",
		name: "Masters",
		path: null,
		children: [
			{
				id: "locations",
				name: "Locations",
				path: "/dashboard/masters/locations",
				children: [],
				icon: <GridIcon />
			}
		],
		icon: <GridIcon />
	},
	{
		id: "hr-management",
		name: "HR Management",
		path: null,
		children: [
			{
				id: "employees",
				name: "Employees",
				path: "/employees",
				children: [],
				icon: <GridIcon />
			},
			{
				id: "departments",
				name: "Departments",
				path: "/departments",
				children: [],
				icon: <GridIcon />
			},
			{
				id: "attendance",
				name: "Attendance",
				path: "/attendance",
				children: [],
				icon: <GridIcon />
			}
		],
		icon: <GridIcon />
	},
	{
		id: "finance",
		name: "Finance",
		path: null,
		children: [
			{
				id: "payroll",
				name: "Payroll",
				path: "/payroll",
				children: [],
				icon: <GridIcon />
			},
			{
				id: "expenses",
				name: "Expenses",
				path: "/expenses",
				children: [],
				icon: <GridIcon />
			},
			{
				id: "budgets",
				name: "Budgets",
				path: "/budgets",
				children: [],
				icon: <GridIcon />
			}
		],
		icon: <GridIcon />
	},
	{
		id: "reports",
		name: "Reports",
		path: null,
		children: [
			{
				id: "employee-reports",
				name: "Employee Reports",
				path: "/reports/employees",
				children: [],
				icon: <GridIcon />
			},
			{
				id: "financial-reports",
				name: "Financial Reports",
				path: "/reports/financial",
				children: [],
				icon: <GridIcon />
			}
		],
		icon: <GridIcon />
	},
	{
		id: "settings",
		name: "Settings",
		path: null,
		children: [
			{
				id: "user-management",
				name: "User Management",
				path: "/settings/users",
				children: [],
				icon: <GridIcon />
			},
			{
				id: "system-config",
				name: "System Config",
				path: "/settings/system",
				children: [],
				icon: <GridIcon />
			}
		],
		icon: <GridIcon />
	}
];

const Sidebar: React.FC = () => {
	const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
	const pathname = usePathname();
	const [navMenu, setNavMenu] = useState<NavNode[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [, setError] = useState<string | null>(null);
	const [useFallback, setUseFallback] = useState<boolean>(false);
	const [openSubmenu, setOpenSubmenu] = useState<{ type: "main" | "others"; index: number } | null>(null);
	const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
	const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

	const isActive = useCallback((path: string | null | undefined) => path === pathname, [pathname]);

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				setError(null);
				setUseFallback(false);
				
				const { data: userData } = await supabase.auth.getUser();
				const userId = userData.user?.id;
				if (!userId) {
					console.log("No authenticated user, using fallback menu");
					setNavMenu(staticFallbackMenu);
					setUseFallback(true);
					setLoading(false);
					return;
				}

				// Try to load dynamic menu
				const { data: perms, error: permsError } = await supabase
					.from("user_menu_permissions")
					.select("menu_id")
					.eq("user_id", userId);
				
				if (permsError) {
					console.warn("user_menu_permissions table not found or accessible, using fallback menu:", permsError.message);
					setNavMenu(staticFallbackMenu);
					setUseFallback(true);
					setLoading(false);
					return;
				}
				
				if (!perms || perms.length === 0) {
					console.log("No menu permissions found for user, using fallback menu");
					setNavMenu(staticFallbackMenu);
					setUseFallback(true);
					setLoading(false);
					return;
				}

				const permittedIds = new Set<string>(perms.map((p: { menu_id: string }) => p.menu_id));
				const allMenus: MenuRow[] = [];
				const fetchedIds = new Set<string>();

				// Fetch permitted menus first
				const { data: initialMenus, error: menusError } = await supabase
					.from("menus")
					.select("id,name,path,icon,parent_id,sort_order")
					.in("id", Array.from(permittedIds));
				
				if (menusError) {
					console.warn("menus table not found or accessible, using fallback menu:", menusError.message);
					setNavMenu(staticFallbackMenu);
					setUseFallback(true);
					setLoading(false);
					return;
				}
				
				if (initialMenus && initialMenus.length > 0) {
					initialMenus.forEach((m: MenuRow) => {
						allMenus.push(m);
						fetchedIds.add(m.id);
					});
				}

				// Iteratively fetch ancestors so parents render
				let pendingParentIds = Array.from(
					new Set(
						(allMenus
							.map((m) => m.parent_id)
							.filter((pid): pid is string => !!pid) as string[]
						).filter((pid) => !fetchedIds.has(pid))
					)
				);
				let guard = 0;
				while (pendingParentIds.length > 0 && guard < 5) {
					const { data: parentMenus, error: parentError } = await supabase
						.from("menus")
						.select("id,name,path,icon,parent_id,sort_order")
						.in("id", pendingParentIds);
					if (parentError) throw parentError;
					if (parentMenus && parentMenus.length > 0) {
						parentMenus.forEach((m: MenuRow) => {
							if (!fetchedIds.has(m.id)) {
								allMenus.push(m);
								fetchedIds.add(m.id);
							}
						});
						pendingParentIds = Array.from(
							new Set(
								parentMenus
									.map((m) => m.parent_id)
								.filter((pid): pid is string => !!pid)
								.filter((pid) => !fetchedIds.has(pid))
							)
						);
						guard += 1;
					} else {
						break;
					}
				}

				// Build tree
				const byId: Record<string, NavNode> = {};
				allMenus
					.sort((a: MenuRow, b: MenuRow) => (a.sort_order || 0) - (b.sort_order || 0))
					.forEach((row: MenuRow) => {
						byId[row.id] = { id: row.id, name: row.name, path: row.path, children: [], icon: <GridIcon /> };
					});
				const roots: NavNode[] = [];
				allMenus.forEach((row: MenuRow) => {
					if (row.parent_id && byId[row.parent_id]) {
						byId[row.parent_id].children.push(byId[row.id]);
					} else {
						roots.push(byId[row.id]);
					}
				});
				setNavMenu(roots.length > 0 ? roots : staticFallbackMenu);
				setUseFallback(roots.length === 0);
			} catch (e) {
				console.error("Failed to load sidebar menu, using fallback:", e);
				setError("Using default menu");
				setNavMenu(staticFallbackMenu);
				setUseFallback(true);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	useEffect(() => {
		let matched = false;
		navMenu.forEach((node, index) => {
			const childActive = node.children?.some((c) => isActive(c.path));
			if (childActive) {
				setOpenSubmenu({ type: "main", index });
				matched = true;
			}
		});
		if (!matched) setOpenSubmenu(null);
	}, [pathname, isActive, navMenu]);

	useEffect(() => {
		if (openSubmenu !== null) {
			const key = `${openSubmenu.type}-${openSubmenu.index}`;
			if (subMenuRefs.current[key]) {
				setSubMenuHeight((prev) => ({ ...prev, [key]: subMenuRefs.current[key]?.scrollHeight || 0 }));
			}
		}
	}, [openSubmenu]);

	const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
		setOpenSubmenu((prev) => {
			if (prev && prev.type === menuType && prev.index === index) return null;
			return { type: menuType, index };
		});
	};

	const menuToRender = navMenu.length > 0 ? navMenu : staticFallbackMenu;

	return (
		<aside
			className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
			${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
			${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
			lg:translate-x-0`}
			onMouseEnter={() => !isExpanded && setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div className={`py-8 flex  ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
				<Link href="/">
					{isExpanded || isHovered || isMobileOpen ? (
						<>
							<Image className="dark:hidden" src="/images/logo/logo.svg" alt="Logo" width={150} height={40} />
							<Image className="hidden dark:block" src="/images/logo/logo-dark.svg" alt="Logo" width={150} height={40} />
						</>
					) : (
						<Image src="/images/logo/logo-icon.svg" alt="Logo" width={32} height={32} />
					)}
				</Link>
			</div>
			<div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
				<nav className="mb-6">
					<div className="flex flex-col gap-4">
						<div>
							<h2 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
								{isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots />}
							</h2>
							{loading ? (
								<div className={`${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"} text-gray-400 text-sm px-2`}>
									Loading menu...
								</div>
							) : (
								<ul className="flex flex-col gap-4">
									{menuToRender.map((item, index) => (
										<li key={item.id}>
											{item.children && item.children.length > 0 ? (
												<button onClick={() => handleSubmenuToggle(index, "main")} className={`menu-item group  ${openSubmenu?.type === "main" && openSubmenu?.index === index ? "menu-item-active" : "menu-item-inactive"} cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}>
													<span className={`${openSubmenu?.type === "main" && openSubmenu?.index === index ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
														{item.icon || <GridIcon />}
													</span>
													{(isExpanded || isHovered || isMobileOpen) && <span className={`menu-item-text`}>{item.name}</span>}
													{(isExpanded || isHovered || isMobileOpen) && (
														<ChevronDownIcon className={`ml-auto w-5 h-5 transition-transform duration-200  ${openSubmenu?.type === "main" && openSubmenu?.index === index ? "rotate-180 text-brand-500" : ""}`} />
													)}
												</button>
											) : (
												item.path && (
													<Link href={item.path} className={`menu-item group ${isActive(item.path) ? "menu-item-active" : "menu-item-inactive"}`}>
														<span className={`${isActive(item.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
															{item.icon || <GridIcon />}
														</span>
														{(isExpanded || isHovered || isMobileOpen) && <span className={`menu-item-text`}>{item.name}</span>}
													</Link>
												)
											)}
											{item.children && (isExpanded || isHovered || isMobileOpen) && (
												<div ref={(el) => { subMenuRefs.current[`main-${index}`] = el; }} className="overflow-hidden transition-all duration-300" style={{ height: openSubmenu?.type === "main" && openSubmenu?.index === index ? `${subMenuHeight[`main-${index}`]}px` : "0px" }}>
													<ul className="mt-2 space-y-1 ml-9">
														{item.children.map((child) => (
															<li key={child.id}>
																{child.path ? (
																	<Link href={child.path} className={`menu-dropdown-item ${isActive(child.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"}`}>
																		{child.name}
																	</Link>
																) : (
																	<span className="menu-dropdown-item-inactive">{child.name}</span>
																)}
															</li>
														))}
													</ul>
												</div>
											)}
										</li>
									))}
								</ul>
							)}
							{useFallback && (isExpanded || isHovered || isMobileOpen) && (
								<div className="mt-4 p-2 text-xs text-gray-500 dark:text-gray-400">
									Using default menu. Configure Supabase tables for dynamic menus.
								</div>
							)}
						</div>
					</div>
				</nav>
				{isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
			</div>
		</aside>
	);
};

export default Sidebar; 