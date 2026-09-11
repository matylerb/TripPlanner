export type TripStatus = "gathering" | "reviewing" | "committed" | "booked";

export interface Identity {
  id: string;
  name: string;
  color: string;
}

export interface Member {
  id: string;
  tripId: string;
  displayName: string;
  color: string;
  committed: boolean;
  isOrganizer: boolean;
  joinedAt: string;
}

export type Pace = "slow" | "balanced" | "packed";

export interface StructuredPrefs {
  destination?: string;
  surpriseMe?: boolean;
  origin?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
  flexibleDates?: boolean;
  nights?: number;
  budgetPerPerson?: number;
  pace?: Pace;
  interests?: string[];
  mustHaves?: string[];
  dealBreakers?: string[];
  climate?: "warm" | "cold" | "mild";
}

export interface PreferenceInput {
  id: string;
  tripId: string;
  memberId: string;
  source: "chat" | "questionnaire";
  rawContent: string;
  structured: StructuredPrefs | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  tripId: string;
  memberId: string; // "ai" for assistant, "system" for system
  kind: "user" | "ai" | "system";
  text: string;
  createdAt: string;
}

export type ItemType = "flight" | "lodging" | "activity" | "meal" | "transit";

export interface ItemDetails {
  description?: string;
  location?: string;
  lat?: number;
  lng?: number;
  startTime?: string;
  duration?: string;
  from?: string;
  to?: string;
  fromCode?: string;
  toCode?: string;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
  nights?: number;
}

export interface Comment {
  id: string;
  memberId: string;
  text: string;
  createdAt: string;
}

export interface ItineraryItem {
  id: string;
  dayId: string;
  type: ItemType;
  title: string;
  details: ItemDetails;
  costEstimate: number; // per person, USD
  orderIndex: number;
  votes: Record<string, "up" | "down">;
  comments: Comment[];
}

export interface ItineraryDay {
  id: string;
  tripId: string;
  dayNumber: number;
  date: string;
  location: string;
  lat: number;
  lng: number;
  headline?: string;
}

export type BudgetCategory =
  | "flights"
  | "lodging"
  | "food"
  | "activities"
  | "transit"
  | "buffer";

export interface BudgetLine {
  category: BudgetCategory;
  estimatedAmount: number; // whole group
  perPersonAmount: number;
}

export type BookingStatus = "suggested" | "selected" | "confirmed_by_user";

export interface BookingOption {
  id: string;
  itineraryItemId: string;
  provider: string;
  title: string;
  subtitle?: string;
  price: number; // per person
  rating?: number;
  tags?: string[];
  deepLink: string;
  status: BookingStatus;
  rank: number;
}

export interface Destination {
  name: string;
  country: string;
  lat: number;
  lng: number;
  airport: string;
  airportLat: number;
  airportLng: number;
}

export interface Trip {
  id: string;
  name: string;
  status: TripStatus;
  createdBy: string;
  createdAt: string;
  destination?: Destination;
  origin?: Destination;
  startDate?: string;
  endDate?: string;
  summary?: string;
  draftedAt?: string;
  committedAt?: string;
  bookedAt?: string;
  bookingSearchState?: "idle" | "searching" | "done";
}

export interface TripState {
  trip: Trip;
  members: Member[];
  inputs: PreferenceInput[];
  messages: ChatMessage[];
  days: ItineraryDay[];
  items: ItineraryItem[];
  budget: BudgetLine[];
  bookings: BookingOption[];
  version: number;
}

export interface Presence {
  memberId: string;
  name: string;
  color: string;
  view: string;
  at: number;
}
