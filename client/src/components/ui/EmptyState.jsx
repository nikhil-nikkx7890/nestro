import { FolderOpen } from "lucide-react";

export default function EmptyState({
  icon: Icon = FolderOpen,
  title,
  message,
  buttonLabel,
  openModal,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Icon size={60} className="text-neutral-300" />

      <h3 className="mt-5 text-xl font-semibold">{title}</h3>

      <p className="mt-2 text-neutral-500">{message}</p>

      <button
        onClick={openModal}
        className="mt-6 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
