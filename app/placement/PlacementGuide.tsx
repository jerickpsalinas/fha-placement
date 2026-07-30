"use client";

import { useState } from "react";
import {
  MAP_NORMS,
  MATH_COURSES,
  ELA_COURSES,
  SCIENCE_COURSES,
  SOCIAL_STUDIES_COURSES,
  PLACEMENT_LEVEL_LABELS,
  FAST_LEVEL_DESCRIPTIONS,
  FAST_MIN_GRADE,
  FAST_MAX_GRADE,
  fastToLevel,
  bibleCourseName,
  type PlacementLevel,
  type LeveledPlacement,
} from "@/lib/placement/norms";
import type { GradeLevel } from "@/types";
import { STEAM_DATA } from "./steam-data";

const GRADES: GradeLevel[] = ["K","1","2","3","4","5","6","7","8","9","10","11","12"];

interface SubjectCard {
  subject: string;
  level: PlacementLevel;
  course: string;
  why: string;
  score: string | null;
  pct: number | null;
}

function levelClass(level: PlacementLevel) {
  switch (level) {
    case "intervention": return "border-l-[#9B4E00] bg-[#FEF3E3]";
    case "on_level": return "border-l-[#0F4C8A] bg-[#E8F0FB]";
    case "advanced": return "border-l-[#2E6B7A] bg-[#EAF3F6]";
    case "whole_group": return "border-l-[#C9A84C] bg-[#FBF5E6]";
  }
}

function levelTextColor(level: PlacementLevel) {
  switch (level) {
    case "intervention": return "text-[#9B4E00]";
    case "on_level": return "text-[#0F4C8A]";
    case "advanced": return "text-[#2E6B7A]";
    case "whole_group": return "text-[#7A5800]";
  }
}

function barColor(pct: number) {
  if (pct < 25) return "bg-[#E24B4A]";
  if (pct < 75) return "bg-[#EF9F27]";
  return "bg-[#639922]";
}

function mapRitToLevel(rit: number, p25: number, p75: number): LeveledPlacement {
  if (rit < p25) return "intervention";
  if (rit >= p75) return "advanced";
  return "on_level";
}

function ritToPct(rit: number, p25: number, p75: number, avg: number): number {
  if (rit <= p25) return Math.max(5, Math.round((rit / p25) * 25));
  if (rit >= p75) return Math.min(95, 75 + Math.round(((rit - p75) / (p75 - avg)) * 20));
  return Math.round(25 + ((rit - p25) / (p75 - p25)) * 50);
}

