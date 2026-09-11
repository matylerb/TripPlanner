"use client";

import { AnimatePresence, Reorder, motion, useDragControls } from "framer-motion";
import { Clock, GripVertical, MapPin, MessageCircle, Plus, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, cn } from "@/components/ui";
import { ItemIcon, TYPE_META } from "./item-icon";
import { sortedItems, useStore } from "@/lib/store";
import type { ItemType, ItineraryDay, ItineraryItem, TripState } from "@/lib/types";
import { eur, fmtDate, timeAgo } from "@/lib/format";

export function Itinerary({ state, readOnly }: { state: TripState; readOnly?: boolean }) {
  return (
    <div className="space-y-6">
      {state.days.map((day, i) => (
        <DayCard key={day.id} day={day} state={state} index={i} readOnly={readOnly} />
      ))}
    </div>
  );
}

function DayCard({ day, state, index, readOnly }: { day: ItineraryDay; state: TripState; index: number; readOnly?: boolean }) {
  const reorderItems = useStore((s) => s.reorderItems);
  const addItem = useStore((s) => s.addItem);
  const updateDayLocation = useStore((s) => s.updateDayLocation);
  const items = sortedItems(state.items, day.id);
  const [order, setOrder] = useState(items.map((i) => i.id));
  const [adding, setAdding] = useState(false);
  const dayTotal = items.reduce((s, i) => s + i.costEstimate, 0);

  // Keep local order in sync with remote changes (other tabs) unless mid-drag.
  const dragging = useRef(false);
  useEffect(() => {
    if (!dragging.current) setOrder(items.map((i) => i.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.id).join("|")]);

  const byId = new Map(items.map((i) => [i.id, i]));
  const ordered = order.map((id) => byId.get(id)).filter(Boolean) as ItineraryItem[];

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.4), ease: [0.16, 1, 0.3, 1] }} className="card overflow-hidden">
      <header className="flex items-start gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-line-c">
        <div className="font-display text-[3.2rem] leading-[0.85] text-fg tabular w-14 shrink-0">{String(day.dayNumber).padStart(2, "0")}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm font-medium">{fmtDate(day.date, "weekday")}</span>
            {day.headline && <span className="text-[11px] font-mono uppercase tracking-wider text-accent">{day.headline}</span>}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-fg-3 text-sm">
            <MapPin className="size-3.5 shrink-0" />
            {readOnly ? (
              <span>{day.location}</span>
            ) : (
              <input value={day.location} onChange={(e) => updateDayLocation(state.trip.id, day.id, e.target.value)} className="bg-transparent outline-none focus:text-fg w-full min-w-0 border-b border-transparent focus:border-line-c" />
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="eyebrow">Day / person</div>
          <div className="font-display text-xl tabular">{eur(dayTotal)}</div>
        </div>
      </header>

      <Reorder.Group
        axis="y"
        values={order}
        onReorder={(next) => {
          dragging.current = true;
          setOrder(next);
        }}
        className="divide-y divide-line-c"
      >
        <AnimatePresence initial={false}>
          {ordered.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              state={state}
              readOnly={readOnly}
              onDrop={() => {
                dragging.current = false;
                reorderItems(state.trip.id, day.id, order);
              }}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {!readOnly && (
        <div className="px-5 sm:px-6 py-3 bg-bg-2/40">
          <AnimatePresence mode="wait" initial={false}>
            {adding ? (
              <motion.div key="types" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex flex-wrap items-center gap-2">
                {(Object.keys(TYPE_META) as ItemType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      addItem(state.trip.id, day.id, t);
                      setAdding(false);
                    }}
                    className="chip"
                  >
                    <ItemIcon type={t} size={18} /> {TYPE_META[t].label}
                  </button>
                ))}
                <button onClick={() => setAdding(false)} className="text-xs text-fg-3 hover:text-fg ml-1">
                  Cancel
                </button>
              </motion.div>
            ) : (
              <motion.button key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAdding(true)} className="flex items-center gap-2 text-sm text-fg-3 hover:text-fg transition-colors">
                <Plus className="size-4" /> Add to day {day.dayNumber}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.section>
  );
}

function ItemRow({ item, state, readOnly, onDrop }: { item: ItineraryItem; state: TripState; readOnly?: boolean; onDrop: () => void }) {
  const me = useStore((s) => s.me)!;
  const updateItem = useStore((s) => s.updateItem);
  const deleteItem = useStore((s) => s.deleteItem);
  const vote = useStore((s) => s.vote);
  const addComment = useStore((s) => s.addComment);
  const controls = useDragControls();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [editingCost, setEditingCost] = useState(false);
  const tripId = state.trip.id;

  const ups = Object.values(item.votes).filter((v) => v === "up").length;
  const downs = Object.values(item.votes).filter((v) => v === "down").length;
  const mine = item.votes[me.id];
  const voters = (kind: "up" | "down") => Object.entries(item.votes).filter(([, v]) => v === kind).map(([id]) => state.members.find((m) => m.id === id)).filter(Boolean);

  return (
    <Reorder.Item
      value={item.id}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDrop}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      whileDrag={{ scale: 1.01, boxShadow: "var(--shadow-lg)", zIndex: 10, backgroundColor: "var(--card)" }}
      className="relative bg-card"
    >
      <div className="group flex items-start gap-3 px-3 sm:px-5 py-3.5">
        {!readOnly && (
          <button onPointerDown={(e) => controls.start(e)} className="mt-2 cursor-grab active:cursor-grabbing text-fg-4 hover:text-fg-2 touch-none" aria-label="Drag to reorder">
            <GripVertical className="size-4" />
          </button>
        )}
        <ItemIcon type={item.type} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            {readOnly ? (
              <div className="font-medium leading-snug">{item.title}</div>
            ) : (
              <input
                value={item.title}
                onChange={(e) => updateItem(tripId, item.id, { title: e.target.value })}
                className="font-medium leading-snug bg-transparent outline-none w-full min-w-0 rounded px-1 -mx-1 focus:bg-bg-2"
              />
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-fg-3">
            {item.details.startTime && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" /> {item.details.startTime}
                {item.details.duration && ` · ${item.details.duration}`}
              </span>
            )}
            {item.details.nights && <span>{item.details.nights} nights</span>}
            {item.details.description && <span className="text-fg-3/90 line-clamp-1">{item.details.description}</span>}
          </div>

          {/* Votes + comments row */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <VoteButton kind="up" active={mine === "up"} count={ups} disabled={readOnly} onClick={() => vote(tripId, item.id, "up")} voters={voters("up") as { displayName: string; color: string; id: string }[]} />
            <VoteButton kind="down" active={mine === "down"} count={downs} disabled={readOnly} onClick={() => vote(tripId, item.id, "down")} voters={voters("down") as { displayName: string; color: string; id: string }[]} />
            <button onClick={() => setOpen((o) => !o)} className={cn("inline-flex items-center gap-1 rounded-full border px-2 h-7 text-xs transition-colors", open || item.comments.length ? "border-line-c text-fg-2 bg-bg-2" : "border-transparent text-fg-4 hover:text-fg-2")}>
              <MessageCircle className="size-3.5" /> {item.comments.length || (readOnly ? "" : "Comment")}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-3 rounded-xl bg-bg-2 border border-line-c p-3 space-y-2.5">
                  {item.comments.length === 0 && <p className="text-xs text-fg-3">No comments yet.</p>}
                  {item.comments.map((c) => {
                    const m = state.members.find((x) => x.id === c.memberId);
                    return (
                      <div key={c.id} className="flex gap-2 text-sm">
                        <Avatar name={m?.displayName ?? "?"} color={m?.color ?? "#888"} size={22} />
                        <div className="min-w-0">
                          <span className="font-medium">{m?.displayName}</span> <span className="text-fg-4 text-xs">{timeAgo(c.createdAt)}</span>
                          <p className="text-fg-2 leading-relaxed">{c.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  {!readOnly && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!comment.trim()) return;
                        addComment(tripId, item.id, comment);
                        setComment("");
                      }}
                      className="flex gap-2"
                    >
                      <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" className="field !py-1.5 !px-3 text-sm" />
                      <button type="submit" className="text-sm font-medium text-accent disabled:opacity-40" disabled={!comment.trim()}>
                        Post
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Cost */}
        <div className="text-right shrink-0 w-[4.5rem] sm:w-24">
          {readOnly ? (
            <div className="font-display text-lg tabular">{item.costEstimate ? eur(item.costEstimate) : "Free"}</div>
          ) : editingCost ? (
            <input
              autoFocus
              type="number"
              min={0}
              defaultValue={item.costEstimate}
              onBlur={(e) => {
                updateItem(tripId, item.id, { costEstimate: +e.target.value });
                setEditingCost(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setEditingCost(false);
              }}
              className="field !py-1 !px-2 text-right text-sm w-full tabular"
            />
          ) : (
            <button onClick={() => setEditingCost(true)} className="font-display text-lg tabular hover:text-accent transition-colors" title="Edit cost per person">
              {item.costEstimate ? eur(item.costEstimate) : "Free"}
            </button>
          )}
          <div className="text-[10px] text-fg-4 font-mono uppercase tracking-wider">per person</div>
        </div>

        {!readOnly && (
          <button onClick={() => deleteItem(tripId, item.id)} className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 grid place-items-center size-7 rounded-lg text-fg-4 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all" aria-label="Delete">
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </Reorder.Item>
  );
}

function VoteButton({ kind, active, count, onClick, disabled, voters }: { kind: "up" | "down"; active: boolean; count: number; onClick: () => void; disabled?: boolean; voters: { displayName: string; color: string; id: string }[] }) {
  const Icon = kind === "up" ? ThumbsUp : ThumbsDown;
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      disabled={disabled}
      title={voters.map((v) => v.displayName).join(", ") || (kind === "up" ? "Upvote" : "Downvote")}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 h-7 text-xs transition-all disabled:cursor-default",
        active ? (kind === "up" ? "bg-sage text-white border-sage" : "bg-plum text-white border-plum") : count ? "border-line-c bg-bg-2 text-fg-2" : "border-transparent text-fg-4 hover:text-fg-2 hover:border-line-c",
      )}
    >
      <Icon className="size-3.5" />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={count} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -6, opacity: 0 }} className="tabular min-w-[0.6em] text-center">
          {count || ""}
        </motion.span>
      </AnimatePresence>
      {voters.length > 0 && (
        <span className="flex -space-x-1 ml-0.5">
          {voters.slice(0, 3).map((v) => (
            <span key={v.id} className="size-3 rounded-full ring-1 ring-[var(--card)]" style={{ background: v.color }} />
          ))}
        </span>
      )}
    </motion.button>
  );
}
