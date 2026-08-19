"use client";
import React, { useState, useRef, useEffect } from "react";

import { motion, useMotionValue, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Info, Sigma, MessageCircleCode, MessageCircle } from "lucide-react";

const MENU_SLIDE_ANIMATION = {
	initial: { x: "calc(100% + 100px)" },
	enter: { x: "0", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } },
	exit: {
		x: "calc(100% + 100px)",
		transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
	},
};

const defaultNavItems = [
	{
		heading: "Home",
		href: "/",
		subheading: "Welcome to our website",
		imgSrc: "/images/home.jpg",
	},
	{
		heading: "Components",
		href: "/components",
		subheading: "View our components",
		imgSrc: "/images/about.jpg",
	},
	{
		heading: "Services",
		href: "/services",
		subheading: "What we offer",
		imgSrc: "/images/services.jpg",
	},
	{
		heading: "Contact",
		href: "/contact",
		subheading: "Get in touch with us",
		imgSrc: "/images/contact.jpg",
	},
];

const CustomFooter = () => {
	return (
		<div className="flex w-full text-sm justify-between text-black px-10 md:px-24 py-5">
			<a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
				<MessageCircleCode color="#ffffff" size={24} />
			</a>
			<a href="https://github.com" target="_blank" rel="noopener noreferrer">
				<MessageCircle color="#ffffff" size={24} />
			</a>
			<a href="https://dribbble.com" target="_blank" rel="noopener noreferrer">
                <Info size={24} color="#ffffff" />
			</a>
			<a href="https://www.figma.com" target="_blank" rel="noopener noreferrer">
				<Sigma color="#ffffff"size={24} />
			</a>
			<a href="https://www.figma.com" target="_blank" rel="noopener noreferrer">
				<Sigma color="#ffffff" size={24} />
			</a>
		</div>
	);
};

const NavLink = ({ heading, href, setIsActive, index }) => {
	const ref = useRef(null);
	const x = useMotionValue(0);
	const y = useMotionValue(0);

	const handleMouseMove = (e) => {
		if (!ref.current) return;
		const rect = ref.current.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;
		x.set(mouseX / rect.width - 0.5);
		y.set(mouseY / rect.height - 0.5);
	};

	const handleClick = () => {
		return setIsActive(false);
	};

	const isExternalLink = index === 4 || index === 3;
	const linkProps = isExternalLink
		? { target: "_blank", rel: "noopener noreferrer" }
		: {};

	return (
		<motion.div
			onClick={handleClick}
			initial="initial"
			whileHover="whileHover"
			className="group relative flex items-center justify-between border-b border-black/30 py-4 transition-colors duration-500 md:py-8 uppercase"
			{...linkProps}
		>
			<Link ref={ref} onMouseMove={handleMouseMove} href={href}>
				<div className="relative flex items-start">
					<span className="text-black transition-colors duration-500  text-4xl font-thin mr-2">
						{index}.
					</span>
					<div className="flex flex-row gap-2">
						<motion.span
							variants={{
								initial: { x: 0 },
								whileHover: { x: -16 },
							}}
							transition={{
								type: "spring",
								staggerChildren: 0.075,
								delayChildren: 0.25,
							}}
							className="relative z-10 block text-4xl font-extralight text-black transition-colors duration-500  md:text-4xl"
						>
							{heading.split("").map((letter, i) => {
								return (
									<motion.span
										key={i}
										variants={{
											initial: { x: 0 },
											whileHover: { x: 16 },
										}}
										transition={{ type: "spring" }}
										className="inline-block"
									>
										{letter}
									</motion.span>
								);
							})}
						</motion.span>
					</div>
				</div>
			</Link>
		</motion.div>
	);
};

const Curve = () => {
	const [windowHeight, setWindowHeight] = useState(0);

	useEffect(() => {
		setWindowHeight(window.innerHeight);
		const handleResize = () => setWindowHeight(window.innerHeight);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const initialPath = `M100 0 L200 0 L200 ${windowHeight} L100 ${windowHeight} Q-100 ${windowHeight / 2} 100 0`;
	const targetPath = `M100 0 L200 0 L200 ${windowHeight} L100 ${windowHeight} Q100 ${windowHeight / 2} 100 0`;

	const curve = {
		initial: { d: initialPath },
		enter: {
			d: targetPath,
			transition: { duration: 1, ease: [0.76, 0, 0.24, 1] },
		},
		exit: {
			d: initialPath,
			transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
		},
	};

	return (
		<svg
			className="absolute top-0 -left-24.75 w-25 stroke-none h-full"
			style={{ fill: "#ffffff" }}
		>
			<motion.path
				variants={curve}
				initial="initial"
				animate="enter"
				exit="exit"
			/>
		</svg>
	);
};

const CurvedNavbar = ({ setIsActive, navItems, footer }) => {
	return (
		<motion.div
			variants={MENU_SLIDE_ANIMATION}
			initial="initial"
			animate="enter"
			exit="exit"
			className="h-dvh w-screen max-w-screen-sm fixed right-0 top-0 z-40 bg-white"
		>
			<div className="h-full pt-11 flex flex-col justify-between">
				<div className="flex flex-col text-5xl gap-3 mt-0 px-10 md:px-24">
					<div className="text-black border-b border-black/30 uppercase text-sm mb-0">
						<p>Navigation</p>
					</div>
					<section className="bg-transparent mt-0">
						<div className="mx-auto max-w-7xl">
							{navItems.map((item, index) => {
								return (
									<NavLink
										key={item.href}
										{...item}
										setIsActive={setIsActive}
										index={index + 1}
									/>
								);
							})}
						</div>
					</section>
				</div>
				{footer}
			</div>
			<Curve />
		</motion.div>
	);
};

const MobileNav = ({
	navItems = defaultNavItems,
	footer = <CustomFooter />,
}) => {
	const [isActive, setIsActive] = useState(false);
	const openAudioRef = useRef(null);
	const closeAudioRef = useRef(null);

	const handleClick = () => {
		if (isActive) {
			closeAudioRef.current?.play();
		} else {
			openAudioRef.current?.play();
		}
		setIsActive(!isActive);
	};

	return (
		<>
			<div className={`relative z-50 min-[1003px]:hidden transition-transform duration-1000 ease-in-out ${isActive && "-translate-y-2.5"}`}>
				<div
					onClick={handleClick}
					className="w-12 h-4 rounded-none flex items-center justify-center cursor-pointer bg-white"
				>
					<div className="relative w-8 h-4.5 gap-0 flex flex-col justify-between items-center">
						<span
							className={`block h-0.5 w-8 bg-black transition-transform duration-300 ${isActive ? "rotate-45 translate-y-2" : ""}`}
						></span>
						<span
							className={`block h-0.5 w-8 bg-black transition-opacity duration-300 ${isActive ? "opacity-0" : ""}`}
						></span>
						<span
							className={`block h-0.5 w-8 bg-black transition-transform duration-300 ${isActive ? "-rotate-45 -translate-y-3" : ""}`}
						></span>
					</div>
				</div>
			</div>

			<AnimatePresence mode="wait">
				{isActive && (
					<CurvedNavbar
						setIsActive={setIsActive}
						navItems={navItems}
						footer={footer}
					/>
				)}
			</AnimatePresence>
		</>
	);
};

export default MobileNav;
