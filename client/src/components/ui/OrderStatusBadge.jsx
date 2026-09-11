import clsx from "clsx";
import { formatOrderStatus, getStatusColorClasses } from "@/utils/orderStatus";

export default function OrderStatusBadge({ status, className }) {
  return (
    <span
      className={clsx(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        getStatusColorClasses(status),
        className,
      )}
    >
      {formatOrderStatus(status)}
    </span>
  );
}
