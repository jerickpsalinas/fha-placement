"use client";

import { useState, useRef } from "react";
import {
  MATH_COURSES, ELA_COURSES, SCIENCE_COURSES, SOCIAL_STUDIES_COURSES,
  PLACEMENT_LEVEL_LABELS, bibleCourseName, fastToLevel, MAP_NORMS,
  type PlacementLevel, type LeveledPlacement,
} from "@/lib/placement/norms";
import type { GradeLevel } from "@/types";

type DocType = "transcript" | "map" | "sat" | "act" | "state" | "reportcard";

const DOC_TYPE_LABELS: Record<DocType, string> = {
  transcript: "Transcript",
  map: "MAP Growth",
  sat: "SAT",
  act: "ACT",
  state: "State Assessment (FAST/FSA)",
  reportcard: "Report Card",
};

// Florida 24-credit standard diploma breakdown (BEST Standards aligned).
// Bible, STEAM, World Language, Community Service, and Senior Capstone are
// FHA institutional expectations tracked separately — see FHA_EXTRAS below —
// since they are not part of the Florida 24-credit count.
const REQS = [
  { key: "ela", label: "English/Language Arts", req: 4, cats: ["English/Language Arts"] },
  { key: "math", label: "Mathematics", req: 4, cats: ["Mathematics"] },
  { key: "sci", label: "Science", req: 3, cats: ["Science"] },
  { key: "ss", label: "Social Studies", req: 3, cats: ["Social Studies"] },
  { key: "pe", label: "Physical Education (HOPE)", req: 1, cats: ["Physical Education"] },
  { key: "arts", label: "Fine Arts / Practical Arts / CTE", req: 1, cats: ["Fine Arts/Practical Arts/CTE"] },
  { key: "fin", label: "Personal Financial Literacy", req: 0.5, cats: ["Financial Literacy"] },
  { key: "elec", label: "Electives", req: 7.5, cats: ["Electives", "AP/Dual Enrollment", "Other"] },
];

const FHA_BIBLE_CREDITS_REQUIRED = 4;

