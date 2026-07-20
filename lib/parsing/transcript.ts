/**
 * Heuristic transcript / report-card text parser.
 *
 * This operates on the plain text extracted from an uploaded PDF and attempts
 * to detect individual course rows (course name, credit value, letter grade,
 * subject area, school year). It is intentionally a transparent, rule-based
 * pass — NOT a black box. Transcript layouts vary enormously between sending
 * schools, so every parsed row is returned with a `needsReview` flag and staff
 * are expected to confirm/correct the results before anything is saved.
 *
 * The parser never guesses silently: when it cannot confidently determine a
 * field it leaves it blank/low-confidence and flags the row for review.
 */

/** Subject-area buckets — must match the graduation_requirements categories. */
export const SUBJECT_AREAS = [
  "English/Language Arts",
  "Mathematics",
  "Science",
  "Social Studies",
  "Physical Education",
  "Fine/Performing Arts, Speech, or Practical Arts",
  "World Language",
  "Electives",
] as const;

export type SubjectArea = (typeof SUBJECT_AREAS)[number] | "";

export interface ParsedTranscriptRow {
  course_name: string;
  subject_area: SubjectArea;
  credit_value: number;
  grade: string;
  school_year: string;
  is_online: boolean;
  is_dual_enrollment: boolean;
  /** True when the parser is not confident and staff should double-check. */
  needsReview: boolean;
}

/** Keyword → subject-area mapping. First match wins; order matters. */
const SUBJECT_KEYWORDS: { area: SubjectArea; keywords: RegExp }[] = [
  { area: "English/Language Arts", keywords: /\b(english|language arts|ela|literature|composition|reading|writing|journalism)\b/i },
  { area: "Mathematics", keywords: /\b(math|algebra|geometry|calculus|trigonometry|statistics|pre-?calc)\b/i },
  { area: "Science", keywords: /\b(science|biology|chemistry|physics|anatomy|environmental|earth\s?space|marine)\b/i },
  { area: "Social Studies", keywords: /\b(history|government|economics|civics|geography|psychology|sociology|social studies)\b/i },
  { area: "World Language", keywords: /\b(spanish|french|latin|german|mandarin|chinese|american sign|world language)\b/i },
  { area: "Physical Education", keywords: /\b(physical education|\bp\.?e\.?\b|health|weight training|fitness)\b/i },
  { area: "Fine/Performing Arts, Speech, or Practical Arts", keywords: /\b(art|band|chorus|choir|music|drama|theatre|theater|speech|debate|ceramics|dance)\b/i },
];

const ONLINE_HINT = /\b(flvs|online|virtual|e-?learning|distance)\b/i;
const DUAL_ENROLL_HINT = /(dual[\s-]?enroll|dual[\s-]?credit|college credit|\bde\b)/i;

/**
 * Guesses a subject area from a course name. Returns "" (blank) when nothing
 * matches, so the row is flagged for manual categorization rather than being
 * silently miscategorized.
 */
export function guessSubjectArea(courseName: string): SubjectArea {
  for (const { area, keywords } of SUBJECT_KEYWORDS) {
    if (keywords.test(courseName)) return area;
  }
  return "";
}

/** Extracts a school-year token like "2024-2025" or "2024-25" if present. */
function extractSchoolYear(text: string): string {
  const full = text.match(/\b(20\d{2})\s*[-/–]\s*(20\d{2})\b/);
  if (full) return `${full[1]}-${full[2]}`;
  const short = text.match(/\b(20\d{2})\s*[-/–]\s*(\d{2})\b/);
  if (short) return `${short[1]}-20${short[2]}`;
  return "";
}

/**
 * A grade token. Deliberately narrow to avoid false positives:
 *  - letter grades A–D or F with optional +/- (E is excluded; single letters
 *    like the "I" in "Algebra I" won't match since I/P/W are not included);
 *  - numeric grades 40–100 only, so course levels ("1") and credit values
 *    ("0.5", "1.0") are never mistaken for a grade.
 * Global so we can take the last (rightmost) match, where grades usually sit.
 */
