"use client";
import React, { useEffect } from "react";
import bdFlag from "../../../../public/bd-flag.webp";
import usFlag from "../../../../public/en-flag.webp";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Tabs } from "@heroui/react";
import Image from "next/image";
import { ChartBarStacked, Store, X } from "lucide-react";
import { useNav } from "./NavStateContext";
import AdminSignOutButton from "./AdminSignOutButton";
import { ADMIN_LINKS, SETTINGS_LINK, BANNERS_LINK, isActiveAdminLink, isAdminPath, useIsAdmin } from "@/components/navbar/adminNav";

const defaultNavItems = [
	{ heading: "Home", href: "/" },
	{ heading: "Shop", href: "/shop" },
	// { heading: "BD Premium", href: "/shop?category=bd-premium" },
	{ heading: "Manufactured Retro", href: "/shop?category=manufactured-retro" },
	// { heading: "Player Edition Replica", href: "/shop?category=player-edition-replica" },
	{ heading: "Player Edition", href: "/shop?category=player-edition" },
];

const NavLink = ({ heading, href, setIsActive, index }) => {
	const router = useRouter();

	const handleClick = (e) => {
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
			return;
		}
		e.preventDefault();
		setIsActive(false);
		router.push(href);
	};

	return (
		<Link
			href={href}
			onClick={handleClick}
			className="group relative flex items-center justify-between border-b border-black/30 py-4 transition-colors duration-500 md:py-8 cursor-pointer pointer-events-auto select-none"
		>
			<div className="relative flex items-start">
				<span className="text-black transition-colors duration-500 text-xl font-thin mr-2">
					{index}.
				</span>
				<span className="relative z-10 block text-2xl font-light text-black transition-transform duration-300 ease-out group-hover:translate-x-3">
					{heading}
				</span>
			</div>
		</Link>
	);
};

// Admin rows: icon + label, same large light type as the storefront menu.
const AdminNavLink = ({ href, label, icon: Icon, active, setIsActive }) => {
	const router = useRouter();

	const handleClick = (e) => {
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
			return;
		}
		e.preventDefault();
		setIsActive(false);
		router.push(href);
	};

	return (
		<Link
			href={href}
			onClick={handleClick}
			aria-current={active ? "page" : undefined}
			className="group flex items-center gap-4 border-b border-black/30 py-4 md:py-6 cursor-pointer pointer-events-auto select-none"
		>
			<Icon size={22} strokeWidth={1.5} className={active ? "text-primary" : "text-black"} />
			<span
				className={`text-2xl font-light transition-transform duration-300 ease-out group-hover:translate-x-3 ${
					active ? "text-primary" : "text-black"
				}`}
			>
				{label}
			</span>
		</Link>
	);
};

