import Link from "next/link";
import { Gift } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{ background: "transparent" }}>
      <Link href="/" className="mb-8 flex items-center gap-2 text-white drop-shadow-md">
        <Gift className="h-8 w-8" />
        <span className="text-2xl font-bold">GIFT</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