function levelBadge(level: string) {
  const cls = level === "Intervention" ? "bg-[#FEF3E3] text-[#9B4E00]"
    : level === "Advanced" ? "bg-[#EAF3F6] text-[#2E6B7A]"
    : level === "Whole Group" ? "bg-[#FBF5E6] text-[#7A5800]"
    : "bg-[#E8F0FB] text-[#0F4C8A]";
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cls}`}>{level}</span>;
}

function statColor(type: string) {
  if (type === "ok") return "text-[#1A6E40]";
  if (type === "warn") return "text-[#A00000]";
  if (type === "gold") return "text-[#C9A84C]";
  if (type === "mid") return "text-[#7A5800]";
  return "";
}

function gradeBadge(g: string | null) {
  if (!g) return <span>—</span>;
  const colors: Record<string, string> = {
    A: "bg-[#E4F5EC] text-[#1A6E40]",
    B: "bg-[#E8F0FB] text-[#0F4C8A]",
    C: "bg-[#FBF5E6] text-[#7A5800]",
    D: "bg-[#FEF3E3] text-[#9B4E00]",
    F: "bg-[#FFF5F5] text-[#A00000]",
  };
  return (
    <span className={`inline-flex items-center justify-center w-[22px] h-[22px] rounded text-[10px] font-bold ${colors[g] ?? "bg-[#F7F6F2] text-[#666]"}`}>
      {g}
    </span>
  );
}

function SchedBlock({ grade, mathLvl, readLvl, source }: { grade: string; mathLvl: string; readLvl: string; source: string }) {
  const g = grade as GradeLevel;
  const sciLvl = (mathLvl === "Intervention" || readLvl === "Intervention") ? "Intervention"
    : (mathLvl === "Advanced" && readLvl === "Advanced") ? "Advanced" : "On-Level";
  const mKey = mathLvl === "Intervention" ? "intervention" : mathLvl === "Advanced" ? "advanced" : "on_level";
  const rKey = readLvl === "Intervention" ? "intervention" : readLvl === "Advanced" ? "advanced" : "on_level";
  const mc = MATH_COURSES[g]?.[mKey as LeveledPlacement] ?? "Grade-level Math";
  const ec = ELA_COURSES[g]?.[rKey as LeveledPlacement] ?? "Grade-level ELA";

  const rows = [
    { subj: "God First / Bible", lvl: "Whole Group", note: "8:00-8:30 daily — all students" },
    { subj: "ELA / Reading", lvl: readLvl, note: ec },
    { subj: "Mathematics", lvl: mathLvl, note: mc },
    { subj: "Writing (B-Day)", lvl: readLvl, note: "Follows ELA placement" },
    { subj: "Science", lvl: sciLvl, note: SCIENCE_COURSES[g] ?? "Science" },
    { subj: "Social Studies", lvl: readLvl, note: SOCIAL_STUDIES_COURSES[g] ?? "Social Studies" },
    { subj: "STEAM / T&K Kit", lvl: "Whole Group", note: "Same monthly kit for all levels" },
    { subj: "Technology", lvl: "Whole Group", note: "B-Day — Robotics Workshop" },
  ];

  return (
    <div className="bg-white border border-[#DDD8CC] rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[#DDD8CC]">
        <span className="text-sm font-bold text-[#0D1B2E]">Recommended FHA Class Schedule — Grade {grade}</span>
        <span className="text-[9px] text-[#777] ml-2">({source})</span>
      </div>
      <div className="divide-y divide-[#DDD8CC]">
        {rows.map((r) => (
          <div key={r.subj} className="flex items-center gap-3 px-4 py-2 text-[11px]">
            <div className="w-[120px] font-semibold text-[#0D1B2E] flex-shrink-0">{r.subj}</div>
            <div className="w-[80px] flex-shrink-0">{levelBadge(r.lvl)}</div>
            <div className="text-[#444]">{r.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BfBadge({ met, pts }: { met: boolean; pts: number }) {
  if (met) return <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#E4F5EC] text-[#1A6E40]">Eligible</span>;
  if (pts <= 50 && pts > 0) return <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#FBF5E6] text-[#7A5800]">+{pts} pts away</span>;
  return <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#FFF5F5] text-[#A00000]">Need +{Math.max(0, pts)} pts</span>;
}

export function RecordsTool() {
  const [docType, setDocType] = useState<DocType>("transcript");
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ type: DocType; data: Record<string, unknown> } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function processDocument() {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);
      const res = await fetch("/api/extract-document", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Server error" }));
        throw new Error(err.error || "Failed to process document");
      }
      const data = await res.json();
      setResult({ type: docType, data });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setProcessing(false);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="bg-[#F7F6F2] min-h-screen">
      {/* Hero */}
      <div className="bg-[#0D1B2E] px-8 py-8 text-white">
        <p className="text-[10px] uppercase tracking-[.15em] text-[#C9A84C] font-bold mb-2">Father&apos;s Harbor Academy</p>
        <h1 className="text-2xl font-bold font-serif">
          Records, Transcripts &amp; College Planning
        </h1>
        <p className="text-[11px] text-white/60 mt-2 max-w-xl">
          Upload a document — transcript, MAP report, SAT/ACT scores, state assessment, or report card.
          AI reads and extracts every data point, then builds the student&apos;s full academic plan automatically.
        </p>
      </div>

      <div className="p-8 max-w-4xl space-y-6">
        {!result && (
          <>
            {/* Step 1: Document type */}
            <div className="bg-white border border-[#DDD8CC] rounded-lg p-6">
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#777] mb-3">Step 1 — Select Document Type</div>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(DOC_TYPE_LABELS) as DocType[]).map((t) => (
                  <button key={t} onClick={() => setDocType(t)}
                    className={`text-[11px] font-semibold px-4 py-3 rounded-lg border transition ${
                      docType === t
                        ? "bg-[#0D1B2E] text-[#C9A84C] border-[#0D1B2E]"
                        : "bg-white text-[#444] border-[#DDD8CC] hover:bg-gray-50"
                    }`}>
                    {DOC_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Upload */}
            <div className="bg-white border border-[#DDD8CC] rounded-lg p-6">
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#777] mb-3">Step 2 — Upload Document</div>
              <div className="border-2 border-dashed border-[#DDD8CC] rounded-lg p-8 text-center">
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden" id="file-input" />
                <label htmlFor="file-input" className="cursor-pointer">
                  <div className="text-sm text-[#666]">
                    {file ? (
                      <span className="font-medium text-[#0D1B2E]">{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                    ) : (
                      <>Drop a file here or <span className="text-[#C9A84C] font-semibold underline">click to browse</span></>
                    )}
                  </div>
                  <div className="text-[10px] text-[#999] mt-1">PDF, JPG, or PNG</div>
                </label>
              </div>

              {file && (
                <div className="flex gap-2 mt-4">
                  <button onClick={processDocument} disabled={processing}
                    className="bg-[#0D1B2E] text-[#C9A84C] text-xs font-bold px-5 py-2.5 rounded hover:opacity-90 disabled:opacity-50">
                    {processing ? "Processing..." : "Read Document and Build Plan →"}
                  </button>
                  <button onClick={reset} className="text-xs text-[#777] px-3 py-2 hover:text-[#444]">
                    Remove file
                  </button>
                </div>
              )}

              {processing && (
                <div className="mt-4">
                  <div className="h-1.5 bg-[#DDD8CC] rounded-full overflow-hidden">
                    <div className="h-full bg-[#C9A84C] rounded-full animate-pulse" style={{ width: "60%" }} />
                  </div>
                  <p className="text-[10px] text-[#777] mt-2">Extracting student information...</p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-[#FFF5F5] border border-red-200 rounded-lg p-4 text-sm text-[#A00000]">
                <strong>Error:</strong> {error}
              </div>
            )}
          </>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="bg-[#E4F5EC] border border-green-200 rounded-lg p-4 text-sm text-[#1A6E40]">
              <strong>Done — {(result.data.studentName as string) || "Student"}&apos;s plan is ready.</strong> All data was extracted automatically. Review each section below.
            </div>

            {result.type === "transcript" && <TranscriptResult data={result.data} />}
            {result.type === "map" && <MapResult data={result.data} />}
            {result.type === "sat" && <SatResult data={result.data} />}
            {result.type === "act" && <ActResult data={result.data} />}
            {result.type === "state" && <StateResult data={result.data} />}
            {result.type === "reportcard" && <ReportCardResult data={result.data} />}

            <div className="flex gap-2">
              <button onClick={() => window.print()} className="bg-[#0D1B2E] text-[#C9A84C] text-xs font-bold px-5 py-2.5 rounded hover:opacity-90">
                Print This Plan
              </button>
              <button onClick={reset} className="text-xs text-[#777] px-3 py-2 border border-[#DDD8CC] rounded hover:bg-gray-50">
                Upload Another Document
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatRow({ items }: { items: [string | number, string, string][] }) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {items.map(([val, label, color]) => (
        <div key={label} className="bg-white border border-[#DDD8CC] rounded-lg px-4 py-3 min-w-[100px]">
          <div className={`text-lg font-bold ${statColor(color)} font-serif`}>{val}</div>
          <div className="text-[9px] text-[#777] uppercase font-semibold tracking-wide">{label}</div>
        </div>
      ))}
    </div>
  );
}

function NextSteps({ items }: { items: string[] }) {
  return (
    <div className="bg-[#0D1B2E] rounded-lg p-4">
      <div className="text-[10px] font-bold uppercase tracking-wide text-[#C9A84C] mb-2">Next Steps</div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="text-[11px] text-white/70 border-b border-white/10 pb-1.5" dangerouslySetInnerHTML={{ __html: item }} />
        ))}
      </div>
    </div>
  );
}

function TranscriptResult({ data }: { data: Record<string, unknown> }) {
  const earned = (data.totalCreditsEarned as number) || 0;
  const rem = Math.max(0, 24 - earned);
  const gpa = data.cumulativeGpa != null ? String(data.cumulativeGpa) : "—";
  const courses = (data.courses as { name: string; credits: number; grade: string; category: string; year: string }[]) || [];
  const grade = (data.currentGrade as string) || "9";

  const byYear: Record<string, typeof courses> = {};
  courses.forEach((c) => {
    const yr = c.year || "Other";
    if (!byYear[yr]) byYear[yr] = [];
    byYear[yr].push(c);
  });

  const catEarned: Record<string, number> = {};
  courses.forEach((c) => {
    if (c.grade && c.grade.toUpperCase() !== "F" && c.credits > 0) {
      const cat = c.category || "Elective";
      catEarned[cat] = (catEarned[cat] || 0) + c.credits;
    }
  });

  const steps: string[] = [];
  if (rem > 0) steps.push(`<strong>${rem.toFixed(1)} credits still needed.</strong> Build the next course schedule around the red gaps above.`);
  if (data.hasOnlineCourse === false) steps.push("<strong>Online course required.</strong> Florida Virtual School, Edgenuity, or approved online dual enrollment.");
  steps.push("<strong>Upload MAP Growth report</strong> for precise Math, ELA, Science, and Social Studies placement.");
  steps.push("<strong>Upload SAT or ACT scores</strong> for Bright Futures scholarship eligibility.");
  steps.push("<strong>Enter courses in GradeLink</strong> — this tool reads and plans, GradeLink is the official record.");

  return (
    <>
      <StatRow items={[
        [earned.toFixed(1), "Credits Earned", "gold"],
        [rem.toFixed(1), "Credits Remaining", rem > 0 ? "warn" : "ok"],
        [gpa, "Cumulative GPA", parseFloat(gpa) >= 2 ? "ok" : "warn"],
        [grade ? `Grade ${grade}` : "—", "Current Grade", ""],
      ]} />

      {data.hasOnlineCourse === false && (
        <div className="bg-[#E8F0FB] border border-blue-200 rounded-lg p-3 text-[11px] text-[#0F4C8A]">
          <strong>Online course not found on transcript.</strong> Florida Statute 1003.4282 requires at least one fully-online course before graduation.
        </div>
      )}

      {/* Courses by year */}
      <div className="bg-white border border-[#DDD8CC] rounded-lg p-4">
        <div className="text-sm font-bold text-[#0D1B2E] mb-3">Courses on Transcript</div>
        {Object.entries(byYear).map(([yr, cs]) => (
          <div key={yr} className="mb-4">
            <div className="text-[9px] font-bold text-[#777] uppercase tracking-wide border-b border-[#DDD8CC] pb-1 mb-2">{yr}</div>
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-[#DDD8CC]">
                  <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] px-2 py-1">Course</th>
                  <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] px-2 py-1">Credits</th>
                  <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] px-2 py-1">Grade</th>
                  <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] px-2 py-1">Category</th>
                </tr>
              </thead>
              <tbody>
                {cs.map((c, i) => (
                  <tr key={i} className="border-b border-[#DDD8CC]/50">
                    <td className="px-2 py-1.5 font-medium">{c.name || "—"}</td>
                    <td className="px-2 py-1.5">{(c.credits || 0).toFixed(1)}</td>
                    <td className="px-2 py-1.5">{gradeBadge(c.grade?.toUpperCase() || null)}</td>
                    <td className="px-2 py-1.5 text-[9px] text-[#777]">{c.category || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Graduation Audit */}
      <div className="bg-white border border-[#DDD8CC] rounded-lg p-4">
        <div className="text-sm font-bold text-[#0D1B2E] mb-3">Graduation Requirement Audit — 24 Credits Required</div>
        <div className="space-y-2">
          {REQS.map((r) => {
            const e = r.cats.reduce((s, cat) => s + (catEarned[cat] || 0), 0);
            const diff = r.req - e;
            const pct = Math.min(100, Math.round((e / r.req) * 100));
            const barColor = diff <= 0 ? "#1A6E40" : e > 0 ? "#7A5800" : "#A00000";
            const statusLabel = diff <= 0 ? "Done" : e > 0 ? `+${diff.toFixed(1)} needed` : "Not started";
            const statusCls = diff <= 0 ? "bg-[#E4F5EC] text-[#1A6E40]" : e > 0 ? "bg-[#FBF5E6] text-[#7A5800]" : "bg-[#FFF5F5] text-[#A00000]";
            return (
              <div key={r.key} className="flex items-center gap-3">
                <div className="w-[180px] flex-shrink-0 text-[11px] text-[#0D1B2E]">{r.label}</div>
                <div className="flex-1 h-[6px] bg-[#DDD8CC] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                </div>
                <div className="w-[52px] text-right text-[9px] text-[#777]">{e.toFixed(1)} / {r.req}</div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${statusCls}`}>{statusLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* FHA Additional Graduation Expectations */}
      <div className="bg-white border border-[#DDD8CC] rounded-lg p-4">
        <div className="text-sm font-bold text-[#0D1B2E] mb-1">FHA Additional Graduation Expectations</div>
        <div className="text-[10px] text-[#777] mb-3">Tracked separately from the Florida 24-credit audit above.</div>
        <div className="space-y-2 text-[11px] text-[#444]">
          <div className="flex items-center justify-between border border-[#DDD8CC] rounded px-3 py-2">
            <span className="font-medium text-[#0D1B2E]">Bible</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${(catEarned["God First/Bible"] || 0) >= FHA_BIBLE_CREDITS_REQUIRED ? "bg-[#E4F5EC] text-[#1A6E40]" : "bg-[#FBF5E6] text-[#7A5800]"}`}>
              {(catEarned["God First/Bible"] || 0).toFixed(1)} / {FHA_BIBLE_CREDITS_REQUIRED.toFixed(1)} credits
            </span>
          </div>
          <p><strong className="text-[#0D1B2E]">STEAM:</strong> Not a separate graduation credit — embedded monthly, tracked via participation.</p>
          <p><strong className="text-[#0D1B2E]">Community Service / Service Learning:</strong> If applicable.</p>
          <p><strong className="text-[#0D1B2E]">Senior Capstone:</strong> If applicable.</p>
          <p><strong className="text-[#0D1B2E]">World Language:</strong> Optional for graduation — recommended for four-year university plans (2 credits, same language). Tracked as a college-readiness indicator{(catEarned["World Language"] || 0) > 0 ? ` — ${(catEarned["World Language"] || 0).toFixed(1)} credits on file` : ""}.</p>
        </div>
      </div>

      <SchedBlock grade={grade} mathLvl="On-Level" readLvl="On-Level" source="Upload MAP for precise leveling" />
      <NextSteps items={steps} />
    </>
  );
}

function MapResult({ data }: { data: Record<string, unknown> }) {
  const mathRit = data.mathRit as string || "—";
  const readRit = data.readingRit as string || "—";
  const mathPct = data.mathPercentile as number | null;
  const readPct = data.readingPercentile as number | null;
  const ml = (data.mathLevel as string) || "On-Level";
  const rl = (data.readingLevel as string) || "On-Level";
  const grade = (data.grade as string) || "6";

  const steps: string[] = [];
  if (ml === "Intervention") steps.push("<strong>Math Intervention:</strong> Daily targeted skill work. Update ILP in GradeLink. Reassess at next MAP window.");
  if (rl === "Intervention") steps.push("<strong>Reading Intervention:</strong> Daily fluency practice. This does not hold the student back in Science or Social Studies.");
  if (ml === "Advanced") steps.push("<strong>Math Advanced:</strong> Consider acceleration to next-year course content.");
  steps.push("<strong>Update GradeLink</strong> with placement and notify parents.");
  steps.push("<strong>Upload transcript</strong> to add credit history to the full student profile.");

  return (
    <>
      <StatRow items={[
        [mathRit, "Math RIT", ml === "Advanced" ? "ok" : ml === "Intervention" ? "warn" : ""],
        [readRit, "Reading RIT", rl === "Advanced" ? "ok" : rl === "Intervention" ? "warn" : ""],
        [mathPct != null ? `${mathPct}th` : "—", "Math Percentile", ""],
        [readPct != null ? `${readPct}th` : "—", "Reading Percentile", ""],
        [ml, "Math Placement", ml === "Advanced" ? "ok" : ml === "Intervention" ? "warn" : ""],
        [rl, "Reading Placement", rl === "Advanced" ? "ok" : rl === "Intervention" ? "warn" : ""],
      ]} />
      {data.satProjection && (
        <div className="bg-[#E4F5EC] border border-green-200 rounded-lg p-3 text-[11px] text-[#1A6E40]">
          <strong>SAT Projection from MAP:</strong> {data.satProjection as string}
        </div>
      )}
      <SchedBlock grade={grade} mathLvl={ml} readLvl={rl} source={`MAP ${data.testWindow || ""} — Math ${mathRit} / Reading ${readRit}`} />
      <NextSteps items={steps} />
    </>
  );
}

function SatResult({ data }: { data: Record<string, unknown> }) {
  const total = (data.totalScore as number) || 0;
  const m = (data.mathScore as number) || 0;
  const e = (data.ebrwScore as number) || 0;

  const steps: string[] = [];
  if (m < 530) steps.push(`<strong>Math (+${530 - m} pts to readiness):</strong> Heart of Algebra and Problem-Solving and Data Analysis. Khan Academy SAT prep is free and College Board-official.`);
  if (e < 480) steps.push(`<strong>EBRW (+${480 - e} pts to readiness):</strong> Craft and Structure and Command of Evidence. Read nonfiction passages daily.`);
  if (total < 1290) steps.push(`<strong>Bright Futures (+${1290 - total} pts to Academic Scholars):</strong> Retake in spring of Grade 11 or fall of Grade 12.`);

  return (
    <>
      <StatRow items={[
        [total || "—", "SAT Total", total >= 1290 ? "ok" : total >= 1170 ? "mid" : "warn"],
        [m || "—", "Math — goal 530+", m >= 530 ? "ok" : "warn"],
        [e || "—", "EBRW — goal 480+", e >= 480 ? "ok" : "warn"],
      ]} />
      <div className="bg-white border border-[#DDD8CC] rounded-lg p-4">
        <div className="text-sm font-bold text-[#0D1B2E] mb-3">Florida Bright Futures Eligibility</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] border-b border-[#DDD8CC] pb-2">
            <span>Academic Scholars — 100% tuition — 1290 SAT + 3.5 GPA + 100 service hours</span>
            <BfBadge met={total >= 1290} pts={1290 - total} />
          </div>
          <div className="flex items-center justify-between text-[11px] border-b border-[#DDD8CC] pb-2">
            <span>Medallion Scholars — 75% tuition — 1170 SAT + 3.0 GPA + 100 service hours</span>
            <BfBadge met={total >= 1170} pts={1170 - total} />
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span>SAT College Readiness — 1010 total (530 Math + 480 EBRW)</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${total >= 1010 && m >= 530 && e >= 480 ? "bg-[#E4F5EC] text-[#1A6E40]" : "bg-[#FFF5F5] text-[#A00000]"}`}>
              {total >= 1010 && m >= 530 && e >= 480 ? "Met" : "Not yet"}
            </span>
          </div>
        </div>
      </div>
      {steps.length > 0 && <NextSteps items={steps} />}
    </>
  );
}

