"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useResponsive } from "@/hooks/useResponsive";
import { useAuthContext } from "@/contexts/AuthContext";
import { getHomeUrl } from "@/lib/navigation-utils";
import ProfileDropdown from "@/components/profile/ProfileDropdown";

interface NewHeaderProps {
    isScrolled?: boolean;
    alwaysVisible?: boolean;
}

export default function NewHeader({ isScrolled: propIsScrolled, alwaysVisible = false }: NewHeaderProps) {
    const [isScrolled, setIsScrolled] = useState(propIsScrolled || false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isMobile, isTouchDevice } = useResponsive();
    const { isSignedIn, userProfile, isLoading } = useAuthContext();

    useEffect(() => {
        if (propIsScrolled !== undefined) return;

        const handleScroll = () => {
            const scrollTop = window.scrollY;
            setIsScrolled(scrollTop > 50);

            if (!alwaysVisible) {
                if (scrollTop > lastScrollY && scrollTop > 100) {

                    setIsVisible(false);
                } else {

                    setIsVisible(true);
                }
            }
            setLastScrollY(scrollTop);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [propIsScrolled, lastScrollY, alwaysVisible]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const homeUrl = getHomeUrl(isSignedIn, userProfile?.role);

    const navigationItems = [
        { label: "Home", href: "/" },
        { label: "Browse", href: "/browse" },
        { label: "Creator", href: "/creator-landing" },
        { label: "App", href: isSignedIn ? (userProfile?.role === "creator" ? "/creator/dashboard" : "/dashboard") : "/sign-up" },
    ];

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isVisible ? "translate-y-0" : "-translate-y-full"
                    } ${alwaysVisible || isScrolled
                        ? "bg-neutral-white shadow-lg"
                        : "bg-neutral-white shadow-md"
                    }`}
            >
                <div className="container">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        { }
                        <Link
                            href="/"
                            className={`flex items-center space-x-2 group transition-opacity duration-300 ${isMobileMenuOpen ? "md:opacity-100 opacity-0" : "opacity-100"
                                }`}
                            onClick={closeMobileMenu}
                        >
                            <div className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                                <Image
                                    src="/icons/icon-192.png"
                                    alt="Crensa logo"
                                    width={56}
                                    height={56}
                                    className="w-10 h-10 md:w-14 md:h-14"
                                />
                            </div>
                            <span className="font-bold text-xl md:text-2xl text-primary-navy">
                                Crensa
                            </span>
                        </Link>

                        { }
                        <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
                            {navigationItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={closeMobileMenu}
                                    className="font-medium text-primary-navy transition-colors duration-200 hover:text-accent-pink"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        { }
                        <div className="hidden md:flex items-center space-x-4">
                            {isLoading ? (
                                <div className="w-8 h-8 animate-spin rounded-full border-2 border-accent-pink/20 border-t-accent-pink"></div>
                            ) : isSignedIn ? (
                                <div className="flex items-center space-x-4">
                                    <Link
                                        href={
                                            userProfile?.role === "creator"
                                                ? "/creator/dashboard"
                                                : "/dashboard"
                                        }
                                        className="font-semibold px-4 py-2 rounded-lg text-primary-navy transition-all duration-200 hover:bg-neutral-gray"
                                    >
                                        Dashboard
                                    </Link>
                                    <ProfileDropdown />
                                </div>
                            ) : (
                                <>
                                    <Link
                                        href="/sign-in"
                                        className="font-semibold px-4 py-2 rounded-lg text-primary-navy transition-all duration-200 hover:bg-neutral-gray"
                                    >
                                        Login
                                    </Link>
                                    <Link href="/sign-up" className="btn-primary">
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>

                        { }
                        <button
                            onClick={toggleMobileMenu}
                            className={`md:hidden p-2 rounded-lg transition-colors duration-200 hover:bg-neutral-gray/20 focus:outline-none focus:ring-2 focus:ring-accent-pink focus:ring-offset-2 ${isTouchDevice
                                ? "touch-manipulation min-w-[44px] min-h-[44px]"
                                : ""
                                }`}
                            aria-label="Toggle mobile menu"
                            aria-expanded={isMobileMenuOpen}
                            aria-controls="mobile-menu"
                            style={{
                                WebkitTapHighlightColor: "transparent",
                                touchAction: "manipulation",
                            }}
                        >
                            <div className="w-6 h-6 flex flex-col justify-center items-center">
                                <span
                                    className={`block w-5 h-0.5 bg-primary-navy transition-all duration-300 ${isMobileMenuOpen
                                        ? "rotate-45 translate-y-1.5"
                                        : "rotate-0 translate-y-0"
                                        }`}
                                />
                                <span
                                    className={`block w-5 h-0.5 mt-1 bg-primary-navy transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : "opacity-100"
                                        }`}
                                />
                                <span
                                    className={`block w-5 h-0.5 mt-1 bg-primary-navy transition-all duration-300 ${isMobileMenuOpen
                                        ? "-rotate-45 -translate-y-1.5"
                                        : "rotate-0 translate-y-0"
                                        }`}
                                />
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            { }
            <div
                className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${isMobileMenuOpen
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                    }`}
            >
                <div
                    className="absolute inset-0 bg-primary-navy/80 backdrop-blur-sm"
                    onClick={closeMobileMenu}
                />

                { }
                <div
                    id="mobile-menu"
                    className={`absolute top-0 right-0 h-full bg-neutral-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isMobile ? "w-full max-w-[90vw]" : "w-80 max-w-[85vw]"
                        } ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="mobile-menu-title"
                >
                    <div className="flex flex-col h-full">
                        { }
                        <div className="flex items-center justify-between px-6 py-6 border-b border-neutral-gray">
                            <Link
                                href="/"
                                className="flex items-center space-x-2"
                                onClick={closeMobileMenu}
                            >
                                <div className="w-10 h-10 flex items-center justify-center">
                                    <Image
                                        src="/icons/icon-192.png"
                                        alt="Crensa logo"
                                        width={40}
                                        height={40}
                                        className="w-10 h-10"
                                    />
                                </div>
                                <span
                                    id="mobile-menu-title"
                                    className="font-bold text-xl text-primary-navy"
                                >
                                    Crensa
                                </span>
                            </Link>
                            <button
                                onClick={closeMobileMenu}
                                className={`p-2 rounded-lg hover:bg-neutral-gray/20 transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-accent-pink focus:ring-offset-2 ${isTouchDevice
                                    ? "touch-manipulation min-w-[44px] min-h-[44px]"
                                    : ""
                                    }`}
                                aria-label="Close mobile menu"
                                style={{
                                    WebkitTapHighlightColor: "transparent",
                                    touchAction: "manipulation",
                                }}
                            >
                                <div className="w-6 h-6 relative flex items-center justify-center">
                                    <span className="block w-4 h-0.5 bg-primary-navy rotate-45 absolute" />
                                    <span className="block w-4 h-0.5 bg-primary-navy -rotate-45 absolute" />
                                </div>
                            </button>
                        </div>

                        { }
                        <nav className="flex-1 px-6 py-8">
                            <ul className="space-y-6">
                                {navigationItems.map((item) => (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={closeMobileMenu}
                                            className={`block font-medium text-primary-navy hover:text-accent-pink transition-colors duration-200 ${isMobile ? "text-xl py-2" : "text-lg"
                                                } ${isTouchDevice
                                                    ? "touch-manipulation min-h-[44px] flex items-center"
                                                    : ""
                                                }`}
                                            style={{
                                                WebkitTapHighlightColor: "transparent",
                                                touchAction: "manipulation",
                                            }}
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        { }
                        <div className="p-6 border-t border-neutral-gray space-y-4">
                            {isLoading ? (
                                <div className="flex justify-center">
                                    <div className="w-8 h-8 animate-spin rounded-full border-2 border-accent-pink/20 border-t-accent-pink"></div>
                                </div>
                            ) : isSignedIn ? (
                                <div className="space-y-4">
                                    <Link
                                        href={
                                            userProfile?.role === "creator"
                                                ? "/creator/dashboard"
                                                : "/dashboard"
                                        }
                                        className={`block w-full text-center font-semibold text-primary-navy py-3 px-4 rounded-lg border-2 border-primary-navy hover:bg-primary-navy hover:text-neutral-white transition-all duration-200 ${isTouchDevice ? "touch-manipulation min-h-[44px]" : ""
                                            }`}
                                        onClick={closeMobileMenu}
                                        style={{
                                            WebkitTapHighlightColor: "transparent",
                                            touchAction: "manipulation",
                                        }}
                                    >
                                        Dashboard
                                    </Link>
                                    <div className="flex justify-center">
                                        <ProfileDropdown />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Link
                                        href="/sign-in"
                                        className={`block w-full text-center font-semibold text-primary-navy py-3 px-4 rounded-lg border-2 border-primary-navy hover:bg-primary-navy hover:text-neutral-white transition-all duration-200 ${isTouchDevice ? "touch-manipulation min-h-[44px]" : ""
                                            }`}
                                        onClick={closeMobileMenu}
                                        style={{
                                            WebkitTapHighlightColor: "transparent",
                                            touchAction: "manipulation",
                                        }}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/sign-up"
                                        className={`block w-full text-center btn-primary ${isTouchDevice ? "touch-manipulation min-h-[44px]" : ""
                                            }`}
                                        onClick={closeMobileMenu}
                                        style={{
                                            WebkitTapHighlightColor: "transparent",
                                            touchAction: "manipulation",
                                        }}
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}