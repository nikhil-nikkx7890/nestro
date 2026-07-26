import {
  Bell,
  ChevronDown,
  Search,
} from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-8">
      {/* Search */}

      <div className="relative w-full max-w-sm">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />

        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all duration-200 focus:border-neutral-900 focus:bg-white"
        />
      </div>

      {/* Right */}

      <div className="flex items-center gap-5">

        <button className="relative rounded-xl p-2 transition hover:bg-neutral-100">

          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>

        </button>

        <button className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-neutral-100">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 font-semibold text-white">
            A
          </div>

          <div className="text-left">
            <p className="text-sm font-medium">
              Admin
            </p>

            <p className="text-xs text-neutral-500">
              Super Admin
            </p>
          </div>

          <ChevronDown
            size={16}
            className="text-neutral-500"
          />

        </button>

      </div>

    </header>
  );
}