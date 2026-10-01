"use client";

import { Star } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "@/lib/account/client";
import { useCollection } from "@/lib/storage/local-collection";
import { favoritesStore } from "@/lib/sync/stores";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { showSaveError } from "./save-error";

/** Star a tool. Favourites show on the dashboard and follow signed-in users across devices. */
export function FavoriteButton({ slug, name }: { slug: string; name: string }) {
  const favorites = useCollection(favoritesStore);
  const account = useAccount();
  const active = favorites.some((f) => f.id === slug);

  const toggle = async () => {
    try {
      if (active) {
        await favoritesStore.remove(slug);
        toast.success(`Removed ${name} from favourites.`);
      } else {
        await favoritesStore.upsert({ id: slug, createdAt: new Date().toISOString() });
        toast.success(`Added ${name} to favourites.`, {
          description: account.status === "user" ? "Saved to your account." : "Saved on this device.",
        });
      }
    } catch (error) {
      showSaveError(error);
    }
  };

  return (
    <Button variant="outline" className="h-10 shrink-0 px-3" onClick={toggle} aria-pressed={active} disabled={account.status === "loading"}>
      <Star className={cn(active && "fill-amber-400 text-amber-500")} />
      <span className="hidden sm:inline">{active ? "Favourite" : "Add to favourites"}</span>
      <span className="sr-only sm:hidden">{active ? "Remove from favourites" : "Add to favourites"}</span>
    </Button>
  );
}
