import clsx from "clsx";
import { getPaymentStatusColorClasses } from "@/utils/orderStatus";

export default function PaymentStatusBadge({ paymentMethod, paymentStatus, className }) {
  const label = paymentMethod === "COD" ? "COD" : `Razorpay · ${paymentStatus}`;

  return (
    <span
      className={clsx(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        getPaymentStatusColorClasses(paymentStatus),
        className,
      )}
    >
      {label}
    </span>
  );
}
