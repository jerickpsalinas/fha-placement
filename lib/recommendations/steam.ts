import type { Student, SteamModule, SteamGradeBand } from "@/types";

export interface SteamRecommendation {
  module: SteamModule;
  reason: string;
  /** True when this module's theme lines up with the current calendar month. */
  currentMonth: boolean;
}

/** Maps a student's grade level to the STEAM grade band used by modules. */
export function gradeBandForStudent(student: Student): SteamGradeBand {
  const grade = student.grade_level === "K" ? 0 : parseInt(student.grade_level, 10);
  if (grade <= 2) return "K-2";
  if (grade <= 5) return "3-5";
  if (grade <= 8) return "6-8";
  return "9-12";
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Recommends STEAM modules for a student, matched to their grade band. Modules
 * scheduled for the current calendar month are surfaced first (that's what the
 * student would be working on now), followed by the rest of the band's modules.
 *
 * Transparent and rule-based like the EDGE recommender — this only suggests;
 * it never auto-assigns a module to a student.
 */
export function recommendSteamModules(
  student: Student,
  modules: SteamModule[],
  now: Date = new Date()
): SteamRecommendation[] {
  const band = gradeBandForStudent(student);
  const currentMonthName = MONTHS[now.getMonth()];

  const forBand = modules.filter((m) => m.grade_band === band);

  const recs: SteamRecommendation[] = forBand.map((module) => {
    const isCurrent = module.month.toLowerCase() === currentMonthName.toLowerCase();
    return {
      module,
      currentMonth: isCurrent,
      reason: isCurrent
        ? `${module.theme} — this month's ${band} STEAM focus`
        : `${module.month} ${band} STEAM module: ${module.theme}`,
    };
  });

  // Current-month modules first, then by calendar month order.
  recs.sort((a, b) => {
    if (a.currentMonth !== b.currentMonth) return a.currentMonth ? -1 : 1;
    return MONTHS.indexOf(a.module.month) - MONTHS.indexOf(b.module.month);
  });

  return recs;
}