function ActResult({ data }: { data: Record<string, unknown> }) {
  const c = (data.composite as number) || 0;
  const eng = (data.english as number) || 0;
  const math = (data.math as number) || 0;
  const read = (data.reading as number) || 0;
  const sci = (data.science as number) || 0;

  const steps: string[] = [];
  if (math < 22) steps.push(`<strong>Math (+${22 - math} pts):</strong> Pre-Algebra and Algebra are highest-volume. Calculator allowed throughout.`);
  if (read < 21) steps.push(`<strong>Reading (+${21 - read} pts):</strong> Practice timed passages — 8-9 minutes each. Pacing is the main challenge.`);
  if (sci < 23) steps.push(`<strong>Science (+${23 - sci} pts):</strong> Tests data interpretation, not knowledge. Practice reading graphs and tables quickly.`);
  if (eng < 18) steps.push(`<strong>English (+${18 - eng} pts):</strong> Punctuation rules. Shorter answers are almost always correct on ACT English.`);
  if (steps.length) steps.push("Upload transcript to verify GPA for full Bright Futures eligibility.");

  return (
    <>
      <StatRow items={[
        [c || "—", "Composite", c >= 29 ? "ok" : c >= 22 ? "mid" : "warn"],
        [eng || "—", "English — 18+", eng >= 18 ? "ok" : "warn"],
        [math || "—", "Math — 22+", math >= 22 ? "ok" : "warn"],
        [read || "—", "Reading — 21+", read >= 21 ? "ok" : "warn"],
        [sci || "—", "Science — 23+", sci >= 23 ? "ok" : "warn"],
      ]} />
      <div className="bg-white border border-[#DDD8CC] rounded-lg p-4">
        <div className="text-sm font-bold text-[#0D1B2E] mb-3">Florida Bright Futures Eligibility</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] border-b border-[#DDD8CC] pb-2">
            <span>Academic Scholars — 100% tuition — 29 ACT + 3.5 GPA + 100 service hours</span>
            <BfBadge met={c >= 29} pts={29 - c} />
          </div>
          <div className="flex items-center justify-between text-[11px] border-b border-[#DDD8CC] pb-2">
            <span>Medallion Scholars — 75% tuition — 26 ACT + 3.0 GPA + 100 service hours</span>
            <BfBadge met={c >= 26} pts={26 - c} />
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span>ACT College Readiness — Composite 22+</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${c >= 22 ? "bg-[#E4F5EC] text-[#1A6E40]" : "bg-[#FFF5F5] text-[#A00000]"}`}>
              {c >= 22 ? "Met" : `Need +${22 - c} pts`}
            </span>
          </div>
        </div>
      </div>
      {steps.length > 0 && <NextSteps items={steps} />}
    </>
  );
}

function StateResult({ data }: { data: Record<string, unknown> }) {
  const lvl = data.achievementLevel as number | null;
  const subject = (data.subject as string) || "";
  const grade = (data.grade as string) || "6";
  const isEla = /ela/i.test(subject);
  const isMath = /math/i.test(subject);
  const mapLvl = (lvl ?? 0) >= 4 ? "Advanced" : (lvl ?? 0) >= 3 ? "On-Level" : "Intervention";

  return (
    <>
      <StatRow items={[
        [(data.studentName as string) || "—", "Student", ""],
        [data.grade ? `Grade ${grade}` : "—", "Grade", ""],
        [(data.assessmentName as string) || "Assessment", "Test", ""],
        [subject || "—", "Subject", ""],
        [lvl ? `Level ${lvl}` : "—", "Achievement Level", (lvl ?? 0) >= 4 ? "ok" : (lvl ?? 0) >= 3 ? "" : "warn"],
        [(data.scaleScore as string) || "—", "Scale Score", ""],
      ]} />
      {data.levelDescription && (
        <div className={`rounded-lg p-3 text-[11px] border ${(lvl ?? 0) >= 3 ? "bg-[#E4F5EC] border-green-200 text-[#1A6E40]" : "bg-[#FFF5F5] border-red-200 text-[#A00000]"}`}>
          <strong>Level {lvl} — {data.levelDescription as string}</strong>
        </div>
      )}
      <SchedBlock grade={grade} mathLvl={isMath ? mapLvl : "On-Level"} readLvl={isEla ? mapLvl : "On-Level"} source={`${data.assessmentName || "State Assessment"} Level ${lvl ?? "—"}`} />
      {data.nextSteps && <NextSteps items={[data.nextSteps as string]} />}
    </>
  );
}

function ReportCardResult({ data }: { data: Record<string, unknown> }) {
  const subjects = (data.subjects as { name: string; q1: string; q2: string; q3: string; q4: string; yearAvg: string }[]) || [];
  const grade = (data.grade as string) || "5";

  return (
    <>
      <StatRow items={[
        [(data.studentName as string) || "—", "Student", ""],
        [data.grade ? `Grade ${grade}` : "—", "Grade", ""],
        [data.gpa != null ? String(data.gpa) : "—", "GPA", parseFloat(String(data.gpa)) >= 2 ? "ok" : "warn"],
        [(data.promotionStatus as string) || "—", "Promotion", data.promotionStatus === "Promoted" ? "ok" : "warn"],
      ]} />
      <div className="bg-white border border-[#DDD8CC] rounded-lg p-4">
        <div className="text-sm font-bold text-[#0D1B2E] mb-3">Grades by Subject</div>
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b-2 border-[#0D1B2E]">
              <th className="text-left text-[9px] uppercase font-bold text-[#0D1B2E] px-2 py-1">Subject</th>
              <th className="text-center text-[9px] uppercase font-bold text-[#0D1B2E] px-2 py-1">Q1</th>
              <th className="text-center text-[9px] uppercase font-bold text-[#0D1B2E] px-2 py-1">Q2</th>
              <th className="text-center text-[9px] uppercase font-bold text-[#0D1B2E] px-2 py-1">Q3</th>
              <th className="text-center text-[9px] uppercase font-bold text-[#0D1B2E] px-2 py-1">Q4</th>
              <th className="text-center text-[9px] uppercase font-bold text-[#0D1B2E] px-2 py-1">Year</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.name} className="border-b border-[#DDD8CC]">
                <td className="px-2 py-1.5 font-semibold">{s.name}</td>
                <td className="px-2 py-1.5 text-center">{gradeBadge(s.q1)}</td>
                <td className="px-2 py-1.5 text-center">{gradeBadge(s.q2)}</td>
                <td className="px-2 py-1.5 text-center">{gradeBadge(s.q3)}</td>
                <td className="px-2 py-1.5 text-center">{gradeBadge(s.q4)}</td>
                <td className="px-2 py-1.5 text-center">{gradeBadge(s.yearAvg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.teacherComments && (
        <div className="bg-[#FBF5E6] border border-[#C9A84C] rounded-lg p-3 text-[11px] text-[#7A5800]">
          <strong>Teacher Comments:</strong> {data.teacherComments as string}
        </div>
      )}
      <SchedBlock grade={grade} mathLvl="On-Level" readLvl="On-Level" source="Upload MAP Growth for precise subject-level placement" />
    </>
  );
}
