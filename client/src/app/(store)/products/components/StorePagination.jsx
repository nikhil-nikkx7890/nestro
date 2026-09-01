export default function StorePagination({ pagination, onPageChange }) {
  const { page, totalPages, total } = pagination;

  if (totalPages <= 1) return null;

  return (
    <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[#E7E5E4] pt-8 sm:flex-row">
      <p className="text-sm text-[#78716C]">
        Page {page} of {totalPages} &middot; {total} products
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-[#D6D3D1] px-5 py-2 text-sm font-medium text-[#1C1917] transition hover:border-[#8B5E3C] hover:text-[#8B5E3C] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#D6D3D1] disabled:hover:text-[#1C1917]"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-[#D6D3D1] px-5 py-2 text-sm font-medium text-[#1C1917] transition hover:border-[#8B5E3C] hover:text-[#8B5E3C] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#D6D3D1] disabled:hover:text-[#1C1917]"
        >
          Next
        </button>
      </div>
    </div>
  );
}
