import Razorpay from "razorpay";

// Same lazy-construction reasoning as resend.js (ADR-062): building this
// eagerly at import time would mean every file that transitively imports
// the checkout controller — most of the app, via app.js — runs against
// whatever RAZORPAY_KEY_ID/SECRET happen to be set, including the test
// suite. Unlike Resend's client, `new Razorpay(...)` doesn't throw on a
// missing key by itself — the SDK only fails once an actual API call is
// made — but constructing it lazily keeps the same "fails only when
// actually used" shape as every other optional integration in this app,
// and keeps this module trivially mockable in tests (ADR-067).
export const getRazorpayClient = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
