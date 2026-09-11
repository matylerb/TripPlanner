import { nanoid } from "nanoid";
import type { Friend, SocialMessage, SocialState, SocialThread } from "../types";
import { MEMBER_COLORS } from "../format";

const ago = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();

export const FRIENDS: Friend[] = [
  { id: "fr_maya", name: "Maya Chen", color: MEMBER_COLORS[0], location: "Lisbon, PT", bio: "Books flights within the hour, packs the night before.", mutualTrips: 4, online: true, lastActiveAt: ago(0) },
  { id: "fr_jules", name: "Jules Fontaine", color: MEMBER_COLORS[1], location: "Paris, FR", bio: "Museum by day, wine bar by night.", mutualTrips: 2, online: false, lastActiveAt: ago(180) },
  { id: "fr_sam", name: "Sam Okafor", color: MEMBER_COLORS[2], location: "Austin, TX", bio: "Will find the best tacos within five miles, guaranteed.", mutualTrips: 6, online: true, lastActiveAt: ago(0) },
  { id: "fr_priya", name: "Priya Nair", color: MEMBER_COLORS[3], location: "Mumbai, IN", bio: "Has a spreadsheet for every trip. No exceptions.", mutualTrips: 3, online: false, lastActiveAt: ago(60 * 20) },
  { id: "fr_leo", name: "Leo Rossi", color: MEMBER_COLORS[4], location: "Milan, IT", bio: "Peak-bagger. Will suggest a sunrise hike, every time.", mutualTrips: 1, online: true, lastActiveAt: ago(0) },
  { id: "fr_noor", name: "Noor Haddad", color: MEMBER_COLORS[5], location: "Dubai, AE", bio: "Dive certified, always chasing the next reef.", mutualTrips: 2, online: false, lastActiveAt: ago(360) },
  { id: "fr_ruby", name: "Ruby Bennett", color: MEMBER_COLORS[6], location: "London, UK", bio: "Theatre kid. Finds the best rooftop bar in any city.", mutualTrips: 5, online: true, lastActiveAt: ago(0) },
  { id: "fr_kenji", name: "Kenji Watanabe", color: MEMBER_COLORS[7], location: "Osaka, JP", bio: "Ramen scholar. Trusts no 'best ramen in town' list.", mutualTrips: 1, online: false, lastActiveAt: ago(60 * 30) },
];

export function seedSocial(): SocialState {
  const threads: SocialThread[] = [
    { id: "th_maya", kind: "dm", memberIds: ["fr_maya"], createdAt: ago(60 * 24 * 3) },
    { id: "th_sam", kind: "dm", memberIds: ["fr_sam"], createdAt: ago(60 * 24 * 6) },
    { id: "th_squad", kind: "group", name: "Summer squad", emoji: "🌴", memberIds: ["fr_maya", "fr_sam", "fr_priya"], createdAt: ago(60 * 24 * 5) },
  ];

  const messages: SocialMessage[] = [
    // DM with Maya — trip-planning banter
    { id: nanoid(8), threadId: "th_maya", senderId: "fr_maya", text: "ok I cannot stop thinking about that Lisbon trip you mentioned", createdAt: ago(180) },
    { id: nanoid(8), threadId: "th_maya", senderId: "me", text: "right?? I keep pricing flights every night like a lunatic", createdAt: ago(176) },
    { id: nanoid(8), threadId: "th_maya", senderId: "fr_maya", text: "we should just start a real plan. group chat energy only gets us so far", createdAt: ago(170) },
    { id: nanoid(8), threadId: "th_maya", senderId: "fr_maya", text: "tag me in whenever you set one up 🙏", createdAt: ago(35) },

    // DM with Sam — shorter, casual
    { id: nanoid(8), threadId: "th_sam", senderId: "me", text: "still owe you a rematch for that taco crawl ranking", createdAt: ago(400) },
    { id: nanoid(8), threadId: "th_sam", senderId: "fr_sam", text: "any excuse to eat tacos again, I'm in", createdAt: ago(390) },
    { id: nanoid(8), threadId: "th_sam", senderId: "fr_sam", text: "let me know the dates whenever you land on something", createdAt: ago(50) },

    // Group thread — the setup for the "plan this trip" CTA
    { id: nanoid(8), threadId: "th_squad", senderId: "fr_priya", text: "ok this group needs a summer trip. non-negotiable", createdAt: ago(300) },
    { id: nanoid(8), threadId: "th_squad", senderId: "fr_sam", text: "yes. somewhere warm, somewhere with good food, that's the whole brief", createdAt: ago(295) },
    { id: nanoid(8), threadId: "th_squad", senderId: "fr_maya", text: "I have a spreadsheet started already don't @ me", createdAt: ago(280) },
    { id: nanoid(8), threadId: "th_squad", senderId: "fr_priya", text: "someone just needs to make it official 👀", createdAt: ago(20) },
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
    { friendId: "fr_maya", note: "Lives here" },
    { friendId: "fr_ruby", note: "Has a work trip that same week" },
  ],
  tokyo: [
    { friendId: "fr_kenji", note: "An hour away in Osaka" },
    { friendId: "fr_noor", note: "Chasing the same dates" },
  ],
  "mexico-city": [
    { friendId: "fr_sam", note: "Visiting family that month" },
  ],
  barcelona: [
    { friendId: "fr_jules", note: "Short flight from Paris" },
    { friendId: "fr_leo", note: "Road-tripping through Spain" },
  ],
  reykjavik: [
    { friendId: "fr_priya", note: "Chasing the northern lights too" },
  ],
  bali: [
    { friendId: "fr_noor", note: "Extending a dive trip" },
  ],
  marrakech: [
    { friendId: "fr_ruby", note: "Has family nearby" },
  ],
  "new-york": [
    { friendId: "fr_sam", note: "Close enough to fly in" },
    { friendId: "fr_priya", note: "There for a conference that week" },
  ],
  banff: [
    { friendId: "fr_leo", note: "Never misses a mountain trip" },
  ],
  kyoto: [
    { friendId: "fr_kenji", note: "Lives an hour away" },
  ],
};
