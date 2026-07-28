import type { Student, TestScore, GradeLevel } from "@/types";
import {
  MAP_NORMS,
  MATH_COURSES,
  ELA_COURSES,
  SCIENCE_COURSES,
  SOCIAL_STUDIES_COURSES,
  FAST_MIN_GRADE,
  FAST_MAX_GRADE,
  bibleCourseName,
  fastToLevel,
  type PlacementLevel,
  type LeveledPlacement,
} from "./norms";

export interface SubjectPlacement {
  subject: string;
  level: PlacementLevel;
  courseName: string;
  why: string;
  percentile: number | null;
  source: string;
}

export interface PlacementResult {
  placements: SubjectPlacement[];
  testSource: string | null;
  warnings: string[];
}

function gradeNum(grade: GradeLevel): number {
  return grade === "K" ? 0 : parseInt(grade, 10);
}

function latestScoreBySubject(
  scores: TestScore[],
  testType: string,
  subjectPattern: RegExp
): TestScore | null {
  let best: TestScore | null = null;
  for (const s of scores) {
    if (s.test_type !== testType) continue;
    if (!s.subject || !subjectPattern.test(s.subject)) continue;
    if (!best || s.test_date > best.test_date) best = s;
  }
  return best;
}

function mapRitToLevel(
  rit: number,
  p25: number,
  p75: number
): LeveledPlacement {
  if (rit < p25) return "intervention";
  if (rit >= p75) return "advanced";
  return "on_level";
}

