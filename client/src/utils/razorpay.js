const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let scriptLoadingPromise = null;

// Checkout.js attaches window.Razorpay as a side effect of the script
// loading, and this app needs the widget from more than one page
// (checkout itself, and a "Retry Payment" action on an already-created
// but still-unpaid order) — loading it once here, memoized, avoids
// re-injecting the script tag on every open and avoids tying it to any
// one page's mount lifecycle.
const loadRazorpayScript = () => {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
};

/**
 * Opens Razorpay's Checkout.js widget for an already-created Razorpay
 * order. Used both right after checkout and from a "Retry Payment"
 * action on an existing order stuck at paymentStatus "Pending" — the
 * widget doesn't distinguish the two, since a Razorpay order accepts a
 * new payment attempt until one actually succeeds.
 *
 * `onSuccess` and `onDismissOrFail` are both purely client-side signals
 * (ADR-067) — closing the modal, an explicit payment.failed event, and a
 * successful `handler` callback are the only three ways this ever
 * resolves, and none of them touch the Order in this app's database.
 * The caller's job is only to give the shopper immediate feedback and
 * send them to a page that reads the order's real, webhook-confirmed
 * paymentStatus — never to treat "the widget said success" as the order
 * actually being paid.
 */
export const openRazorpayCheckout = async ({
  orderId,
  amount,
  currency,
  keyId,
  prefill = {},
  onSuccess,
  onDismissOrFail,
}) => {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    onDismissOrFail(new Error("Could not load the payment widget. Please try again."));
    return;
  }

  const rzp = new window.Razorpay({
    key: keyId,
    amount,
    currency,
    order_id: orderId,
    name: "Nestro",
    description: "Order payment",
    prefill,
    theme: { color: "#8B5E3C" },
    handler: () => onSuccess(),
    modal: {
      ondismiss: () => onDismissOrFail(),
    },
  });

  rzp.on("payment.failed", () => onDismissOrFail());
  rzp.open();
};
