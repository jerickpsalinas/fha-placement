import type { GradeLevel } from "@/types";

/**
 * Reference data for FHA's placement engine.
 *
 * Every table here is transcribed from the school's own Placement Guide — the
 * course names, RIT cutoffs, and FAST mappings are the client's, not ours. Keep
 * this file as pure data so the placement rules in `engine.ts` stay readable and
 * so staff-visible course names can be corrected without touching logic.
 */

export type PlacementLevel = "intervention" | "on_level" | "advanced" | "whole_group";

/** The three leveled tiers, in order. `whole_group` is deliberately excluded. */
export type LeveledPlacement = Exclude<PlacementLevel, "whole_group">;

export const PLACEMENT_LEVEL_LABELS: Record<PlacementLevel, string> = {
  intervention: "Intervention",
  on_level: "On-Level",
  advanced: "Advanced",
  whole_group: "Whole-Group",
};

/**
 * NWEA MAP Growth RIT norms by grade.
 *
 * `math25` / `read25` are the 25th-percentile cutoffs — below these a student is
 * placed in Intervention. `math75` / `read75` are the 75th-percentile cutoffs —
 * at or above these a student is placed in Advanced. Everything between is
 * On-Level. `mathAvg` / `readAvg` are the grade-level means, shown to staff for
 * context when explaining a placement.
 */
export interface MapNorm {
  mathAvg: number;
  readAvg: number;
  math25: number;
  math75: number;
  read25: number;
  read75: number;
}

export const MAP_NORMS: Record<GradeLevel, MapNorm> = {
  K:  { mathAvg: 141, readAvg: 141, math25: 133, math75: 153, read25: 133, read75: 152 },
  "1":  { mathAvg: 162, readAvg: 161, math25: 152, math75: 174, read25: 151, read75: 172 },
  "2":  { mathAvg: 178, readAvg: 177, math25: 168, math75: 190, read25: 167, read75: 188 },
  "3":  { mathAvg: 193, readAvg: 192, math25: 183, math75: 204, read25: 182, read75: 203 },
  "4":  { mathAvg: 203, readAvg: 200, math25: 193, math75: 214, read25: 190, read75: 211 },
  "5":  { mathAvg: 212, readAvg: 207, math25: 202, math75: 223, read25: 197, read75: 218 },
  "6":  { mathAvg: 220, readAvg: 213, math25: 210, math75: 231, read25: 203, read75: 224 },
  "7":  { mathAvg: 225, readAvg: 217, math25: 215, math75: 236, read25: 207, read75: 228 },
  "8":  { mathAvg: 229, readAvg: 220, math25: 219, math75: 240, read25: 210, read75: 231 },
  "9":  { mathAvg: 231, readAvg: 222, math25: 221, math75: 242, read25: 212, read75: 233 },
  "10": { mathAvg: 233, readAvg: 224, math25: 223, math75: 244, read25: 214, read75: 235 },
  "11": { mathAvg: 235, readAvg: 225, math25: 225, math75: 246, read25: 215, read75: 236 },
  "12": { mathAvg: 236, readAvg: 226, math25: 225, math75: 246, read25: 215, read75: 236 },
};

/** Grade 3 reading gate — students must read independently at grade level. */
export const GRADE_3_READING_GATE_RIT = 192;

/** FAST is only administered in grades 3–10. */
export const FAST_MIN_GRADE = 3;
export const FAST_MAX_GRADE = 10;

/**
 * Florida FAST achievement levels map onto placement tiers as follows:
 * Level 1 (Inadequate) and 2 (Below Satisfactory) → Intervention;
 * Level 3 (Satisfactory) and 4 (Proficient) → On-Level;
 * Level 5 (Mastery) → Advanced.
 */
export function fastToLevel(level: number): LeveledPlacement {
  if (level <= 2) return "intervention";
  if (level >= 5) return "advanced";
  return "on_level";
}

export const FAST_LEVEL_DESCRIPTIONS: Record<number, string> = {
  1: "Inadequate — well below grade level",
  2: "Below Satisfactory — below grade level",
  3: "Satisfactory — on grade level",
  4: "Proficient — above grade level",
  5: "Mastery — well above grade level",
};

/**
 * Representative percentile for each FAST level, used only to draw the progress
 * bar in the UI. FAST reports achievement bands rather than percentiles, so
 * these are illustrative midpoints — never present them as reported percentiles.
 */
export const FAST_LEVEL_PERCENTILES: Record<number, number> = {
  1: 10,
  2: 20,
  3: 45,
  4: 70,
  5: 90,
};

/** Course a student takes for a given grade and placement level. */
export type LeveledCourses = Record<LeveledPlacement, string>;

