"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { useResponsive, useSidebarTouch } from "@/hooks/useResponsive";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import { useMemberNavigation } from "@/hooks/useMemberNavigation";
import {
    getSidebarWidth,
    getTouchOptimizedSpacing,
    getOptimizedAnimationClasses,
    prefersReducedMotion,
} from "@/lib/mobile-optimization";

const DashboardIcon = () => (
    <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
    </svg>
);

const DiscoverIcon = () => (
    <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
    </svg>
);

const HistoryIcon = () => (
    <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
    </svg>
);

const WalletIcon = () => (
    <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
        />
    </svg>
);

const NotificationsIcon = () => (
    <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
    </svg>
);

const SettingsIcon = () => (
    <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
    </svg>
);

const ProfileIcon = () => (
    <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
    </svg>
);

const MembershipIcon = () => (
    <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3l14 9-14 9V3z"
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
    </svg>
);

interface NavigationItem {
    name: string;
    href: string;
    icon: React.ComponentType;
    badge?: number;
}

const AnalyticsIcon = () => (
    <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
    </svg>
);

const PreferencesIcon = () => (
    <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
        />
    </svg>
);

const CoinIcon = () => (
    <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <circle cx="12" cy="12" r="9" strokeWidth={2} />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.5 9.5c0-1.1-.9-2-2-2h-1c-1.1 0-2 .9-2 2s.9 2 2 2h2c1.1 0 2 .9 2 2s-.9 2-2 2h-1c-1.1 0-2-.9-2-2"
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v2m0 8v2"
        />
    </svg>
);

const CollectionIcon = () => (
    <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
    </svg>
);

interface MemberSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MemberSidebar({ isOpen, onClose }: MemberSidebarProps) {
    const pathname = usePathname();
    const { userProfile } = useAuthContext();
    const { unreadCount, loading: notificationLoading } = useNotificationCount();
    const { isMobile, isTablet, isTouchDevice, isSmallMobile } = useResponsive();
    const { sidebarTouchHandlers } = useSidebarTouch(onClose, isOpen);
    const { navigationItems, navigationContext } = useMemberNavigation();

    const isActiveRoute = (href: string) => {
        return pathname === href || pathname.startsWith(href + "/");
    };

    const sidebarWidthClass = getSidebarWidth(false, isMobile, isTablet); // Member sidebar is never collapsed
    const touchSpacing = getTouchOptimizedSpacing(isTouchDevice);
    const animationClasses = getOptimizedAnimationClasses(
        prefersReducedMotion(),
        isMobile
    );

