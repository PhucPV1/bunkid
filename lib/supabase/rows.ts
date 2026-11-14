import type { Database } from "./types";

type Tables = Database["public"]["Tables"];

export type Family = Tables["families"]["Row"];
export type FamilyMember = Tables["family_members"]["Row"];
export type Baby = Tables["babies"]["Row"];
export type LogRow = Tables["logs"]["Row"];
export type VaccineDoseRow = Tables["vaccine_doses"]["Row"];
export type EmergencyContactRow = Tables["emergency_contacts"]["Row"];
export type GrowthRow = Tables["growth"]["Row"];
export type MusicLinkRow = Tables["music_links"]["Row"];
export type PhotoRow = Tables["photos"]["Row"];
export type MilestoneRow = Tables["milestones_achieved"]["Row"];
