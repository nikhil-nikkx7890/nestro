"use client";

import { Star } from "lucide-react";

/**
 * Two modes from one component:
 * - display (default): read-only stars, half-filled by rounding to the
 *   nearest whole star, with the count beside them.
 * - interactive (onChange given): the star picker in the review form.
 *
 * Renders nothing at all when there's no rating and no count — a product
 * with no reviews shows no stars rather than an empty five-star row,
 * which would read as "rated zero".
 */
export default function StarRating({
  rating,
  count,
  size = 16,
  onChange,
  showCount = true,
  className = "",
}) {
  const interactive = typeof onChange === "function";
  const value = rating ?? 0;

  if (!interactive && !rating && !count) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.round(value);
          const icon = (
            <Star
              size={size}
              className={filled ? "text-[#B8863B]" : "text-[#D6D3D1]"}
              fill={filled ? "currentColor" : "none"}
            />
          );

          return interactive ? (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              className="-m-0.5 p-0.5 transition hover:scale-110"
            >
              {icon}
            </button>
          ) : (
            <span key={star}>{icon}</span>
          );
        })}
      </div>

      {!interactive && showCount && (
        <span className="text-xs text-[#78716C]">
          {rating ? rating.toFixed(1) : "—"}
          {typeof count === "number" && ` (${count})`}
        </span>
      )}
    </div>
  );
}
