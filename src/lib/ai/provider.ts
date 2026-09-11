import type { BookingOption, Destination, ItineraryDay, ItineraryItem, Member, PreferenceInput, StructuredPrefs, Trip } from "../types";

export type ProgressFn = (message: string) => void;

export interface DraftResult {
  destination: Destination;
  origin: Destination;
  startDate: string;
  endDate: string;
  summary: string;
  days: ItineraryDay[];
  items: ItineraryItem[];
}

export interface AIProvider {
  readonly name: string;
  parsePreferences(text: string, memberName: string): Promise<{ prefs: StructuredPrefs; reply: string }>;
  generateDraft(trip: Trip, inputs: PreferenceInput[], members: Member[], onProgress?: ProgressFn): Promise<DraftResult>;
  searchBookings(trip: Trip, items: ItineraryItem[], memberCount: number, onProgress?: ProgressFn): Promise<BookingOption[]>;
}
