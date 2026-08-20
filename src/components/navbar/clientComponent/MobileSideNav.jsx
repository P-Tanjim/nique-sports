"use client";
import React from "react";
import bdFlag from "../../../../public/bd-flag.webp";
import usFlag from "../../../../public/en-flag.webp";
import Link from "next/link";
import { Tabs } from "@heroui/react";
import Image from "next/image";
import { ChartBarStacked } from "lucide-react";
import { useNav } from "./NavStateContext";

const defaultNavItems = [
	{ heading: "Home", href: "/" },
	{ heading: "BD Premium", href: "/bd-premium" },
	{ heading: "Manufactured Retro", href: "/manufactured-retro" },
	{ heading: "Player Edition Replica", href: "/player-edition-replica" },
	{ heading: "Player Edition", href: "/player-edition" },
];

const NavLink = ({ heading, href, setIsActive, index }) => (
	<div
		onClick={() => setIsActive(false)}
		className="group relative flex items-center justify-between border-b border-black/30 py-4 transition-colors duration-500 md:py-8 cursor-pointer"
	>
		<Link href={href}>
			<div className="relative flex items-start">
				<span className="text-black transition-colors duration-500 text-xl font-thin mr-2">
					{index}.
				</span>
				<span className="relative z-10 block text-2xl font-light text-black transition-transform duration-300 ease-out group-hover:translate-x-3">
					{heading}
				</span>
			</div>
		</Link>
	</div>
);

const SideNavbar = ({ isActive, setIsActive, navItems }) => (
	<div
		className={`fixed right-0 top-0 z-70 h-dvh w-screen max-w-screen-sm bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.207,0.473,0.504,0.935)] ${isActive ? "translate-x-0" : "translate-x-full"
			}`}
	>
		<div className="h-full pt-11 flex flex-col justify-between">
			<div className="flex flex-col gap-3 mt-0 px-10 md:px-24">
				<div className="text-primary border-b border-primary-dark/30 uppercase text-sm mb-0">
					<p>apanique</p>
				</div>
				<section className="bg-transparent mt-0">
					<div className="mx-auto max-w-7xl">
						{navItems.map((item, index) => (
							<NavLink
								key={item.href}
								{...item}
								setIsActive={setIsActive}
								index={index + 1}
							/>
						))}
					</div>
				</section>

				<Tabs className="w-full mt-2 h-fit">
					<Tabs.ListContainer>
						<Tabs.List aria-label="Options">
							<Tabs.Tab id="overview">
								<Image src={bdFlag} width={18} height={18} alt="BD Flag" />
								<Tabs.Indicator className="px-2 py-2" />
							</Tabs.Tab>
							<Tabs.Tab id="analytics">
								<Image src={usFlag} width={18} height={18} alt="US Flag" />
								<Tabs.Indicator />
							</Tabs.Tab>
						</Tabs.List>
					</Tabs.ListContainer>
				</Tabs>
			</div>
		</div>
	</div>
);

const MobileNav = ({ navItems = defaultNavItems, where = "sidebar" }) => {
	const { isActive, setIsActive } = useNav();

	return (
		<div>
			{where === "sidebar" ? (
				<div
					className={`relative z-80 rounded-full backdrop-blur-sm h-12 w-12 flex items-center justify-center min-[1003px]:hidden transition-all duration-300 ease-in-out shadow-[inset_0_8px_8px_-8px_rgba(0,0,0,0.3),inset_0_-8px_8px_-8px_rgba(0,0,0,0.3)] ${isActive ? "-translate-y-2.5" : ""
						}`}
				>
					<div
						onClick={() => setIsActive(!isActive)}
						className="w-8 h-8 flex items-center justify-center cursor-pointer bg-transparent"
					>
						<div className="relative w-7 h-4 gap-0 flex flex-col justify-between items-center">
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
					</div>
				</div>
			) : (
				<div onClick={() => setIsActive(!isActive)} className="cursor-pointer z-40">
					<ChartBarStacked size={28} color="#ffffff" />
				</div>
			)}

			{where === "sidebar" && (
				<SideNavbar isActive={isActive} setIsActive={setIsActive} navItems={navItems} />
			)}
		</div>
	);
};

export default MobileNav;
