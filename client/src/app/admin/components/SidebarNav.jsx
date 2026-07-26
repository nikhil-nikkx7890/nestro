"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LayoutDashboard, FolderOpen, Package, ShoppingCart, Users, Settings } from "lucide-react"


const menuItems = [
    {
        name: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        name: "Categories",
        href: "/admin/categories",
        icon: FolderOpen,
    },
    {
        name: "Products",
        href: "/admin/products",
        icon: Package,
    },
    {
        name: "Orders",
        href: "/admin/orders",
        icon: ShoppingCart,
    },
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
];

export default function SidebarNav({ collapsed }) {
    const pathname = usePathname();
    return (
        <nav className="flex-1 flex-col gap-1 p-3">
            {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={clsx(
                            "flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",

                            collapsed
                                ? "justify-center"
                                : "gap-3",

                            isActive
                                ? "bg-neutral-900 shadow-sm text-white"
                                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                        )}
                    >
                        <Icon size={20} />

                        {!collapsed && (
                            <span>{item.name}</span>
                        )}
                    </Link>
                );
            })}

        </nav>
    );
}
