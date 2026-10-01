"use client";

import { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground">An unexpected error occurred. Please try again — your inputs weren&apos;t sent anywhere.</p>
      <div className="flex gap-2">
        <Button className="h-11 px-5" onClick={reset}>
          Try again
        </Button>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "h-11 px-5")}>
          Go home
        </Link>
      </div>
    </div>
  );
}
