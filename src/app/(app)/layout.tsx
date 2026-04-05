import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNav } from "@/components/layout/top-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName =
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    "User";

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav displayName={displayName} />
        <main className="flex-1 overflow-x-hidden px-4 py-6 pb-24 md:px-8 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
