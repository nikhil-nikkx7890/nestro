// Mirrors ProductCard's shape (square image, then four short text rows)
// so the grid doesn't jump when real cards replace it — the point of a
// skeleton over a "Loading..." line is that the layout is already there.
export default function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square w-full rounded-2xl bg-[#E7E5E4]" />

      <div className="mt-3 space-y-2 sm:mt-4">
        <div className="h-2.5 w-16 rounded bg-[#E7E5E4]" />
        <div className="h-4 w-4/5 rounded bg-[#E7E5E4]" />
        <div className="h-3 w-1/2 rounded bg-[#E7E5E4]" />
        <div className="h-4 w-20 rounded bg-[#E7E5E4]" />
      </div>
    </div>
  );
}
