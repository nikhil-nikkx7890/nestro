import { PanelLeftClose, LogOut } from "lucide-react";
import SidebarNav from "./SidebarNav";

export default function Sidebar({
    collapsed,
    onToggleCollapse,
}) {
    return (
        <aside
            className={`sticky top-0 h-screen flex flex-col border-r border-neutral-200 bg-white transition-all duration-300 ${collapsed ? "w-20" : "w-64"
                }`}
        >
            {/* Logo */}
            <section className="flex h-16 items-center border-b border-neutral-200 px-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 font-bold text-white">
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
                    className="ml-auto rounded-xl p-2 transition hover:bg-neutral-100"
                >
                    <PanelLeftClose
                        className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""
                            }`}
                        size={18}
                    />
                </button>
            </section>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-3">
                <SidebarNav collapsed={collapsed} />
            </div>

            {/* Profile */}
            <section className="border-t border-neutral-200 p-4">
                <div
                    className={`flex ${collapsed ? "justify-center" : "items-center gap-3"
                        }`}
                >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 font-semibold text-white">
                        A
                    </div>

                    {!collapsed && (
                        <div className="flex-1">
                            <p className="text-sm font-medium">
                                Admin
                            </p>

                            <p className="text-xs text-neutral-500">
                                Super Admin
                            </p>
                        </div>
                    )}
                </div>

                <button
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