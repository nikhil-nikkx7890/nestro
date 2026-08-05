"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
    LayoutDashboard,
    FolderOpen,
    Home,
    BadgeCheck,
    PackageSearch,
    Palette,
    Package,
    ShoppingCart,
    Users,
    Settings,
} from "lucide-react";

const menuItems = [
    {
        section: "MASTER DATA",
        items: [
            {
                name: "Categories",
                href: "/admin/categories",
                icon: FolderOpen,
            },
            {
                name: "Room Types",
                href: "/admin/room-types",
                icon: Home,
            },
            {
                name: "Brands",
                href: "/admin/brands",
                icon: BadgeCheck,
            },
            {
                name: "Materials",
                href: "/admin/materials",
                icon: PackageSearch,
            },
            {
                name: "Colors",
                href: "/admin/colors",
                icon: Palette,
            },
        ],
    },
    {
        section: "CATALOG",
        items: [
            {
                name: "Products",
                href: "/admin/products",
                icon: Package,
            },
        ],
    },
    {
        section: "SALES",
        items: [
            {
                name: "Orders",
                href: "/admin/orders",
                icon: ShoppingCart,
            },
        ],
    },
    {
        section: "SYSTEM",
        items: [
            {
                name: "Users",
                href: "/admin/users",
                icon: Users,
            },
            {
                name: "Settings",
                href: "/admin/settings",
                icon: Settings,
            },
        ],
    },
];

export default function SidebarNav({ collapsed }) {
    const pathname = usePathname();

    return (
        <nav className="flex flex-col gap-1 p-3">

            {/* Dashboard */}
            <Link
                href="/admin"
                className={clsx(
                    "mb-3 flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    collapsed ? "justify-center" : "gap-3",
                    pathname === "/admin"
                        ? "bg-neutral-900 text-white shadow-sm"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                )}
            >
                <LayoutDashboard size={20} />

                {!collapsed && <span>Dashboard</span>}
            </Link>

            {/* Divider */}
            <div className="mb-2 border-t border-neutral-200" />

            {/* Sections */}
            {menuItems.map((section) => (
                <div key={section.section}>
                    {!collapsed && (
                        <p className="px-4 pb-2 pt-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                            {section.section}
                        </p>
                    )}

                    {section.items.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    "flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                    collapsed ? "justify-center" : "gap-3",
                                    isActive
                                        ? "bg-neutral-900 text-white shadow-sm"
                                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                                )}
                            >
                                <Icon size={20} />

                                {!collapsed && <span>{item.name}</span>}
                            </Link>
                        );
                    })}
                </div>
            ))}
        </nav>
    );
}