export function placeStudent(
  student: Student,
  testScores: TestScore[]
): PlacementResult {
  const grade = student.grade_level;
  const gNum = gradeNum(grade);
  const norms = MAP_NORMS[grade];
  const warnings: string[] = [];
  let testSource: string | null = null;

  // --- Determine Math and Reading levels independently ---

  let mathLevel: LeveledPlacement = "on_level";
  let mathWhy = "No test data — defaulted to on-level";
  let mathSource = "default";
  let mathPercentile: number | null = null;

  let readLevel: LeveledPlacement = "on_level";
  let readWhy = "No test data — defaulted to on-level";
  let readSource = "default";
  let readPercentile: number | null = null;

  const mapMath = latestScoreBySubject(testScores, "MAP", /math/i);
  const mapRead = latestScoreBySubject(testScores, "MAP", /read|ela/i);
  const fastMath = latestScoreBySubject(testScores, "FAST", /math/i);
  const fastRead = latestScoreBySubject(testScores, "FAST", /read|ela/i);

  const fastEligible = gNum >= FAST_MIN_GRADE && gNum <= FAST_MAX_GRADE;

  // Math placement: prefer MAP RIT, fall back to FAST
  if (mapMath?.score != null) {
    mathLevel = mapRitToLevel(mapMath.score, norms.math25, norms.math75);
    mathPercentile = mapMath.percentile;
    mathWhy = `MAP Math RIT ${mapMath.score} vs grade ${grade} norms (25th=${norms.math25}, 75th=${norms.math75})`;
    mathSource = `MAP ${mapMath.test_date} — Math RIT ${mapMath.score}`;
    testSource = `MAP ${mapMath.test_date}`;
  } else if (fastMath?.proficiency_level != null && fastEligible) {
    const lvl = parseInt(fastMath.proficiency_level, 10);
    if (!isNaN(lvl)) {
      mathLevel = fastToLevel(lvl);
      mathWhy = `FAST Math Level ${lvl} (grades 3-10 scale)`;
      mathSource = `FAST ${fastMath.test_date} — Math Level ${lvl}`;
      testSource = testSource ?? `FAST ${fastMath.test_date}`;
    }
  } else if (fastMath && !fastEligible) {
    warnings.push(
      `FAST Math score found but FAST is only valid for grades 3–10 (student is grade ${grade}). Using MAP or default.`
    );
  }

  // Reading placement: prefer MAP RIT, fall back to FAST
  if (mapRead?.score != null) {
    readLevel = mapRitToLevel(mapRead.score, norms.read25, norms.read75);
    readPercentile = mapRead.percentile;
    readWhy = `MAP Reading RIT ${mapRead.score} vs grade ${grade} norms (25th=${norms.read25}, 75th=${norms.read75})`;
    readSource = `MAP ${mapRead.test_date} — Reading RIT ${mapRead.score}`;
    testSource = testSource ?? `MAP ${mapRead.test_date}`;
  } else if (fastRead?.proficiency_level != null && fastEligible) {
    const lvl = parseInt(fastRead.proficiency_level, 10);
    if (!isNaN(lvl)) {
      readLevel = fastToLevel(lvl);
      readWhy = `FAST ELA Level ${lvl} (grades 3-10 scale)`;
      readSource = `FAST ${fastRead.test_date} — ELA Level ${lvl}`;
      testSource = testSource ?? `FAST ${fastRead.test_date}`;
    }
  } else if (fastRead && !fastEligible) {
    warnings.push(
      `FAST ELA score found but FAST is only valid for grades 3–10 (student is grade ${grade}). Using MAP or default.`
    );
  }

  if (mathSource === "default" && readSource === "default") {
    warnings.push(
      "No MAP or FAST scores available — all subjects defaulted to on-level. Upload test scores for accurate placement."
    );
  }

  // --- Derived subjects ---

  // Science: intervention if either Math or Reading is intervention;
  // advanced only if both are advanced; otherwise on-level.
  let scienceLevel: LeveledPlacement = "on_level";
  let scienceWhy: string;
  if (mathLevel === "intervention" || readLevel === "intervention") {
    scienceLevel = "intervention";
    scienceWhy = "Science follows the lower of Math/Reading — at least one is intervention";
  } else if (mathLevel === "advanced" && readLevel === "advanced") {
    scienceLevel = "advanced";
    scienceWhy = "Science follows both Math and Reading — both are advanced";
  } else {
    scienceWhy = "Science on-level (neither trigger for intervention or both-advanced met)";
  }

  // Social Studies: follows Reading
  const ssLevel = readLevel;
  const ssWhy = `Social Studies follows Reading placement (${readLevel})`;

  // --- Build placements array ---

  const placements: SubjectPlacement[] = [
    {
      subject: "Mathematics",
      level: mathLevel,
      courseName: MATH_COURSES[grade][mathLevel],
      why: mathWhy,
      percentile: mathPercentile,
      source: mathSource,
    },
    {
      subject: "English/Language Arts",
      level: readLevel,
      courseName: ELA_COURSES[grade][readLevel],
      why: readWhy,
      percentile: readPercentile,
      source: readSource,
    },
    {
      subject: "Writing",
      level: readLevel,
      courseName: `Writing — ${ELA_COURSES[grade][readLevel]}`,
      why: `Writing follows Reading placement (${readLevel})`,
      percentile: readPercentile,
      source: readSource,
    },
    {
      subject: "Science",
      level: scienceLevel,
      courseName: SCIENCE_COURSES[grade],
      why: scienceWhy,
      percentile: null,
      source: `Derived from Math (${mathLevel}) + Reading (${readLevel})`,
    },
    {
      subject: "Social Studies",
      level: ssLevel,
      courseName: SOCIAL_STUDIES_COURSES[grade],
      why: ssWhy,
      percentile: readPercentile,
      source: readSource,
    },
    {
      subject: "God First / Bible",
      level: "whole_group",
      courseName: bibleCourseName(grade),
      why: "Always whole-group — never leveled",
      percentile: null,
      source: "policy",
    },
    {
      subject: "STEAM",
      level: "whole_group",
      courseName: "STEAM",
      why: "Always whole-group — never leveled",
      percentile: null,
      source: "policy",
    },
    {
      subject: "Technology",
      level: "whole_group",
      courseName: "Technology",
      why: "Always whole-group — never leveled",
      percentile: null,
      source: "policy",
    },
  ];

  return { placements, testSource, warnings };
}
