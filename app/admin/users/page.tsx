import type { Metadata } from "next";
import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { getUsers, USERS_PAGE_SIZE } from "@/lib/server/admin";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserActions } from "@/components/admin/user-actions";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage(props: PageProps<"/admin/users">) {
  const admin = await requireAdmin();
  const params = await props.searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);
  const { total, users } = await getUsers({ query, page });
  const pages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));
  const pageHref = (p: number) => `/admin/users?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(p) })}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">{total.toLocaleString("en-IN")} {query ? "matching" : "total"}</p>
        </div>
        <form role="search" className="flex w-full gap-2 sm:w-80">
          <label htmlFor="user-search" className="sr-only">
            Search users
          </label>
          <Input id="user-search" name="q" defaultValue={query} placeholder="Search name or email" className="h-10 bg-background" />
          <Button type="submit" variant="outline" size="icon" className="size-10 shrink-0" aria-label="Search">
            <Search />
          </Button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
        <table className="w-full min-w-[52rem] text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">User</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Plan</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Sign-in</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Invoices</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Quotes</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Expenses</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Joined</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Last active</th>
              <th scope="col" className="px-2 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                  {query ? `No users match “${query}”.` : "No users yet."}
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id}>
                <td className="max-w-64 px-4 py-2.5">
                  <p className="truncate font-medium">
                    {u.name ?? "—"}
                    {u.role === "ADMIN" && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">Admin</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-2.5">
                  {u.proUntil ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900" title={`Until ${format(u.proUntil, "d MMM yyyy")}`}>
                      Pro · {format(u.proUntil, "d MMM yy")}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Free</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs">{u.signIn}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{u._count.invoices}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{u._count.quotations}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{u._count.expenses}</td>
                <td className="px-4 py-2.5 text-xs whitespace-nowrap">{format(u.createdAt, "d MMM yyyy")}</td>
                <td className="px-4 py-2.5 text-xs whitespace-nowrap text-muted-foreground">
                  {u.lastActiveAt ? `${formatDistanceToNowStrict(u.lastActiveAt)} ago` : "—"}
                </td>
                <td className="px-2 py-1.5 text-right">
                  <UserActions user={{ id: u.id, email: u.email, role: u.role, isPro: Boolean(u.proUntil), isSelf: u.id === admin.id }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <Link href={pageHref(page - 1)} aria-disabled={page <= 1} className={cn(buttonVariants({ variant: "outline" }), "h-9", page <= 1 && "pointer-events-none opacity-50")}>
              Previous
            </Link>
            <Link href={pageHref(page + 1)} aria-disabled={page >= pages} className={cn(buttonVariants({ variant: "outline" }), "h-9", page >= pages && "pointer-events-none opacity-50")}>
              Next
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