export const MATH_COURSES: Record<GradeLevel, LeveledCourses> = {
  K:  { intervention: "Pre-K Counting & Numbers",     on_level: "Kindergarten Math",                  advanced: "Grade 1 Preview" },
  "1":  { intervention: "Kinder Math Review",           on_level: "Grade 1 Math",                       advanced: "Grade 2 Preview" },
  "2":  { intervention: "Grade 1 Arithmetic",           on_level: "Grade 2 Math",                       advanced: "Grade 3 Preview" },
  "3":  { intervention: "Grade 2 Arithmetic",           on_level: "Grade 3 Math (Multiplication Focus)", advanced: "Grade 4 Preview" },
  "4":  { intervention: "Grade 3 Arithmetic Review",    on_level: "Grade 4 Math",                       advanced: "Grade 5 Preview" },
  "5":  { intervention: "Grade 4 Math",                 on_level: "Grade 5 Math",                       advanced: "Grade 6 Preview" },
  "6":  { intervention: "Grade 5 Math Review",          on_level: "Grade 6 Math",                       advanced: "Pre-Algebra" },
  "7":  { intervention: "Grade 6 Math",                 on_level: "Grade 7 Math",                       advanced: "Algebra 1 (HS Credit)" },
  "8":  { intervention: "Grade 7 Math",                 on_level: "Pre-Algebra",                        advanced: "Geometry (HS Credit)" },
  "9":  { intervention: "Algebra 1 (with support)",     on_level: "Algebra 1",                          advanced: "Geometry" },
  "10": { intervention: "Geometry (with support)",      on_level: "Geometry",                           advanced: "Algebra 2" },
  "11": { intervention: "Algebra 2 (with support)",     on_level: "Algebra 2",                          advanced: "Pre-Calculus / AP Statistics" },
  "12": { intervention: "Financial Algebra",            on_level: "Pre-Calculus or Financial Algebra",  advanced: "AP Calculus or AP Statistics" },
};

export const ELA_COURSES: Record<GradeLevel, LeveledCourses> = {
  K:  { intervention: "Phonics Foundations (Pre-K)",          on_level: "Kindergarten ELA", advanced: "Grade 1 ELA Preview" },
  "1":  { intervention: "Kinder ELA Review",                   on_level: "Grade 1 ELA",      advanced: "Grade 2 ELA Preview" },
  "2":  { intervention: "Grade 1 ELA",                         on_level: "Grade 2 ELA",      advanced: "Grade 3 ELA Preview" },
  "3":  { intervention: "Grade 2 ELA (Reading Intervention)",  on_level: "Grade 3 ELA",      advanced: "Grade 4 ELA Preview" },
  "4":  { intervention: "Grade 3 ELA",                         on_level: "Grade 4 ELA",      advanced: "Grade 5 ELA Preview" },
  "5":  { intervention: "Grade 4 ELA",                         on_level: "Grade 5 ELA",      advanced: "Grade 6 ELA Preview" },
  "6":  { intervention: "Grade 5 ELA",                         on_level: "ELA 6",            advanced: "ELA 6 Advanced / ELA 7 Preview" },
  "7":  { intervention: "ELA 6",                               on_level: "ELA 7",            advanced: "ELA 7 Advanced / ELA 8 Preview" },
  "8":  { intervention: "ELA 7",                               on_level: "ELA 8",            advanced: "English I (HS Credit)" },
  "9":  { intervention: "English I (with support)",            on_level: "English I",        advanced: "English I Honors" },
  "10": { intervention: "English II (with support)",           on_level: "English II",       advanced: "English II Honors / AP Lang" },
  "11": { intervention: "English III (with support)",          on_level: "English III",      advanced: "AP Language & Composition" },
  "12": { intervention: "English IV (with support)",           on_level: "English IV",       advanced: "AP Literature / Dual Enrollment" },
};

/** Science and Social Studies are not separately leveled by course name. */
export const SCIENCE_COURSES: Record<GradeLevel, string> = {
  K:  "Life & Earth Science — observation-based",
  "1":  "Life & Earth Science — observation-based",
  "2":  "Life & Earth Science — observation-based",
  "3":  "Integrated Science 3 (life, earth, physical)",
  "4":  "Integrated Science 4",
  "5":  "Integrated Science 5",
  "6":  "Earth & Space Science",
  "7":  "Life Science / Biology",
  "8":  "Physical Science",
  "9":  "Biology I (required)",
  "10": "Chemistry",
  "11": "Physics or Anatomy & Physiology",
  "12": "AP Science elective or Environmental Science",
};

export const SOCIAL_STUDIES_COURSES: Record<GradeLevel, string> = {
  K:  "Community, Family & American Symbols",
  "1":  "Families Past & Present / Local Community",
  "2":  "Local & State Government / Florida Geography",
  "3":  "Florida History (Native peoples → statehood)",
  "4":  "Florida History (Civil War era → present)",
  "5":  "U.S. History to 1865",
  "6":  "Ancient Civilizations",
  "7":  "World History — Medieval & Early Modern",
  "8":  "U.S. History — Civil War to Present",
  "9":  "World History — Modern Era",
  "10": "U.S. History — 20th Century to Present",
  "11": "U.S. Government & Economics",
  "12": "Economics & Personal Finance (or AP Gov)",
};

/** Bible course name per grade — always whole-group, never leveled. */
export function bibleCourseName(grade: GradeLevel): string {
  return `Bible ${grade}`;
}