export function PlacementGuide() {
  const [activeSection, setActiveSection] = useState("placement");
  const [steamBand, setSteamBand] = useState<"K-2"|"3-5"|"6-8"|"9-12">("K-2");

  // Form state
  const [studentName, setStudentName] = useState("");
  const [grade, setGrade] = useState<GradeLevel>("K");
  const [testType, setTestType] = useState<"MAP"|"FAST">("MAP");
  const [mathRit, setMathRit] = useState("");
  const [readRit, setReadRit] = useState("");
  const [testWindow, setTestWindow] = useState("fall");
  const [fastMath, setFastMath] = useState("3");
  const [fastEla, setFastEla] = useState("3");
  const [fastWindow, setFastWindow] = useState("pm1");

  // Result state
  const [result, setResult] = useState<{
    name: string;
    grade: GradeLevel;
    testLabel: string;
    cards: SubjectCard[];
  } | null>(null);

  function buildPlacement() {
    const norms = MAP_NORMS[grade];
    const gNum = grade === "K" ? 0 : parseInt(grade, 10);
    const cards: SubjectCard[] = [];
    let testLabel = "";

    let mathLevel: LeveledPlacement = "on_level";
    let readLevel: LeveledPlacement = "on_level";
    let mathWhy = "", readWhy = "";
    let mathScore: string | null = null, readScore: string | null = null;
    let mathPct: number | null = null, readPct: number | null = null;

    if (testType === "MAP") {
      const mRit = parseInt(mathRit, 10);
      const rRit = parseInt(readRit, 10);
      if (isNaN(mRit) || isNaN(rRit)) { alert("Enter both Math and Reading RIT scores."); return; }
      mathLevel = mapRitToLevel(mRit, norms.math25, norms.math75);
      readLevel = mapRitToLevel(rRit, norms.read25, norms.read75);
      mathWhy = `RIT ${mRit} vs. grade avg ${norms.mathAvg} (25th: ${norms.math25}, 75th: ${norms.math75})`;
      readWhy = `RIT ${rRit} vs. grade avg ${norms.readAvg} (25th: ${norms.read25}, 75th: ${norms.read75})`;
      mathScore = `MAP Math RIT: ${mRit}`;
      readScore = `MAP Reading RIT: ${rRit}`;
      mathPct = ritToPct(mRit, norms.math25, norms.math75, norms.mathAvg);
      readPct = ritToPct(rRit, norms.read25, norms.read75, norms.readAvg);
      testLabel = `MAP Growth · ${testWindow.charAt(0).toUpperCase() + testWindow.slice(1)}`;
    } else {
      if (gNum < FAST_MIN_GRADE || gNum > FAST_MAX_GRADE) {
        alert(`FAST is only valid for grades ${FAST_MIN_GRADE}–${FAST_MAX_GRADE}.`);
        return;
      }
      const mLvl = parseInt(fastMath, 10);
      const rLvl = parseInt(fastEla, 10);
      mathLevel = fastToLevel(mLvl);
      readLevel = fastToLevel(rLvl);
      mathWhy = `FAST Math Achievement Level ${mLvl} — ${FAST_LEVEL_DESCRIPTIONS[mLvl]}`;
      readWhy = `FAST ELA Achievement Level ${rLvl} — ${FAST_LEVEL_DESCRIPTIONS[rLvl]}`;
      mathScore = `FAST Math Level: ${mLvl}`;
      readScore = `FAST ELA Level: ${rLvl}`;
      mathPct = mLvl * 20;
      readPct = rLvl * 20;
      testLabel = `FAST · ${fastWindow.toUpperCase()}`;
    }

    // Science: lower of Math/Reading
    let sciLevel: LeveledPlacement = "on_level";
    if (mathLevel === "intervention" || readLevel === "intervention") sciLevel = "intervention";
    else if (mathLevel === "advanced" && readLevel === "advanced") sciLevel = "advanced";

    // Social Studies follows Reading
    const ssLevel = readLevel;

    cards.push({
      subject: "God First / Bible", level: "whole_group",
      course: bibleCourseName(grade), why: "Daily devotional — all students together",
      score: null, pct: null,
    });
    cards.push({
      subject: "Mathematics", level: mathLevel,
      course: MATH_COURSES[grade][mathLevel], why: mathWhy,
      score: mathScore, pct: mathPct,
    });
    cards.push({
      subject: "ELA / Reading", level: readLevel,
      course: ELA_COURSES[grade][readLevel], why: readWhy,
      score: readScore, pct: readPct,
    });
    cards.push({
      subject: "Writing", level: readLevel,
      course: `Writing — ${ELA_COURSES[grade][readLevel]}`,
      why: `Follows Reading placement (${PLACEMENT_LEVEL_LABELS[readLevel]})`,
      score: readScore, pct: readPct,
    });
    cards.push({
      subject: "Science", level: sciLevel,
      course: SCIENCE_COURSES[grade],
      why: sciLevel === "intervention"
        ? "Follows lower of Math/Reading — at least one is Intervention"
        : sciLevel === "advanced"
        ? "Both Math and Reading are Advanced"
        : "On-Level (no dual intervention/advanced trigger)",
      score: null, pct: null,
    });
    cards.push({
      subject: "Social Studies", level: ssLevel,
      course: SOCIAL_STUDIES_COURSES[grade],
      why: `Follows Reading placement (${PLACEMENT_LEVEL_LABELS[readLevel]})`,
      score: null, pct: null,
    });
    cards.push({
      subject: "STEAM", level: "whole_group",
      course: "STEAM (Thames & Kosmos)", why: "Whole-group, differentiated by assignment level",
      score: null, pct: null,
    });
    cards.push({
      subject: "Technology / Robotics", level: "whole_group",
      course: "Technology", why: "Whole-group — all students together",
      score: null, pct: null,
    });

    setResult({
      name: studentName || "Student",
      grade,
      testLabel,
      cards,
    });
  }

  const navItems = [
    { id: "placement", num: "01", label: "Student Placement Engine" },
    { id: "credits", num: "02", label: "Credit Requirements" },
    { id: "sequences", num: "03", label: "Course Sequences" },
    { id: "steam", num: "04", label: "STEAM Plans" },
  ];

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      {/* Hero banner + section tabs (sticky together) */}
      <div className="sticky top-0 z-10 bg-[#0D1B2E]">
        <div className="px-8 py-10 text-white">
          <p className="text-[10px] uppercase tracking-[.15em] text-[#C9A84C] font-bold mb-2">Father&apos;s Harbor Academy</p>
          <h1 className="text-2xl font-bold font-serif">
            Student Placement &amp; STEAM Planner
          </h1>
          <p className="text-[11px] text-white/60 mt-2 max-w-xl">
            Individualized academic plans driven by MAP Growth RIT scores or FAST achievement levels.
            Every subject placed independently — a low score in one area never holds a student back in another.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {["God First Daily", "Chapel Wednesdays", "8:00 AM – 2:30 PM", "Individualized by Subject"].map((pill) => (
              <span key={pill} className="text-[9px] bg-white/10 text-white/80 px-3 py-1 rounded-full">{pill}</span>
            ))}
          </div>
        </div>

        {/* Section tabs */}
        <div className="px-8 py-2 flex gap-1.5 print:hidden overflow-x-auto border-t border-white/10">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`shrink-0 text-left px-3 py-2 rounded text-[11px] flex items-center gap-2 transition ${
                activeSection === item.id ? "bg-white/10 text-[#C9A84C]" : "text-white/70 hover:bg-white/5"
              }`}
            >
              <span className="text-[9px] font-bold text-[#C9A84C]">{item.num}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="p-8 space-y-10 max-w-5xl">
          {/* SECTION 01: Placement Engine */}
          <section id="placement" className="scroll-mt-[220px]">
            <SectionHead num="01" title="Student Placement Engine" sub="Enter a student's scores → get their full class schedule instantly" />
            <div className="bg-white border border-[#DDD8CC] rounded-lg p-6">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="flex flex-col">
                  <label className="text-[10px] font-semibold text-[#0D1B2E] mb-1">Student Name</label>
                  <input value={studentName} onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Maria Santos" className="border border-[#DDD8CC] rounded px-3 py-2 text-sm" />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-semibold text-[#0D1B2E] mb-1">Grade Level</label>
                  <select value={grade} onChange={(e) => setGrade(e.target.value as GradeLevel)}
                    className="border border-[#DDD8CC] rounded px-3 py-2 text-sm">
                    {GRADES.map((g) => <option key={g} value={g}>{g === "K" ? "Kindergarten" : `Grade ${g}`}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-semibold text-[#0D1B2E] mb-1">Test Type</label>
                  <select value={testType} onChange={(e) => setTestType(e.target.value as "MAP"|"FAST")}
                    className="border border-[#DDD8CC] rounded px-3 py-2 text-sm">
                    <option value="MAP">MAP Growth</option>
                    <option value="FAST">Florida FAST</option>
                  </select>
                </div>
              </div>

              {testType === "MAP" ? (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-semibold text-[#0D1B2E] mb-1">Math RIT Score</label>
                    <input type="number" min={100} max={350} value={mathRit} onChange={(e) => setMathRit(e.target.value)}
                      placeholder="e.g. 210" className="border border-[#DDD8CC] rounded px-3 py-2 text-sm" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-semibold text-[#0D1B2E] mb-1">Reading RIT Score</label>
                    <input type="number" min={100} max={350} value={readRit} onChange={(e) => setReadRit(e.target.value)}
                      placeholder="e.g. 205" className="border border-[#DDD8CC] rounded px-3 py-2 text-sm" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-semibold text-[#0D1B2E] mb-1">Test Window</label>
                    <select value={testWindow} onChange={(e) => setTestWindow(e.target.value)}
                      className="border border-[#DDD8CC] rounded px-3 py-2 text-sm">
                      <option value="fall">Fall</option>
                      <option value="winter">Winter</option>
                      <option value="spring">Spring</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {[1,2,3,4,5].map((lvl) => (
                      <div key={lvl} className="border rounded p-2 text-center" style={{
                        borderLeftWidth: 3,
                        borderLeftColor: lvl <= 2 ? "#9B4E00" : lvl <= 4 ? "#0F4C8A" : "#2E6B7A",
                        background: lvl <= 2 ? "#FEF3E3" : lvl <= 4 ? "#E8F0FB" : "#EAF3F6",
                      }}>
                        <div className="text-lg font-bold font-serif">{lvl}</div>
                        <div className="text-[9px] text-[#666]">{FAST_LEVEL_DESCRIPTIONS[lvl]?.split("—")[0]?.trim()}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-semibold text-[#0D1B2E] mb-1">Math Level</label>
                      <select value={fastMath} onChange={(e) => setFastMath(e.target.value)}
                        className="border border-[#DDD8CC] rounded px-3 py-2 text-sm">
                        {[1,2,3,4,5].map((l) => <option key={l} value={l}>Level {l}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] font-semibold text-[#0D1B2E] mb-1">ELA Level</label>
                      <select value={fastEla} onChange={(e) => setFastEla(e.target.value)}
                        className="border border-[#DDD8CC] rounded px-3 py-2 text-sm">
                        {[1,2,3,4,5].map((l) => <option key={l} value={l}>Level {l}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] font-semibold text-[#0D1B2E] mb-1">FAST Window</label>
                      <select value={fastWindow} onChange={(e) => setFastWindow(e.target.value)}
                        className="border border-[#DDD8CC] rounded px-3 py-2 text-sm">
                        <option value="pm1">PM1</option>
                        <option value="pm2">PM2</option>
                        <option value="pm3">PM3</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <button onClick={buildPlacement}
                className="bg-[#0D1B2E] text-[#C9A84C] text-xs font-bold px-5 py-2.5 rounded hover:opacity-90">
                Build Student Plan →
              </button>
            </div>

            {/* Result output */}
            {result && (
              <div className="mt-6 border border-[#DDD8CC] rounded-lg overflow-hidden">
                {/* Banner */}
                <div className="bg-[#0D1B2E] px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-base font-bold text-white font-serif">{result.name}</div>
                    <div className="text-[11px] text-white/60">
                      {result.testLabel} · <span className="text-[#639922]">{testType}</span>
                    </div>
                  </div>
                  <span className="bg-[#C9A84C] text-[#0D1B2E] text-[10px] font-bold px-2.5 py-1 rounded">
                    Grade {result.grade}
                  </span>
                </div>

                <div className="bg-white p-5 space-y-6">
                  {/* Subject cards */}
                  <div className="grid grid-cols-3 gap-2">
                    {result.cards.map((card) => (
                      <div key={card.subject}
                        className={`border-l-[3px] rounded-lg p-3 ${levelClass(card.level)}`}>
                        <div className={`text-[9px] font-bold uppercase tracking-wide ${levelTextColor(card.level)}`}>
                          {PLACEMENT_LEVEL_LABELS[card.level]}
                        </div>
                        <div className="text-[11px] font-semibold text-[#0D1B2E] mt-1">{card.subject}</div>
                        <div className="text-[11px] text-[#444] mt-0.5">{card.course}</div>
                        {card.score && (
                          <div className="text-[9px] text-[#666] mt-1">{card.score}</div>
                        )}
                        {card.pct !== null && (
                          <div className="h-[5px] bg-[#e0dbd0] rounded-full mt-1.5 overflow-hidden">
                            <div className={`h-full rounded-full ${barColor(card.pct)}`} style={{ width: `${card.pct}%` }} />
                          </div>
                        )}
                        <div className="text-[9px] text-[#666] mt-1.5 leading-relaxed">{card.why}</div>
                      </div>
                    ))}
                  </div>

                  {/* Weekly Schedule */}
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wide text-[#0D1B2E] mb-2">Weekly Schedule</h3>
                    <WeeklySchedule grade={result.grade} cards={result.cards} />
                  </div>

                  {/* Next Steps */}
                  <div className="bg-[#0D1B2E] rounded-lg p-4">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[#C9A84C] mb-2">Next Steps</div>
                    <div className="space-y-2 text-[11px] text-white/70">
                      {result.cards.some((c) => c.level === "intervention") && (
                        <p><strong className="text-[#C9A84C]">Intervention:</strong> Schedule parent conference to discuss supported placement and progress monitoring plan.</p>
                      )}
                      {result.cards.some((c) => c.level === "advanced") && (
                        <p><strong className="text-[#C9A84C]">Advanced:</strong> Confirm advanced placement with parent. Monitor for appropriate challenge level.</p>
                      )}
                      <p><strong className="text-[#C9A84C]">GradeLink:</strong> Enter placement levels and course assignments into GradeLink for official records.</p>
                      <p><strong className="text-[#C9A84C]">STEAM:</strong> Assign monthly Thames &amp; Kosmos kits based on grade band (see Section 04).</p>
                    </div>
                  </div>

                  {/* Promotion Gate */}
                  <PromotionGate grade={result.grade} cards={result.cards} />
                </div>
              </div>
            )}
          </section>

          {/* SECTION 02: Credit Requirements */}
          <section id="credits" className="scroll-mt-[220px]">
            <SectionHead num="02" title="Credit Requirements & Promotion Gates" sub="Florida private school standards + FHA-specific requirements" />
            <CreditRequirements />
          </section>

          {/* SECTION 03: Course Sequences */}
          <section id="sequences" className="scroll-mt-[220px]">
            <SectionHead num="03" title="Course Sequences K–12" sub="Exact course names by grade and placement level" />
            <CourseSequences />
          </section>

          {/* SECTION 04: STEAM Plans */}
          <section id="steam" className="scroll-mt-[220px]">
            <SectionHead num="04" title="STEAM Monthly Plans" sub="Thames & Kosmos kits, chapel themes, and garden connections" />
            <div className="flex gap-1.5 mb-4">
              {(["K-2","3-5","6-8","9-12"] as const).map((band) => (
                <button key={band} onClick={() => setSteamBand(band)}
                  className={`text-[11px] font-semibold px-4 py-2 rounded ${
                    steamBand === band ? "bg-[#0D1B2E] text-[#C9A84C]" : "bg-white border border-[#DDD8CC] text-[#666] hover:bg-gray-50"
                  }`}>
                  {band}
                </button>
              ))}
            </div>
            <SteamGrid band={steamBand} />
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ num, title, sub }: { num: string; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="text-[20px] font-bold text-[#C9A84C] font-serif">{num}</div>
      <div>
        <div className="text-base font-bold text-[#0D1B2E]">{title}</div>
        <div className="text-[11px] text-[#666]">{sub}</div>
      </div>
    </div>
  );
}

const BLOCK_TAGS: Record<string, { bg: string; color: string }> = {
  "God First": { bg: "#FBF5E6", color: "#7A5800" },
  "Chapel": { bg: "#FEF3E8", color: "#E07B20" },
  "Math": { bg: "#E8F0FB", color: "#0F4C8A" },
  "ELA": { bg: "#EAF3F6", color: "#2E6B7A" },
  "Science": { bg: "#EAF3F6", color: "#1A4A48" },
  "Social Studies": { bg: "#EEF0F8", color: "#334" },
  "STEAM": { bg: "#E8F5E9", color: "#1A6E40" },
  "Technology": { bg: "#F3E5F5", color: "#5B1E7A" },
  "Writing": { bg: "#EAF3F6", color: "#2E6B7A" },
};

function BlockTag({ label }: { label: string }) {
  const style = BLOCK_TAGS[label] ?? { bg: "#f0f0f0", color: "#444" };
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded inline-block mr-1" style={{ background: style.bg, color: style.color }}>
      {label}
    </span>
  );
}

function WeeklySchedule({ grade, cards }: { grade: GradeLevel; cards: SubjectCard[] }) {
  const mathCard = cards.find((c) => c.subject === "Mathematics");
  const elaCard = cards.find((c) => c.subject === "ELA / Reading");
  const sciCard = cards.find((c) => c.subject === "Science");
  const ssCard = cards.find((c) => c.subject === "Social Studies");
  const writingCard = cards.find((c) => c.subject === "Writing");
  const steamCard = cards.find((c) => c.subject === "STEAM");
  const techCard = cards.find((c) => c.subject === "Technology / Robotics");

  const days = [
    { day: "Monday", sub: "A Day — Core", blocks: [
      { tag: "God First", time: "8:00–8:30", desc: `${bibleCourseName(grade)} · Devotion · Prayer` },
      { tag: "ELA", time: "8:35–10:05", desc: elaCard?.course ?? "ELA" },
      { tag: "Math", time: "10:10–11:40", desc: mathCard?.course ?? "Math" },
      { tag: "Science", time: "12:10–1:20", desc: sciCard?.course ?? "Science" },
      { tag: "Social Studies", time: "1:25–2:30", desc: ssCard?.course ?? "Social Studies" },
    ]},
    { day: "Tuesday", sub: "B Day — Application", blocks: [
      { tag: "God First", time: "8:00–8:30", desc: `${bibleCourseName(grade)} · Devotion · Prayer` },
      { tag: "Writing", time: "8:35–10:05", desc: writingCard?.course ?? "Writing" },
      { tag: "Math", time: "10:10–11:40", desc: `${mathCard?.course ?? "Math"} — Application` },
      { tag: "STEAM", time: "12:10–1:20", desc: steamCard?.course ?? "STEAM" },
      { tag: "Technology", time: "1:25–2:30", desc: techCard?.course ?? "Technology" },
    ]},
    { day: "Wednesday", sub: "Chapel Day", blocks: [
      { tag: "Chapel", time: "8:00–9:00", desc: "Chapel Service · Worship · Guest Speaker" },
      { tag: "ELA", time: "9:05–10:05", desc: elaCard?.course ?? "ELA" },
      { tag: "Math", time: "10:10–11:00", desc: mathCard?.course ?? "Math" },
      { tag: "Science", time: "12:10–1:20", desc: sciCard?.course ?? "Science" },
      { tag: "Social Studies", time: "1:25–2:30", desc: ssCard?.course ?? "Social Studies" },
    ]},
    { day: "Thursday", sub: "A Day — Core", blocks: [
      { tag: "God First", time: "8:00–8:30", desc: `${bibleCourseName(grade)} · Devotion · Prayer` },
      { tag: "ELA", time: "8:35–10:05", desc: elaCard?.course ?? "ELA" },
      { tag: "Math", time: "10:10–11:40", desc: mathCard?.course ?? "Math" },
      { tag: "Science", time: "12:10–1:20", desc: sciCard?.course ?? "Science" },
      { tag: "Social Studies", time: "1:25–2:30", desc: ssCard?.course ?? "Social Studies" },
    ]},
    { day: "Friday", sub: "B Day — Projects", blocks: [
      { tag: "God First", time: "8:00–8:30", desc: `${bibleCourseName(grade)} · Devotion · Prayer` },
      { tag: "Writing", time: "8:35–10:05", desc: writingCard?.course ?? "Writing" },
      { tag: "Math", time: "10:10–11:40", desc: `${mathCard?.course ?? "Math"} — Projects` },
      { tag: "STEAM", time: "12:10–1:20", desc: `${steamCard?.course ?? "STEAM"} — Project Time` },
      { tag: "Technology", time: "1:25–2:30", desc: `${techCard?.course ?? "Technology"} — Project Time` },
    ]},
  ];

  return (
    <div className="space-y-1.5">
      {days.map((d) => (
        <div key={d.day} className="bg-[#F7F6F2] border border-[#DDD8CC] rounded-lg grid grid-cols-[90px_1fr] gap-2.5 text-[11px]">
          <div className="p-2.5">
            <div className="font-bold text-[#0D1B2E]">{d.day}</div>
            <div className="text-[9px] text-[#666]">{d.sub}</div>
          </div>
          <div className="p-2.5 space-y-1">
            {d.blocks.map((b, i) => (
              <div key={i} className="py-0.5">
                <BlockTag label={b.tag} />
                <strong>{b.time}</strong> — {b.desc}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PromotionGate({ grade, cards }: { grade: GradeLevel; cards: SubjectCard[] }) {
  const gNum = grade === "K" ? 0 : parseInt(grade, 10);
  const gates: string[] = [];

  if (gNum <= 5) {
    gates.push("Mastery of grade-level Math and ELA standards");
    if (gNum === 3) gates.push("Grade 3 Reading Gate: must read independently at grade level (RIT ≥ 192)");
    gates.push("Complete 8 of 10 monthly STEAM modules");
    gates.push("90% minimum attendance");
    gates.push("Teacher recommendation for promotion");
  } else if (gNum <= 8) {
    gates.push("Earn required Carnegie credits for each subject");
    if (gNum === 8) gates.push("Grade 8 Life Skills Portfolio — completed and presented");
    gates.push("Maintain minimum 2.0 GPA");
    gates.push("Complete 8 of 10 monthly STEAM modules");
  } else {
    gates.push("24 total credits required for graduation");
    gates.push("Complete all required courses per subject area");
    gates.push("Florida online learning requirement (0.5+ credit)");
    gates.push("Maintain minimum 2.0 cumulative GPA");
    gates.push("Community service hours (if applicable)");
  }

  return (
    <div className="bg-[#FBF5E6] border border-[#C9A84C] rounded-lg p-4">
      <div className="text-[10px] font-bold uppercase tracking-wide text-[#7A5800] mb-2">
        Promotion / Graduation Requirements — Grade {grade}
      </div>
      <div className="space-y-1.5">
        {gates.map((g, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-3.5 h-3.5 bg-[#0D1B2E] rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#C9A84C] text-[8px]">✓</span>
            </div>
            <span className="text-[11px] text-[#5A4000]">{g}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreditRequirements() {
  return (
    <div className="space-y-6">
      {/* Elementary */}
      <div className="rounded-lg overflow-hidden border border-[#DDD8CC]">
        <div className="bg-[#0D1B2E] px-5 py-3">
          <span className="text-[13px] font-bold text-[#C9A84C] font-serif">Elementary — Grades K–5</span>
          <span className="text-[10px] text-white/50 ml-3">Mastery-based promotion, no Carnegie credits</span>
        </div>
        <div className="bg-white p-4 overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="border-b-2 border-[#0D1B2E]">
                <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#F7F6F2] px-2.5 py-2">Subject</th>
                <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#F7F6F2] px-2.5 py-2">Requirement</th>
                <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#F7F6F2] px-2.5 py-2">Promotion Standard</th>
              </tr>
            </thead>
            <tbody className="text-[#444]">
              {[
                ["God First / Bible", "fha", "Daily — all grades"],
                ["Mathematics", "req", "Mastery of grade-level standards"],
                ["ELA / Reading", "req", "Mastery + Grade 3 Reading Gate (RIT ≥ 192)"],
                ["Science", "req", "Observation-based (K-2), Integrated (3-5)"],
                ["Social Studies", "req", "Grade-level standards"],
                ["STEAM", "fha", "8 of 10 monthly T&K modules"],
                ["PE / Health", "req", "Participation-based"],
              ].map(([subj, type, standard]) => (
                <tr key={subj} className="border-b border-[#DDD8CC]">
                  <td className="px-2.5 py-2 font-medium">{subj}</td>
                  <td className="px-2.5 py-2"><ReqBadge type={type} /></td>
                  <td className="px-2.5 py-2">{standard}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Middle School */}
      <div className="rounded-lg overflow-hidden border border-[#DDD8CC]">
        <div className="bg-[#0D1B2E] px-5 py-3">
          <span className="text-[13px] font-bold text-[#C9A84C] font-serif">Middle School — Grades 6–8</span>
          <span className="text-[10px] text-white/50 ml-3">Carnegie credits begin — 1.0 per subject per year</span>
        </div>
        <div className="bg-white p-4 overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="border-b-2 border-[#0D1B2E]">
                <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#F7F6F2] px-2.5 py-2">Subject</th>
                <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#F7F6F2] px-2.5 py-2">Credits/Year</th>
                <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#F7F6F2] px-2.5 py-2">To Earn Credit</th>
              </tr>
            </thead>
            <tbody className="text-[#444]">
              {[
                ["God First / Bible", "1.0", "Daily attendance + participation"],
                ["Mathematics", "1.0", "Pass with D or higher + mastery assessments"],
                ["ELA / Reading", "1.0", "Pass with D or higher"],
                ["Science", "1.0", "Pass with D or higher"],
                ["Social Studies", "1.0", "Pass with D or higher"],
                ["STEAM", "1.0", "8 of 10 monthly modules + portfolio"],
                ["PE / Health", "0.5", "Participation + fitness log"],
              ].map(([subj, credits, req]) => (
                <tr key={subj} className="border-b border-[#DDD8CC]">
                  <td className="px-2.5 py-2 font-medium">{subj}</td>
                  <td className="px-2.5 py-2">{credits}</td>
                  <td className="px-2.5 py-2">{req}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* High School */}
      <div className="rounded-lg overflow-hidden border border-[#DDD8CC]">
        <div className="bg-[#0D1B2E] px-5 py-3">
          <span className="text-[13px] font-bold text-[#C9A84C] font-serif">High School — Grades 9–12</span>
          <span className="text-[10px] text-white/50 ml-3">24 total credits for graduation (Florida BEST Standards)</span>
        </div>
        <div className="bg-white p-4 overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="border-b-2 border-[#0D1B2E]">
                <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#F7F6F2] px-2.5 py-2">Subject Area</th>
                <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#F7F6F2] px-2.5 py-2">Credits</th>
                <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#F7F6F2] px-2.5 py-2">Type</th>
                <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#F7F6F2] px-2.5 py-2">Required Courses</th>
              </tr>
            </thead>
            <tbody className="text-[#444]">
              {[
                ["English/Language Arts", "4.0", "req", "English I, II, III, IV"],
                ["Mathematics", "4.0", "req", "Algebra 1, Geometry, Algebra 2 + 1 elective"],
                ["Science", "3.0", "req", "Biology I + 2 lab sciences"],
                ["Social Studies", "3.0", "req", "World History, U.S. History, U.S. Gov/Econ"],
                ["Physical Education (HOPE)", "1.0", "req", "PE / Health"],
                ["Fine Arts / Practical Arts / CTE", "1.0", "req", "1 credit any arts, practical arts, or CTE course"],
                ["Personal Financial Literacy", "0.5", "req", "Financial Literacy & Money Management"],
                ["Electives", "7.5", "elec", "Includes online course requirement — any provider, FL Statute 1003.4282"],
              ].map(([subj, credits, type, courses]) => (
                <tr key={subj} className="border-b border-[#DDD8CC]">
                  <td className="px-2.5 py-2 font-medium">{subj}</td>
                  <td className="px-2.5 py-2">{credits}</td>
                  <td className="px-2.5 py-2"><ReqBadge type={type} /></td>
                  <td className="px-2.5 py-2">{courses}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#0D1B2E] font-bold">
                <td className="px-2.5 py-2">Florida Total</td>
                <td className="px-2.5 py-2">24.0</td>
                <td className="px-2.5 py-2"></td>
                <td className="px-2.5 py-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FHA Additional Graduation Expectations */}
      <div className="rounded-lg overflow-hidden border border-[#DDD8CC]">
        <div className="bg-[#0D1B2E] px-5 py-3">
          <span className="text-[13px] font-bold text-[#C9A84C] font-serif">FHA Additional Graduation Expectations</span>
          <span className="text-[10px] text-white/50 ml-3">School requirements — tracked separately from the 24-credit Florida audit</span>
        </div>
        <div className="bg-white p-4">
          <ul className="text-[11px] text-[#444] space-y-2">
            <li><span className="font-medium text-[#0D1B2E]">Bible:</span> 1 credit each year (4 total) — FHA institutional requirement</li>
            <li><span className="font-medium text-[#0D1B2E]">STEAM:</span> Not a separate graduation credit — embedded throughout the curriculum monthly, tracked via participation</li>
            <li><span className="font-medium text-[#0D1B2E]">Community Service / Service Learning:</span> If applicable</li>
            <li><span className="font-medium text-[#0D1B2E]">Senior Capstone:</span> If applicable</li>
            <li><span className="font-medium text-[#0D1B2E]">World Language:</span> Optional for graduation. Strongly recommended for students planning to attend a four-year university (2 credits of the same language) — tracked as a college-readiness indicator, not a diploma requirement</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ReqBadge({ type }: { type: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    req: { bg: "#FFE8E8", color: "#A00000", label: "Required" },
    fha: { bg: "#FBF5E6", color: "#7A5800", label: "FHA Required" },
    elec: { bg: "#EAF3F6", color: "#2E6B7A", label: "Elective" },
  };
  const s = styles[type] ?? styles.req;
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded inline-block" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function CourseSequences() {
  return (
    <div className="space-y-6">
      {/* Math sequences */}
      <div className="bg-white border border-[#DDD8CC] rounded-lg p-4 overflow-x-auto">
        <h3 className="text-sm font-bold text-[#0D1B2E] mb-3">Mathematics Course Sequence</h3>
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b-2 border-[#0D1B2E]">
              <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#F7F6F2] px-2.5 py-2">Grade</th>
              <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#FEF3E3] px-2.5 py-2">Intervention</th>
              <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#E8F0FB] px-2.5 py-2">On-Level</th>
              <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#EAF3F6] px-2.5 py-2">Advanced</th>
            </tr>
          </thead>
          <tbody className="text-[#444]">
            {GRADES.map((g) => (
              <tr key={g} className="border-b border-[#DDD8CC]">
                <td className="px-2.5 py-2 font-bold text-[#0D1B2E]">{g === "K" ? "K" : g}</td>
                <td className="px-2.5 py-2 bg-[#FEF3E3]/30">{MATH_COURSES[g].intervention}</td>
                <td className="px-2.5 py-2 bg-[#E8F0FB]/30">{MATH_COURSES[g].on_level}</td>
                <td className="px-2.5 py-2 bg-[#EAF3F6]/30">{MATH_COURSES[g].advanced}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ELA sequences */}
      <div className="bg-white border border-[#DDD8CC] rounded-lg p-4 overflow-x-auto">
        <h3 className="text-sm font-bold text-[#0D1B2E] mb-3">ELA / Reading Course Sequence</h3>
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b-2 border-[#0D1B2E]">
              <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#F7F6F2] px-2.5 py-2">Grade</th>
              <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#FEF3E3] px-2.5 py-2">Intervention</th>
              <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#E8F0FB] px-2.5 py-2">On-Level</th>
              <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#EAF3F6] px-2.5 py-2">Advanced</th>
            </tr>
          </thead>
          <tbody className="text-[#444]">
            {GRADES.map((g) => (
              <tr key={g} className="border-b border-[#DDD8CC]">
                <td className="px-2.5 py-2 font-bold text-[#0D1B2E]">{g === "K" ? "K" : g}</td>
                <td className="px-2.5 py-2 bg-[#FEF3E3]/30">{ELA_COURSES[g].intervention}</td>
                <td className="px-2.5 py-2 bg-[#E8F0FB]/30">{ELA_COURSES[g].on_level}</td>
                <td className="px-2.5 py-2 bg-[#EAF3F6]/30">{ELA_COURSES[g].advanced}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Science sequences */}
      <div className="bg-white border border-[#DDD8CC] rounded-lg p-4 overflow-x-auto">
        <h3 className="text-sm font-bold text-[#0D1B2E] mb-3">Science Course Sequence</h3>
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b-2 border-[#0D1B2E]">
              <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#F7F6F2] px-2.5 py-2">Grade</th>
              <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] bg-[#F7F6F2] px-2.5 py-2">Course Name</th>
            </tr>
          </thead>
          <tbody className="text-[#444]">
            {GRADES.map((g) => (
              <tr key={g} className="border-b border-[#DDD8CC]">
                <td className="px-2.5 py-2 font-bold text-[#0D1B2E]">{g === "K" ? "K" : g}</td>
                <td className="px-2.5 py-2">{SCIENCE_COURSES[g]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SteamGrid({ band }: { band: "K-2" | "3-5" | "6-8" | "9-12" }) {
  const months = STEAM_DATA[band];
  if (!months || months.length === 0) {
    return <p className="text-sm text-[#666]">STEAM data for {band} coming soon.</p>;
  }
  return (
    <div className="space-y-3.5">
      {months.map((m) => (
        <div key={m.month} className="bg-white border border-[#DDD8CC] rounded-xl overflow-hidden">
          <div className="bg-[#0D1B2E] px-4 py-3">
            <div className="text-[9px] font-bold text-[#5B9BAF] uppercase tracking-wider">{m.month}</div>
            <div className="text-base font-bold text-white font-serif">{m.theme}</div>
            {m.kit && (
              <div className="mt-1.5">
                <span className="bg-[#C9A84C] text-[#0D1B2E] text-[10px] font-bold px-2.5 py-0.5 rounded">
                  Kit: {m.kit}
                </span>
              </div>
            )}
            {m.scripture && (
              <div className="text-[10px] text-white/50 italic mt-2 border-l-2 border-[#C9A84C] pl-2 leading-relaxed">
                {m.scripture}
              </div>
            )}
          </div>
          <div className="p-4">
            {m.chapel && (
              <div className="mb-3">
                <div className="text-[9px] font-bold uppercase tracking-wide text-[#666] mb-1">Chapel Themes</div>
                <div className="text-[11px] text-[#444]">{m.chapel}</div>
              </div>
            )}
            <div className="text-[9px] font-bold uppercase tracking-wide text-[#666] mb-1.5">Monthly Assignment — {band}</div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-[#FEF3E3] border-l-[3px] border-[#9B4E00] rounded-lg p-2.5">
                <div className="text-[9px] font-bold uppercase text-[#9B4E00]">Intervention</div>
                <div className="text-[11px] text-[#444] mt-1">{m.intervention}</div>
              </div>
              <div className="bg-[#E8F0FB] border-l-[3px] border-[#0F4C8A] rounded-lg p-2.5">
                <div className="text-[9px] font-bold uppercase text-[#0F4C8A]">On-Level</div>
                <div className="text-[11px] text-[#444] mt-1">{m.onLevel}</div>
              </div>
              <div className="bg-[#EAF3F6] border-l-[3px] border-[#2E6B7A] rounded-lg p-2.5">
                <div className="text-[9px] font-bold uppercase text-[#2E6B7A]">Advanced</div>
                <div className="text-[11px] text-[#444] mt-1">{m.advanced}</div>
              </div>
            </div>
            {m.garden && (
              <div className="bg-[#E4F5EC] border border-[#90C4A0] rounded-lg p-2.5">
                <div className="text-[9px] font-bold uppercase text-[#1A6E40]">Garden Connection</div>
                <div className="text-[11px] text-[#1A3A28] mt-1">{m.garden}</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