    return (
        <>
            { }
            <aside
                className={`fixed top-0 left-0 h-full bg-neutral-white shadow-xl border-r border-neutral-gray ${animationClasses} ${isOpen ? "translate-x-0" : "-translate-x-full"
                    } w-64 ${isSmallMobile ? "w-full" : ""} ${isMobile ? "z-50" : "z-40"
                    }`}
                {...sidebarTouchHandlers}
                role="navigation"
                aria-label="Member navigation"
                aria-hidden={!isOpen}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    height: '100vh',
                    zIndex: isMobile ? 50 : 40,
                }}
            >
                <div className="flex flex-col h-full overflow-hidden">
                    { }
                    <div className="flex items-center justify-between p-6 border-b border-neutral-gray">
                        <Link
                            href="/"
                            className="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-primary-neon-yellow focus:ring-offset-2 rounded-lg"
                            onClick={isMobile ? onClose : undefined}
                        >
                            <div className="w-14 h-14 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                                <Image
                                    src="/icons/icon-192.png"
                                    alt="Crensa logo"
                                    width={56}
                                    height={56}
                                    className="w-14 h-14"
                                />
                            </div>
                            <div>
                                <span className="font-bold text-xl text-primary-navy group-hover:text-primary-navy/80 transition-colors duration-200">
                                    Crensa
                                </span>
                                <p className="text-sm text-neutral-dark-gray font-medium">Member Portal</p>
                            </div>
                        </Link>

                        { }
                        {isMobile && (
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-neutral-gray focus:outline-none focus:ring-2 focus:ring-primary-neon-yellow transition-colors duration-200"
                                aria-label="Close sidebar"
                            >
                                <svg
                                    className="w-5 h-5 text-neutral-dark-gray"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>

                    { }
                    <div className="p-6 border-b border-neutral-gray">
                        <div className="flex items-center space-x-3">
                            <div className="w-14 h-14 bg-gradient-to-br from-accent-pink to-accent-teal rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/20 aspect-square">
                                <span className="text-neutral-white font-bold text-xl leading-none select-none">
                                    {userProfile?.username?.charAt(0).toUpperCase() || "M"}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-primary-navy truncate text-lg">
                                    {userProfile?.username || "Member"}
                                </p>
                                <p className="text-sm text-neutral-dark-gray font-medium">Member Account</p>
                            </div>
                        </div>
                    </div>

                    { }
                    <nav className="flex-1 p-4 overflow-y-auto">
                        <ul className="space-y-2">
                            {navigationItems.map((item) => {

                                const getIconComponent = (iconName: string) => {
                                    switch (iconName) {
                                        case 'home': return DashboardIcon;
                                        case 'search': return DiscoverIcon;
                                        case 'play': return HistoryIcon;
                                        case 'collection': return CollectionIcon;
                                        case 'chart': return AnalyticsIcon;
                                        case 'wallet': return CoinIcon;
                                        case 'star': return MembershipIcon;
                                        case 'bell': return NotificationsIcon;
                                        case 'user': return ProfileIcon;
                                        case 'settings': return PreferencesIcon;
                                        case 'help': return function HelpIcon() {
                                            return (
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            );
                                        };
                                        default: return DashboardIcon;
                                    }
                                };

                                const Icon = getIconComponent(item.icon);
                                const isActive = item.isActive || isActiveRoute(item.href);

                                const handleNavigation = () => {
                                    if (isMobile) onClose();
                                };

                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            onClick={handleNavigation}
                                            className={`flex items-center justify-between ${touchSpacing.listItemPadding
                                                } ${touchSpacing.minTouchTarget
                                                } rounded-lg ${animationClasses} group focus:outline-none focus:ring-2 focus:ring-offset-2 ${isActive
                                                    ? "bg-primary-neon-yellow text-primary-navy shadow-sm font-medium focus:ring-primary-neon-yellow"
                                                    : "text-neutral-dark-gray hover:bg-neutral-gray hover:text-primary-navy font-medium focus:ring-primary-navy"
                                                }`}
                                            style={{
                                                WebkitTapHighlightColor: "transparent",
                                                touchAction: "manipulation",
                                            }}
                                            role="menuitem"
                                            tabIndex={isMobile ? (isOpen ? 0 : -1) : 0}
                                            aria-current={isActive ? 'page' : undefined}
                                            title={item.description}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <Icon />
                                                <span className="font-medium">{item.name}</span>
                                            </div>
                                            {item.badge !== undefined && (
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.showBadgeAsCoins
                                                    ? 'bg-primary-neon-yellow text-primary-navy'
                                                    : 'bg-accent-pink text-neutral-white'
                                                    }`}>
                                                    {item.showBadgeAsCoins
                                                        ? `${item.badge || 0}`
                                                        : (notificationLoading ? '...' : item.badge)
                                                    }
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    { }
                    <div className="p-4 border-t border-neutral-gray">
                        <div className="bg-gradient-to-r from-accent-pink/10 to-accent-teal/10 rounded-lg p-4">
                            <h4 className="font-semibold text-primary-navy text-sm mb-2">
                                Quick Actions
                            </h4>
                            <div className="space-y-2">
                                <Link
                                    href="/discover"
                                    className="block text-xs font-medium text-accent-pink hover:text-accent-bright-pink transition-colors duration-200"
                                    onClick={onClose}
                                >
                                    Discover New Content →
                                </Link>
                                <Link
                                    href="/wallet"
                                    className="block text-xs font-medium text-accent-teal hover:text-accent-teal/80 transition-colors duration-200"
                                    onClick={onClose}
                                >
                                    Top Up Wallet →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