const GRADE_TOKEN = /\b([A-DF][+-]?|100|[4-9]\d)(?![A-Za-z0-9])/g;
/** A credit value: 0.25, 0.5, 1, 1.0 — typically <= 2 for a single course. */
const CREDIT_TOKEN = /\b([0-2](?:\.\d{1,2})?)\b/g;

/**
 * Parses raw transcript text into candidate course rows.
 *
 * Strategy: work line by line. A line is treated as a possible course row when
 * it contains enough alphabetic text to be a course title AND at least one of
 * a credit value or a recognizable grade. Header/footer/summary lines (GPA,
 * totals, addresses, dates) are skipped by simple heuristics.
 */
export function parseTranscriptText(rawText: string): ParsedTranscriptRow[] {
  const documentYear = extractSchoolYear(rawText);
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const rows: ParsedTranscriptRow[] = [];

  for (const line of lines) {
    if (shouldSkipLine(line)) continue;

    // A course title needs a run of letters (course codes alone aren't enough).
    const letters = (line.match(/[A-Za-z]/g) ?? []).length;
    if (letters < 4) continue;

    const lineYear = extractSchoolYear(line) || documentYear;

    // Credit value: prefer a decimal like 0.5 / 1.0; fall back to a bare 1.
    let creditValue = 0;
    let creditMatched = false;
    const creditMatches = [...line.matchAll(CREDIT_TOKEN)];
    const decimalCredit = creditMatches.find((m) => m[1].includes("."));
    if (decimalCredit) {
      creditValue = Number(decimalCredit[1]);
      creditMatched = true;
    }

    // Grade: take the rightmost grade-looking token (grades sit at line end).
    const gradeMatches = [...line.matchAll(GRADE_TOKEN)];
    const grade = gradeMatches.length ? gradeMatches[gradeMatches.length - 1][1] : "";

    // Require at least one strong signal (credit or grade) to treat as a course.
    if (!creditMatched && !grade) continue;

    // Course name = the line with year/credit/grade noise stripped from the end.
    const courseName = cleanCourseName(line);
    if (!courseName) continue;

    const subjectArea = guessSubjectArea(courseName);
    const isOnline = ONLINE_HINT.test(line);
    const isDual = DUAL_ENROLL_HINT.test(line);

    const needsReview =
      !creditMatched || !grade || subjectArea === "" || lineYear === "";

    rows.push({
      course_name: courseName,
      subject_area: subjectArea,
      credit_value: creditMatched ? creditValue : 1.0,
      grade,
      school_year: lineYear,
      is_online: isOnline,
      is_dual_enrollment: isDual,
      needsReview,
    });
  }

  return rows;
}

/** Lines that are clearly not course rows (summaries, headers, contact info). */
function shouldSkipLine(line: string): boolean {
  return /\b(gpa|grade point|total credits|cumulative|transcript|report card|student(?: id| name)?:|date of birth|dob|address|phone|principal|counselor|page \d|semester total|year total|weighted|unweighted|honor roll)\b/i.test(
    line
  );
}

/**
 * Strips trailing school-year, credit, and grade tokens from a raw line to
 * recover the human course title. Conservative: keeps the leading text intact.
 */
function cleanCourseName(line: string): string {
  let name = line;
  name = name.replace(/\b20\d{2}\s*[-/–]\s*(20)?\d{2}\b/g, " "); // year
  name = name.replace(/\b[0-2]\.\d{1,2}\b/g, " "); // decimal credits
  name = name.replace(/\b([A-DF][+-]?|\d{1,3}%)\s*$/g, " "); // trailing grade
  name = name.replace(/\b[A-Z]{2,4}\d{3,4}[A-Z]?\b/g, " "); // course codes like ENG101
  name = name.replace(/[|•·]+/g, " ");
  name = name.replace(/\s{2,}/g, " ").trim();
  // Drop leftover leading/trailing punctuation.
  name = name.replace(/^[^A-Za-z]+/, "").replace(/[\s\-–,]+$/, "").trim();
  return name;
}
