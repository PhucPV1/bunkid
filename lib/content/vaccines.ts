import data from "@/content/vaccines.vi.json";
import { VaccineContentSchema, type VaccineContent } from "./vaccineSchema";

// Parsed once at import: a malformed content file fails loudly in tests and builds.
export const VACCINES: VaccineContent = VaccineContentSchema.parse(data);
