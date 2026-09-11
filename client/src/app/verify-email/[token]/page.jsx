"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { authService } from "@/services/auth.service";

// "checking" -> "success" | "error". Not a boolean — there are three
// distinct things to render (a spinner, a success card, a failure card
// with a way to get a fresh link), not a binary.
export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("");

  // Category A (ADR-059): the verification itself is the side effect
  // this page exists to perform — there's no user action to wait for,
  // it has to happen on mount. No sessionStorage guard the way the
  // password-reset pages have one: unlike those, this route is meant to
  // be reachable directly (it's exactly what the emailed link points
  // at), and re-verifying is harmless by design (ADR-063).
  //
  // No eslint-disable needed here, unlike those two pages — the setState
  // calls below run inside a .then()/.catch() callback, genuinely async
  // relative to the effect body, which is the pattern
  // react-hooks/set-state-in-effect's own message explicitly allows
  // ("calling setState in a callback function when external state
  // changes"). Only a *synchronous* setState in the effect body itself
  // triggers the rule.
  useEffect(() => {
    if (!token) return;

    authService
      .verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((error) => {
        setStatus("error");
        setMessage(
          error?.response?.data?.message ||
            "This verification link has expired or is invalid.",
        );
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        {status === "checking" && (
          <>
            <h1 className="text-2xl font-bold tracking-tight">Verifying...</h1>
            <p className="mt-2 text-sm text-neutral-500">One moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="text-2xl font-bold tracking-tight">Email verified</h1>
            <p className="mt-2 text-sm text-neutral-500">{message}</p>
            <Link
              href="/account"
              className="mt-6 inline-block rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Go to your account
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold tracking-tight">Link expired</h1>
            <p className="mt-2 text-sm text-neutral-500">{message}</p>
            <p className="mt-6 text-sm text-neutral-500">
              Signed in already? Request a fresh link from your{" "}
              <Link href="/account" className="font-medium text-neutral-900 hover:underline">
                account page
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}
