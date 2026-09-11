"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Logo, ThemeToggle, cn } from "@/components/ui";
import { useSocialStore } from "@/lib/social/store";
import { ChatWindow, EmptyChatState } from "./chat-window";
import { NewGroupSheet } from "./new-group-sheet";
import { ThreadList } from "./thread-list";

export function FriendsView() {
  const params = useSearchParams();
  const hydrated = useSocialStore((s) => s.hydrated);
  const threads = useSocialStore((s) => s.threads);
  const [selectedId, setSelectedId] = useState<string | null>(() => params.get("thread"));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState<"chats" | "friends">("chats");

  const selected = threads.find((t) => t.id === selectedId) ?? null;

  if (!hydrated) return <div className="min-h-screen" />;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="shrink-0 border-b border-line-c">
        <div className="px-4 sm:px-8 h-16 flex items-center gap-3">
          <Link href="/" className="text-fg-3 hover:text-fg transition-colors" aria-label="Back home">
            <ArrowLeft className="size-4" />
          </Link>
          <Logo compact />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-[380px_1fr] min-h-0">
        <div className={cn("border-r border-line-c min-h-0", selected && "hidden lg:block")}>
          <ThreadList selectedId={selectedId} onSelect={setSelectedId} onNewGroup={() => setSheetOpen(true)} tab={tab} onTabChange={setTab} />
        </div>
        <div className={cn("min-h-0", !selected && "hidden lg:block")}>
          {selected ? (
            <div className="h-full flex flex-col">
              <div className="lg:hidden px-3 pt-3">
                <button onClick={() => setSelectedId(null)} className="inline-flex items-center gap-1.5 text-sm text-fg-3 hover:text-fg transition-colors">
                  <ArrowLeft className="size-4" /> All chats
                </button>
              </div>
              <ChatWindow key={selected.id} thread={selected} />
            </div>
          ) : (
            <EmptyChatState onNewGroup={() => setSheetOpen(true)} />
          )}
        </div>
      </div>

      <NewGroupSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onCreated={(id) => { setSheetOpen(false); setTab("chats"); setSelectedId(id); }} />
    </div>
  );
}
