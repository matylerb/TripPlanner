"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { Avatar, Button, cn } from "@/components/ui";
import { useSocialStore } from "@/lib/social/store";

const EMOJIS = ["🌴", "🏔️", "🌍", "🎒", "✈️", "🏖️", "🍜", "🗺️"];

export function NewGroupSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const friends = useSocialStore((s) => s.friends);
  const createGroupThread = useSocialStore((s) => s.createGroupThread);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [picked, setPicked] = useState<string[]>([]);

  const reset = () => {
    setName("");
    setEmoji(EMOJIS[0]);
    setPicked([]);
  };

  const create = () => {
    if (!name.trim() || picked.length === 0) return;
    const id = createGroupThread(name.trim(), emoji, picked);
    reset();
    onCreated(id);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-md p-6 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl">New group chat</h2>
              <button onClick={onClose} className="grid place-items-center size-8 rounded-full text-fg-3 hover:text-fg hover:bg-bg-2 transition-colors">
                <X className="size-4" />
              </button>
            </div>

            <label className="block mb-4">
              <span className="text-sm font-medium">Group name</span>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer squad" className="field mt-2" maxLength={40} />
            </label>

            <div className="mb-5">
              <span className="text-sm font-medium">Icon</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {EMOJIS.map((e) => (
                  <button key={e} type="button" onClick={() => setEmoji(e)} className={cn("size-9 rounded-xl border grid place-items-center text-lg transition-all", emoji === e ? "border-accent bg-accent-soft scale-105" : "border-line-c hover:border-fg-4")}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <span className="text-sm font-medium">Add friends</span>
              <div className="mt-2 space-y-1 max-h-56 overflow-y-auto">
                {friends.map((f) => {
                  const on = picked.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setPicked((p) => (on ? p.filter((x) => x !== f.id) : [...p, f.id]))}
                      className={cn("w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors", on ? "bg-accent-soft" : "hover:bg-bg-2")}
                    >
                      <Avatar name={f.name} color={f.color} size={34} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium truncate">{f.name}</span>
                        <span className="block text-[11px] text-fg-3 truncate">{f.location}</span>
                      </span>
                      <span className={cn("grid place-items-center size-5 rounded-full border shrink-0", on ? "bg-accent border-accent text-white" : "border-line-c")}>{on && <Check className="size-3" />}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button className="w-full" disabled={!name.trim() || picked.length === 0} onClick={create}>
              Create group ({picked.length})
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