const SideNavbar = ({ isActive, setIsActive, navItems, inAdmin, pathname, isAdmin }) => {
	// Auto-close when route changes
	useEffect(() => {
		setIsActive(false);
	}, [pathname, setIsActive]);

	// Lock body scroll and close on Escape when drawer is open
	useEffect(() => {
		if (!isActive) return;
		const handleKey = (e) => {
			if (e.key === "Escape") setIsActive(false);
		};
		document.addEventListener("keydown", handleKey);
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", handleKey);
			document.body.style.overflow = originalOverflow;
		};
	}, [isActive, setIsActive]);

	return (
		<>
			{/* BACKDROP */}
			<div
				onClick={() => setIsActive(false)}
				aria-hidden="true"
				className={`fixed inset-0 z-70 bg-black/40 backdrop-blur-xs transition-opacity duration-500 min-[1050px]:hidden ${
					isActive ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
				}`}
			/>

			{/* DRAWER PANEL */}
			<div
				role="dialog"
				aria-modal="true"
				aria-label="Navigation Menu"
				aria-hidden={!isActive}
				className={`fixed right-0 top-0 z-75 h-dvh w-screen max-w-screen-sm bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.207,0.473,0.504,0.935)] min-[1050px]:hidden overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
					isActive ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
				}`}
			>
				<div className="h-full pt-11 flex flex-col justify-between">
					<div className="flex flex-col gap-3 mt-0 px-10 md:px-24">
						<div className="flex items-center justify-between text-primary border-b border-primary-dark/30 uppercase text-sm mb-0 pb-1">
							<p>{inAdmin ? "admin" : "apanique"}</p>
							<button
								type="button"
								onClick={() => setIsActive(false)}
								aria-label="Close menu"
								className="text-black/60 hover:text-black transition-colors p-1 cursor-pointer pointer-events-auto"
							>
								<X size={20} />
							</button>
						</div>
						<section className="bg-transparent mt-0">
							<div className="mx-auto max-w-7xl">
								{inAdmin ? (
									<>
										{ADMIN_LINKS.map((link) => (
											<AdminNavLink
												key={link.href}
												href={link.href}
												label={link.label}
												icon={link.icon}
												active={isActiveAdminLink(link, pathname)}
												setIsActive={setIsActive}
											/>
										))}
										{isAdmin && (
											<>
												<AdminNavLink
													href={BANNERS_LINK.href}
													label={BANNERS_LINK.label}
													icon={BANNERS_LINK.icon}
													active={isActiveAdminLink(BANNERS_LINK, pathname)}
													setIsActive={setIsActive}
												/>
												<AdminNavLink
													href={SETTINGS_LINK.href}
													label="Settings"
													icon={SETTINGS_LINK.icon}
													active={isActiveAdminLink(SETTINGS_LINK, pathname)}
													setIsActive={setIsActive}
												/>
											</>
										)}
										<AdminNavLink
											href="/"
											label="View store"
											icon={Store}
											active={false}
											setIsActive={setIsActive}
										/>
										<AdminSignOutButton variant="row" onDone={() => setIsActive(false)} />
									</>
								) : (
									navItems.map((item, index) => (
										<NavLink
											key={item.href}
											{...item}
											setIsActive={setIsActive}
											index={index + 1}
										/>
									))
								)}
							</div>
						</section>

						{!inAdmin && (
							<Tabs className="w-full mt-2 h-fit pointer-events-auto">
								<Tabs.ListContainer>
									<Tabs.List aria-label="Options">
										<Tabs.Tab id="overview">
											<Image src={bdFlag} width={18} alt="BD Flag w-auto h-auto" />
											<Tabs.Indicator className="px-2 py-2" />
										</Tabs.Tab>
										<Tabs.Tab id="analytics">
											<Image src={usFlag} width={18} alt="US Flag w-auto h-auto" />
											<Tabs.Indicator />
										</Tabs.Tab>
									</Tabs.List>
								</Tabs.ListContainer>
							</Tabs>
						)}
					</div>
				</div>
			</div>
		</>
	);
};

const MobileNav = ({ navItems = defaultNavItems, where = "sidebar" }) => {
	const { isActive, setIsActive } = useNav();
	const pathname = usePathname();
	const isAdmin = useIsAdmin();
	// Cosmetic switch only — dashboard access is enforced on the server.
	const inAdmin = isAdminPath(pathname);

	return (
		<>
			{where === "sidebar" ? (
				<div
					className={`relative z-80 rounded-full backdrop-blur-sm h-12 w-12 flex items-center justify-center min-[1050px]:hidden transition-all duration-300 ease-in-out shadow-[inset_0_8px_8px_-8px_rgba(0,0,0,0.3),inset_0_-8px_8px_-8px_rgba(0,0,0,0.3)] ${isActive ? "-translate-y-2.5" : ""
						}`}
				>
					<button
						type="button"
						aria-label={isActive ? "Close menu" : "Open menu"}
						onClick={() => setIsActive(!isActive)}
						className="w-8 h-8 flex items-center justify-center cursor-pointer bg-transparent pointer-events-auto"
					>
						<div className="relative w-7 h-4 gap-0 flex flex-col justify-between items-center pointer-events-none">
							<span
								className={`block h-[1.5px] w-6 bg-black transition-transform duration-300 ${isActive ? "rotate-45 translate-y-2" : ""
									}`}
							/>
							<span
								className={`block h-[1.5px] w-6 bg-black transition-opacity duration-300 ${isActive ? "opacity-0" : ""
									}`}
							/>
							<span
								className={`block h-[1.5px] w-6 bg-black transition-transform duration-300 ${isActive ? "-rotate-45 -translate-y-3" : ""
									}`}
							/>
						</div>
					</button>
				</div>
			) : (
				<button
					type="button"
					aria-label={isActive ? "Close menu" : "Open menu"}
					onClick={() => setIsActive(!isActive)}
					className="cursor-pointer z-40 bg-transparent border-0 p-0 pointer-events-auto"
				>
					<ChartBarStacked size={28} color="#ffffff" />
				</button>
			)}

			{where === "sidebar" && (
				<SideNavbar
					isActive={isActive}
					setIsActive={setIsActive}
					navItems={navItems}
					inAdmin={inAdmin}
					pathname={pathname}
					isAdmin={isAdmin}
				/>
			)}
		</>
	);
};

export default MobileNav;
