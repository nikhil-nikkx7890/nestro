export default function StorePagination({ pagination, onPageChange }) {
  const { page, totalPages, total } = pagination;

  if (totalPages <= 1) return null;

  return (
    <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[#E7DFD3] pt-8 sm:flex-row">
      <p className="text-sm text-[#8A8071]">
        Page {page} of {totalPages} &middot; {total} products
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-full border border-[#D8CDBB] px-5 py-2 text-sm font-medium text-[#2B2621] transition hover:border-[#B15E3B] hover:text-[#B15E3B] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#D8CDBB] disabled:hover:text-[#2B2621]"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-full border border-[#D8CDBB] px-5 py-2 text-sm font-medium text-[#2B2621] transition hover:border-[#B15E3B] hover:text-[#B15E3B] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#D8CDBB] disabled:hover:text-[#2B2621]"
        >
          Next
        </button>
      </div>
    </div>
  );
}
