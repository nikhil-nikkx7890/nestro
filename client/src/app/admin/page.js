import {
    DollarSign,
    FolderOpen,
    Package,
    ShoppingCart,
} from "lucide-react";

import StatCard from "@/components/ui/StatCard";

export default function DashboardPage() {
    const recentOrders = [
  {
    id: "#1023",
    customer: "John Doe",
    amount: "$125",
    status: "Completed",
  },
  {
    id: "#1024",
    customer: "Sarah",
    amount: "$98",
    status: "Pending",
  },
  {
    id: "#1025",
    customer: "Alex",
    amount: "$250",
    status: "Completed",
  },
];
    return (
        <div className="space-y-8">

            {/* Heading */}

            <div>

                <h1 className="text-4xl font-bold tracking-tight">
                    Dashboard
                </h1>

                <p className="mt-2 text-neutral-500">
                    Welcome back 👋 Here's what's happening today.
                </p>

            </div>

            {/* Cards */}

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

                <StatCard
                    title="Products"
                    value="120"
                    subtitle="12 added this month"
                    icon={Package}
                />

                <StatCard
                    title="Categories"
                    value="18"
                    subtitle="3 active"
                    icon={FolderOpen}
                />

                <StatCard
                    title="Orders"
                    value="256"
                    subtitle="18 pending"
                    icon={ShoppingCart}
                />

                <StatCard
                    title="Revenue"
                    value="$12,345"
                    subtitle="+18% from last month"
                    icon={DollarSign}
                />

            </div>

            {/* Bottom Section */}

            <div className="grid gap-6 xl:grid-cols-3">

                {/* Recent Orders */}

                <section className="col-span-2 rounded-2xl border border-neutral-200 bg-white p-6">

                    <div className="mb-6 flex items-center justify-between">

                        <h2 className="text-lg font-semibold">
                            Recent Orders
                        </h2>

                        <button className="text-sm font-medium text-neutral-500 hover:text-neutral-900">
                            View All
                        </button>

                    </div>

                    <div className="space-y-4">

                        {recentOrders.map((order) => (
                            <div
                                key={order.id}
                                className="flex items-center justify-between rounded-xl border border-neutral-200 p-4"
                            >
                                <div>
                                    <p className="font-medium">
                                        {order.customer}
                                    </p>

                                    <p className="text-sm text-neutral-500">
                                        {order.id}
                                    </p>
                                </div>

                                <div className="text-right">

                                    <p className="font-semibold">
                                        {order.amount}
                                    </p>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-medium ${order.status === "Completed"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-yellow-100 text-yellow-700"
                                            }`}
                                    >
                                        {order.status}
                                    </span>

                                </div>

                            </div>
                        ))}

                    </div>

                </section>

                {/* Quick Actions */}

                <section className="rounded-2xl border border-neutral-200 bg-white p-6">

                    <h2 className="mb-5 text-lg font-semibold">
                        Quick Actions
                    </h2>

                    <div className="space-y-3">

                        <button className="w-full rounded-xl bg-neutral-900 py-3 font-medium text-white transition hover:bg-neutral-800">
                            Add Product
                        </button>

                        <button className="w-full rounded-xl border border-neutral-200 py-3 font-medium transition hover:bg-neutral-100">
                            Create Category
                        </button>

                        <button className="w-full rounded-xl border border-neutral-200 py-3 font-medium transition hover:bg-neutral-100">
                            View Orders
                        </button>

                    </div>

                </section>

            </div>

        </div>
    );
}