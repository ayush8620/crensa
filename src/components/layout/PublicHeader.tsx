'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext } from '@/contexts/AuthContext';

interface PublicHeaderProps {
    className?: string;
}

export default function PublicHeader({ className = '' }: PublicHeaderProps) {
    const { isSignedIn } = useAuthContext();

    return (
        <header className={`bg-neutral-white border-b border-neutral-light-gray shadow-sm ${className}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    { }
                    <Link
                        href="/"
                        className="flex items-center space-x-2 group focus:outline-none focus:ring-2 focus:ring-primary-neon-yellow focus:ring-offset-2 rounded-lg"
                    >
                        <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                            <Image
                                src="/icons/icon-192.png"
                                alt="Crensa logo"
                                width={40}
                                height={40}
                                className="w-10 h-10"
                            />
                        </div>
                        <span className="text-xl font-bold text-primary-navy group-hover:text-primary-navy/80 transition-colors duration-200">Crensa</span>
                    </Link>

                    { }
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link
                            href="/"
                            className="text-neutral-dark-gray hover:text-primary-navy focus:text-primary-navy focus:outline-none focus:underline transition-colors duration-200"
                        >
                            Home
                        </Link>
                        <Link
                            href="/about"
                            className="text-neutral-dark-gray hover:text-primary-navy focus:text-primary-navy focus:outline-none focus:underline transition-colors duration-200"
                        >
                            About
                        </Link>
                        <Link
                            href="/contact"
                            className="text-neutral-dark-gray hover:text-primary-navy focus:text-primary-navy focus:outline-none focus:underline transition-colors duration-200"
                        >
                            Contact
                        </Link>
                    </nav>

                    { }
                    <div className="flex items-center space-x-4">
                        {!isSignedIn ? (
                            <>
                                <Link
                                    href="/sign-in"
                                    className="text-primary-navy hover:text-primary-navy/90 focus:text-primary-navy focus:outline-none focus:underline transition-colors duration-300 font-semibold"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/sign-up"
                                    className="bg-primary-neon-yellow text-primary-navy px-4 py-2 rounded-lg hover:bg-primary-light-yellow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-neon-yellow focus:ring-offset-2 transition-all duration-300 font-semibold transform hover:scale-105"
                                >
                                    Get Started
                                </Link>
                            </>
                        ) : (
                            <Link
                                href="/dashboard"
                                className="bg-primary-navy text-neutral-white px-4 py-2 rounded-lg hover:bg-primary-navy/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-navy focus:ring-offset-2 transition-all duration-200 font-semibold"
                            >
                                Dashboard
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}