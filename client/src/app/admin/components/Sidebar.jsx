"use client";

import { PanelLeftClose, LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import SidebarNav from "./SidebarNav";

export default function Sidebar({
    collapsed,
    onToggleCollapse,
    mobileNavOpen,
    onCloseMobileNav,
}) {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        toast.success("Logged out");
        router.push("/login");
    };

    const initial = user?.name?.charAt(0).toUpperCase() || "?";

    return (
        // Off-canvas below lg (slides in over the page), a normal sticky
        // column from lg up. `collapsed` only applies at lg+ — on a phone
        // the choice is open or closed, not wide or narrow.
        <aside
            className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-neutral-200 bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 lg:transition-all ${
                mobileNavOpen ? "translate-x-0" : "-translate-x-full"
            } ${collapsed ? "lg:w-20" : "lg:w-64"}`}
        >
            {/* Logo */}
            <section className="flex h-16 items-center border-b border-neutral-200 px-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900 font-bold text-white">
                        N
                    </div>

                    {!collapsed && (
                        <div>
                            <h2 className="font-semibold">
                                Nestro
                            </h2>

                            <p className="text-xs text-neutral-500">
                                Admin Panel
                            </p>
                        </div>
                    )}
                </div>

                <button
                    onClick={onToggleCollapse}
                    aria-label="Collapse sidebar"
                    className="ml-auto hidden rounded-xl p-2 transition hover:bg-neutral-100 lg:block"
                >
                    <PanelLeftClose
                        className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""
                            }`}
                        size={18}
                    />
                </button>

                <button
                    onClick={onCloseMobileNav}
                    aria-label="Close navigation"
                    className="ml-auto rounded-xl p-2 transition hover:bg-neutral-100 lg:hidden"
                >
                    <X size={18} />
                </button>
            </section>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-3" onClick={onCloseMobileNav}>
                <SidebarNav collapsed={collapsed} />
            </div>

            {/* Profile */}
            <section className="border-t border-neutral-200 p-4">
                <div
                    className={`flex ${collapsed ? "justify-center" : "items-center gap-3"
                        }`}
                >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-900 font-semibold text-white">
                        {initial}
                    </div>

                    {!collapsed && (
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                                {user?.name || "Admin"}
                            </p>

                            <p className="text-xs capitalize text-neutral-500">
                                {user?.role || "admin"}
                            </p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className={`mt-4 flex w-full items-center justify-center rounded-xl border border-neutral-200 py-2 transition hover:bg-neutral-100 ${collapsed ? "px-0" : "gap-2"
                        }`}
                >
                    <LogOut size={16} />

                    {!collapsed && <span>Logout</span>}
                </button>
            </section>
        </aside>
    );
}
