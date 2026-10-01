"use client";

import dynamic from "next/dynamic";

/** Client-only so a generated password never appears in server-rendered HTML. */
export const PasswordGeneratorLoader = dynamic(() => import("./password-generator").then((m) => m.PasswordGenerator), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-xl bg-muted" aria-busy="true" aria-label="Loading" />,
});
