import { FindFriends } from "@/components/shared/find-friends";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Friends",
};

export default function FindFriendsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Find Friends</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        See which of your contacts are already on GIFT
      </p>
      <div className="mt-8">
        <FindFriends />
      </div>
    </div>
  );
}
