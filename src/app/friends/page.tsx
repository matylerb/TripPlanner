import { Suspense } from "react";
import { FriendsView } from "@/components/social/friends-view";

export default function FriendsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <FriendsView />
    </Suspense>
  );
}
