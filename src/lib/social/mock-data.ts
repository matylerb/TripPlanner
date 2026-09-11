import { nanoid } from "nanoid";
import type { Friend, SocialMessage, SocialState, SocialThread } from "../types";
import { MEMBER_COLORS } from "../format";

const ago = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();

export const FRIENDS: Friend[] = [
  { id: "fr_sanidhya", name: "Sanidhya", color: MEMBER_COLORS[0], location: "Bengaluru, IN", bio: "Books flights within the hour, packs the night before.", mutualTrips: 4, online: true, lastActiveAt: ago(0) },
  { id: "fr_aishwarya", name: "Aishwarya", color: MEMBER_COLORS[1], location: "Mumbai, IN", bio: "Has a spreadsheet for every trip. No exceptions.", mutualTrips: 3, online: true, lastActiveAt: ago(0) },
  { id: "fr_taylor", name: "Taylor", color: MEMBER_COLORS[2], location: "Austin, TX", bio: "Will find the best tacos within five miles, guaranteed.", mutualTrips: 6, online: false, lastActiveAt: ago(90) },
  { id: "fr_adam", name: "Adam", color: MEMBER_COLORS[3], location: "London, UK", bio: "Peak-bagger. Will suggest a sunrise hike, every time.", mutualTrips: 2, online: true, lastActiveAt: ago(0) },
];

export function seedSocial(): SocialState {
  const threads: SocialThread[] = [
    { id: "th_sanidhya", kind: "dm", memberIds: ["fr_sanidhya"], createdAt: ago(60 * 24 * 3) },
    { id: "th_taylor", kind: "dm", memberIds: ["fr_taylor"], createdAt: ago(60 * 24 * 6) },
    { id: "th_squad", kind: "group", name: "Summer squad", emoji: "🌴", memberIds: ["fr_sanidhya", "fr_aishwarya", "fr_taylor", "fr_adam"], createdAt: ago(60 * 24 * 5) },
  ];

  const messages: SocialMessage[] = [
    // DM with Sanidhya — trip-planning banter
    { id: nanoid(8), threadId: "th_sanidhya", senderId: "fr_sanidhya", text: "ok I cannot stop thinking about that Lisbon trip you mentioned", createdAt: ago(180) },
    { id: nanoid(8), threadId: "th_sanidhya", senderId: "me", text: "right?? I keep pricing flights every night like a lunatic", createdAt: ago(176) },
    { id: nanoid(8), threadId: "th_sanidhya", senderId: "fr_sanidhya", text: "we should just start a real plan. group chat energy only gets us so far", createdAt: ago(170) },
    { id: nanoid(8), threadId: "th_sanidhya", senderId: "fr_sanidhya", text: "tag me in whenever you set one up 🙏", createdAt: ago(35) },

    // DM with Taylor — shorter, casual
    { id: nanoid(8), threadId: "th_taylor", senderId: "me", text: "still owe you a rematch for that taco crawl ranking", createdAt: ago(400) },
    { id: nanoid(8), threadId: "th_taylor", senderId: "fr_taylor", text: "any excuse to eat tacos again, I'm in", createdAt: ago(390) },
    { id: nanoid(8), threadId: "th_taylor", senderId: "fr_taylor", text: "let me know the dates whenever you land on something", createdAt: ago(50) },

    // Group thread — the setup for the "plan this trip" CTA
    { id: nanoid(8), threadId: "th_squad", senderId: "fr_aishwarya", text: "ok this group needs a summer trip. non-negotiable", createdAt: ago(300) },
    { id: nanoid(8), threadId: "th_squad", senderId: "fr_taylor", text: "yes. somewhere warm, somewhere with good food, that's the whole brief", createdAt: ago(295) },
    { id: nanoid(8), threadId: "th_squad", senderId: "fr_adam", text: "as long as there's one actual hike in there I'm happy", createdAt: ago(290) },
    { id: nanoid(8), threadId: "th_squad", senderId: "fr_sanidhya", text: "budget check: I can do ~€1,200 all in if we book flights this month", createdAt: ago(270) },
    { id: nanoid(8), threadId: "th_squad", senderId: "fr_aishwarya", text: "I have a spreadsheet started already don't @ me", createdAt: ago(268) },
    { id: nanoid(8), threadId: "th_squad", senderId: "me", text: "ok I'll set up a proper plan tonight and get everyone's dates in", createdAt: ago(120) },
    { id: nanoid(8), threadId: "th_squad", senderId: "fr_adam", text: "legend. no red-eyes though, I mean it", createdAt: ago(60) },
    { id: nanoid(8), threadId: "th_squad", senderId: "fr_aishwarya", text: "someone just needs to make it official 👀", createdAt: ago(20) },
  ];

  return { friends: FRIENDS, threads, messages };
}

const GENERIC_REPLIES = [
  "haha yes, I'm so in",
  "wait tell me more",
  "okay this is exactly what I needed today",
  "say less, I'm already checking flights",
  "obsessed with this idea honestly",
  "I was JUST thinking about this",
  "sold. when are we doing this",
  "ok you have my full attention",
  "this is either genius or a terrible idea, love that for us",
  "I'll believe it when I see a real itinerary 😏",
  "counting me in before you even finish that thought",
  "can we make this happen for real this time",
];

const TRIP_LINKED_REPLIES = [
  "just saw the plan, that looks so good",
  "ok the budget is very reasonable actually",
  "can we lock in dates soon? trying to plan around this",
  "I'm free basically whenever, just tell me when",
  "that itinerary better still have a free day in it",
  "already thinking about what to pack",
  "this is going to be so good, I can feel it",
  "put me down for window seat, thanks in advance",
  "who's handling the group chat memes for this one",
];

export function pickReply(hasLinkedTrip: boolean): string {
  const pool = hasLinkedTrip ? TRIP_LINKED_REPLIES : GENERIC_REPLIES;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Which friends happen to be based in or passing through each destination —
 * keyed by the destination `slug` from `lib/ai/destinations.ts`. Made up for the demo,
 * so the planner can surface "you know someone there" without any real location data.
 */
export const FRIENDS_BY_DESTINATION: Record<string, { friendId: string; note: string }[]> = {
  lisbon: [
    { friendId: "fr_sanidhya", note: "Lives here" },
    { friendId: "fr_adam", note: "Has a work trip that same week" },
  ],
  tokyo: [
    { friendId: "fr_adam", note: "Chasing the same dates" },
    { friendId: "fr_taylor", note: "Transiting through on the way back" },
  ],
  "mexico-city": [
    { friendId: "fr_taylor", note: "Visiting family that month" },
  ],
  barcelona: [
    { friendId: "fr_aishwarya", note: "Short flight in for the weekend" },
    { friendId: "fr_sanidhya", note: "Road-tripping through Spain" },
  ],
  reykjavik: [
    { friendId: "fr_aishwarya", note: "Chasing the northern lights too" },
  ],
  bali: [
    { friendId: "fr_taylor", note: "Extending a dive trip" },
  ],
  marrakech: [
    { friendId: "fr_adam", note: "Has family nearby" },
  ],
  "new-york": [
    { friendId: "fr_taylor", note: "Close enough to fly in" },
    { friendId: "fr_aishwarya", note: "There for a conference that week" },
  ],
  banff: [
    { friendId: "fr_adam", note: "Never misses a mountain trip" },
  ],
  kyoto: [
    { friendId: "fr_sanidhya", note: "Been talking about this one for years" },
  ],
};
