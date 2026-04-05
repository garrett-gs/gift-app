import Link from "next/link";
import { Gift, Users, ShoppingBag, Bell } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "transparent" }}>
      {/* Header */}
      <header className="border-b border-white/20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 text-white drop-shadow-md">
            <Gift className="h-6 w-6" />
            <span className="text-xl font-bold">GIFT</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-white hover:bg-white/10"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-neutral-900 shadow-md hover:bg-white/90"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1" style={{ background: "transparent" }}>
        <section className="mx-auto max-w-6xl px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-6xl">
            The gift registry
            <br />
            <span className="text-neutral-900/70">your family deserves</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 drop-shadow">
            Create wish lists for any occasion. Share with family and friends.
            Never get duplicate gifts again.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-neutral-900 px-6 text-sm font-semibold text-white shadow-lg hover:bg-neutral-800"
            >
              Get started free
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-lg border-2 border-white bg-white/90 px-6 text-sm font-semibold text-neutral-900 shadow-md hover:bg-white"
            >
              I have an account
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
              <Feature
                icon={<Gift className="h-8 w-8" />}
                title="Create Registries"
                description="Build wish lists for birthdays, holidays, weddings, or any occasion."
              />
              <Feature
                icon={<Users className="h-8 w-8" />}
                title="Share & Follow"
                description="Invite family and friends to view your lists. Follow theirs."
              />
              <Feature
                icon={<ShoppingBag className="h-8 w-8" />}
                title="No Duplicates"
                description="When someone buys a gift, others see it's taken. The recipient doesn't."
              />
              <Feature
                icon={<Bell className="h-8 w-8" />}
                title="Stay Updated"
                description="Get notified when new items are added to registries you follow."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-neutral-500">
          GIFT — Your universal gift registry
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      <p className="mt-2 text-sm text-neutral-500">{description}</p>
    </div>
  );
}
