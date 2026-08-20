"use client";
import React, { useState, useRef, useEffect } from "react";
import bdFlag from '../../../../public/bd-flag.webp';
import usFlag from '../../../../public/en-flag.webp';
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Tabs } from "@heroui/react";
import Image from "next/image";
import { ChartBarStacked } from "lucide-react";
import { useNav } from "./NavStateContext";
import { useAdaptiveShadow } from "@/reuseable/useAdaptiveShadow";

const MENU_SLIDE_ANIMATION = {
	initial: { x: "calc(100% + 100px)" },
	enter: { x: "0", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } },
	exit: {
		x: "calc(100% + 100px)",
		transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
	},
};

const LETTER_VARIANTS = {
	initial: { x: 0 },
	whileHover: { x: 16 },
};

const WORD_VARIANTS = {
	initial: { x: 0 },
	whileHover: { x: -16 },
};

const WORD_TRANSITION = { type: "spring", staggerChildren: 0.075, delayChildren: 0.25 };
const LETTER_TRANSITION = { type: "spring" };

const defaultNavItems = [
	{ heading: "Home", href: "/" },
	{ heading: "BD Premium", href: "/bd-premium" },
	{ heading: "Manufactured Retro", href: "/manufactured-retro" },
	{ heading: "Player Edition Replica", href: "/player-edition-replica" },
	{ heading: "Player Edition", href: "/player-edition" },
];

const NavLink = ({ heading, href, setIsActive, index }) => (
	<motion.div
		onClick={() => setIsActive(false)}
		initial="initial"
		whileHover="whileHover"
		className="group relative flex items-center justify-between border-b border-black/30 py-4 transition-colors duration-500 md:py-8"
	>
		<Link href={href}>
			<div className="relative flex items-start">
				<span className="text-black transition-colors duration-500 text-xl font-thin mr-2">
					{index}.
				</span>
				<motion.span
					variants={WORD_VARIANTS}
					transition={WORD_TRANSITION}
					className="relative z-10 block text-2xl font-light text-black transition-colors duration-500"
				>
					{heading.split(" ").map((word, wordIndex) => (
						<span key={wordIndex} className="inline-flex mr-2">
							{word.split("").map((letter, i) => (
								<motion.span
									key={i}
									variants={LETTER_VARIANTS}
									transition={LETTER_TRANSITION}
									className="inline-block"
								>
									{letter}
								</motion.span>
							))}
						</span>
					))}
				</motion.span>
			</div>
		</Link>
	</motion.div>
);

const Curve = () => {
	const [windowHeight, setWindowHeight] = useState(0);

	useEffect(() => {
		setWindowHeight(window.innerHeight);
		const handleResize = () => setWindowHeight(window.innerHeight);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const half = windowHeight / 2;
	const curve = {
		initial: { d: `M100 0 L200 0 L200 ${windowHeight} L100 ${windowHeight} Q-100 ${half} 100 0` },
		enter: {
			d: `M100 0 L200 0 L200 ${windowHeight} L100 ${windowHeight} Q100 ${half} 100 0`,
			transition: { duration: 1, ease: [0.76, 0, 0.24, 1] },
		},
		exit: {
			d: `M100 0 L200 0 L200 ${windowHeight} L100 ${windowHeight} Q-100 ${half} 100 0`,
			transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
		},
	};

	return (
		<svg
			className="absolute top-0 -left-24.75 w-25 stroke-none h-full"
			style={{ fill: "#ffffff" }}
		>
			<motion.path variants={curve} initial="initial" animate="enter" exit="exit" />
		</svg>
	);
};

const CurvedNavbar = ({ setIsActive, navItems }) => (
	<motion.div
		variants={MENU_SLIDE_ANIMATION}
		initial="initial"
		animate="enter"
		exit="exit"
		className="h-dvh w-screen max-w-screen-sm fixed right-0 top-0 z-70 bg-white"
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
		<Curve />
	</motion.div>
);

const MobileNav = ({ navItems = defaultNavItems, where = "sidebar" }) => {
	const { isActive, setIsActive } = useNav();
	const btnRef = useRef(null);
	const isDarkBg = useAdaptiveShadow(btnRef);

	return (
		<div>
			{where === "sidebar" ? (
				<div
					ref={btnRef}
					className={`relative z-80 rounded-full backdrop-blur-sm h-12 w-12 flex items-center justify-center min-[1003px]:hidden transition-all duration-300 ease-in-out ${isDarkBg ? "shadow-[inset_0_8px_8px_-8px_rgba(255,255,255,0.5),inset_0_-8px_8px_-8px_rgba(255,255,255,0.5)]" : "shadow-[inset_0_8px_8px_-8px_rgba(0,0,0,0.2),inset_0_-8px_8px_-8px_rgba(0,0,0,0.2)]"
						} ${isActive ? "-translate-y-2.5" : ""}`}
				>
					<div
						onClick={() => setIsActive(!isActive)}
						className="w-8 h-8 flex items-center justify-center cursor-pointer bg-transparent"
					>
						<div className="relative w-7 h-4 gap-0 flex flex-col justify-between items-center">
							<span className={`block h-[1.5px] w-6 bg-black transition-transform duration-300 ${isActive ? "rotate-45 translate-y-2" : ""}`} />
							<span className={`block h-[1.5px] w-6 bg-black transition-opacity duration-300 ${isActive ? "opacity-0" : ""}`} />
							<span className={`block h-[1.5px] w-6 bg-black transition-transform duration-300 ${isActive ? "-rotate-45 -translate-y-3" : ""}`} />
						</div>
					</div>
				</div>
			) : (
				<div onClick={() => setIsActive(!isActive)} className="cursor-pointer">
					<ChartBarStacked size={28} color="#ffffff" />
				</div>
			)}

			<AnimatePresence mode="wait">
				{isActive && (
					<CurvedNavbar key="curved-navbar" setIsActive={setIsActive} navItems={navItems} />
				)}
			</AnimatePresence>
		</div>
	);
};

export default MobileNav;
