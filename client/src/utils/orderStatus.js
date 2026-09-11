// Mirrors the backend's ORDER_STATUS_VALUES (server/src/models/order.model.js)
// and the transition rules in order.controller.js's isValidStatusTransition —
// duplicated here deliberately (this app already accepts some client/server
// schema duplication elsewhere, STATUS P3) so the admin UI can offer only
// the buttons that would actually succeed, without a round-trip just to
// find out. The backend remains the real enforcement; this is UX only.

export const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "OutForDelivery",
  "Delivered",
  "Cancelled",
  "Returned",
];

const FORWARD_SEQUENCE = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "OutForDelivery",
  "Delivered",
];

const CANCELLABLE_FROM = ["Pending", "Confirmed", "Processing"];

// Human-readable spacing for the one status with no natural word break —
// "OutForDelivery" the enum value, "Out for Delivery" on screen.
export const formatOrderStatus = (status) =>
  status === "OutForDelivery" ? "Out for Delivery" : status;

/** Every status an admin could legally move this order to right now. */
export const getNextStatusOptions = (currentStatus) => {
  const options = [];

  const forwardIndex = FORWARD_SEQUENCE.indexOf(currentStatus);
  if (forwardIndex !== -1 && forwardIndex + 1 < FORWARD_SEQUENCE.length) {
    options.push(FORWARD_SEQUENCE[forwardIndex + 1]);
  }
  if (CANCELLABLE_FROM.includes(currentStatus)) {
    options.push("Cancelled");
  }
  if (currentStatus === "Delivered") {
    options.push("Returned");
  }

  return options;
};

const STATUS_COLORS = {
  Pending: "bg-amber-100 text-amber-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Processing: "bg-indigo-100 text-indigo-800",
  Shipped: "bg-purple-100 text-purple-800",
  OutForDelivery: "bg-cyan-100 text-cyan-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
  Returned: "bg-neutral-200 text-neutral-700",
};

export const getStatusColorClasses = (status) =>
  STATUS_COLORS[status] || "bg-neutral-100 text-neutral-700";
