import { requireRole } from "@/lib/auth";
import {
  getStudent, getTestScores, getTranscript, getSupportPlans,
  getOnlineLearningRecords, getGraduationRequirements, getSchedules,
  getSteamModules,
} from "@/lib/queries";
import { runGraduationAudit } from "@/lib/audit/graduation";
import { recommendEdgePathways } from "@/lib/recommendations/edge";
import { recommendSteamModules, gradeBandForStudent } from "@/lib/recommendations/steam";
import { EDGE_PATHWAY_LABELS, PATHWAY_LABELS } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PrintButton } from "./PrintButton";

const CURRENT_SCHOOL_YEAR = "2026-2027";

export default async function StudentReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Reports include graduation + support context, so restrict to non-teacher staff.
  const staff = await requireRole(["admin", "director", "counselor"]);
  const student = await getStudent(id);
  if (!student) notFound();

  const [testScores, transcript, supportPlans, onlineRecords, requirements, schedules, steamModules] =
    await Promise.all([
      getTestScores(student.id),
      getTranscript(student.id),
      getSupportPlans(student.id),
      getOnlineLearningRecords(student.id),
      getGraduationRequirements(CURRENT_SCHOOL_YEAR),
      getSchedules(student.id),
      getSteamModules(),
    ]);

  const audit = runGraduationAudit(transcript, requirements, onlineRecords, CURRENT_SCHOOL_YEAR, student.gpa);
  const edgeRecs = recommendEdgePathways(student);
  const steamRecs = recommendSteamModules(student, steamModules);
  const schedulingAccommodations = supportPlans.flatMap((sp) =>
    sp.accommodations.filter((a) => a.affects_scheduling)
  );
  const generatedOn = new Date().toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="report-root mx-auto max-w-3xl p-8 print:p-0 text-gray-900">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .report-root { max-width: 100% !important; }
          .report-section { break-inside: avoid; }
          @page { margin: 1.5cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/students/${student.id}`} className="text-sm text-blue-600 hover:underline">
          ← Back to student
        </Link>
        <PrintButton />
      </div>

      {/* HEADER */}
      <header className="border-b-2 border-navy pb-4 mb-6">
        <h1 className="text-2xl font-bold text-navy">Father&apos;s H.A.R.B.O.R. Academy</h1>
        <p className="text-sm text-gray-500">Student Placement &amp; Graduation Report</p>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-lg font-semibold">{student.first_name} {student.last_name}</p>
            <p className="text-sm text-gray-600">
              Grade {student.grade_level} · {student.enrollment_type === "public_transfer" ? "Public school transfer" : "Continuing private school student"}
            </p>
          </div>
          <p className="text-xs text-gray-400">Generated {generatedOn} · {CURRENT_SCHOOL_YEAR}</p>
        </div>
      </header>

      {/* PROFILE */}
      <ReportSection title="Student Profile">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Field label="GPA" value={student.gpa?.toFixed(2) ?? "—"} />
          <Field label="Credits Earned" value={String(student.credits_earned)} />
          <Field label="IEP" value={student.has_iep ? "Yes" : "No"} />
          <Field label="504 Plan" value={student.has_504 ? "Yes" : "No"} />
          <Field label="Dual Enrollment" value={student.dual_enrollment_active ? "Active" : "Not active"} />
          <Field label="Career Goals" value={student.career_goals ?? "Not on file"} />
          <Field label="College Goals" value={student.college_goals ?? "Not on file"} />
        </dl>
      </ReportSection>

      {/* GRADUATION ANALYSIS */}
      <ReportSection title="Graduation Analysis">
        <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
          <Field label="Credits Required" value={audit.totalCreditsRequired.toFixed(1)} />
          <Field label="Credits Earned" value={audit.totalCreditsEarned.toFixed(1)} />
          <Field label="Credits Remaining" value={audit.totalCreditsRemaining.toFixed(1)} />
        </div>
        <ReportTable
          headers={["Subject Area", "Required", "Earned", "Remaining", "Status"]}
          rows={audit.subjectAreas.map((s) => [
            s.subjectArea, s.creditsRequired.toFixed(1), s.creditsEarned.toFixed(1),
            s.creditsRemaining.toFixed(1), s.satisfied ? "Satisfied" : "Needs attention",
          ])}
        />
        <p className="text-sm mt-3">
          <span className="font-medium">Online Learning Requirement: </span>
          {audit.onlineLearningRequirementMet ? "Met" : "Not yet met"}
        </p>
        {audit.deficiencies.length > 0 && (
          <div className="mt-3">
            <p className="font-medium text-sm">Deficiencies Identified</p>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {audit.deficiencies.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>
        )}
        {audit.scholarshipReadinessFlags.length > 0 && (
          <div className="mt-3">
            <p className="font-medium text-sm">Scholarship Readiness Notes</p>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {audit.scholarshipReadinessFlags.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}
      </ReportSection>

      {/* TESTING */}
      <ReportSection title="Testing History">
        {testScores.length === 0 ? (
          <p className="text-sm text-gray-400">No test scores on file.</p>
        ) : (
          <ReportTable
            headers={["Type", "Subject", "Score", "Percentile", "Date", "Year"]}
            rows={testScores.map((t) => [
              t.test_type, t.subject ?? "—", t.score?.toString() ?? "—",
              t.percentile?.toString() ?? "—", t.test_date, t.school_year,
            ])}
          />
        )}
      </ReportSection>

      {/* PATHWAY RECOMMENDATIONS */}
      <ReportSection title="Program Recommendations">
        <p className="font-medium text-sm mb-1">EDGE Pathways</p>
        {edgeRecs.length === 0 ? (
          <p className="text-sm text-gray-400 mb-3">No EDGE matches yet.</p>
        ) : (
          <ul className="list-disc list-inside text-sm text-gray-700 mb-3">
            {edgeRecs.map((r) => <li key={r.pathway}><span className="font-medium">{EDGE_PATHWAY_LABELS[r.pathway]}</span> — {r.reason}</li>)}
          </ul>
        )}
        <p className="font-medium text-sm mb-1">STEAM Modules ({gradeBandForStudent(student)} band)</p>
        {steamRecs.length === 0 ? (
          <p className="text-sm text-gray-400">No STEAM modules configured for this grade band.</p>
        ) : (
          <ul className="list-disc list-inside text-sm text-gray-700">
            {steamRecs.map((r) => <li key={r.module.id}>{r.module.month} — {r.module.theme}{r.currentMonth ? " (this month)" : ""}</li>)}
          </ul>
        )}
      </ReportSection>

      {/* SCHEDULING NOTES */}
      <ReportSection title="Scheduling Accommodations">
        {schedulingAccommodations.length === 0 ? (
          <p className="text-sm text-gray-400">No scheduling-relevant accommodations on file.</p>
        ) : (
          <ul className="list-disc list-inside text-sm text-gray-700">
            {schedulingAccommodations.map((a) => <li key={a.id}>{a.description}</li>)}
          </ul>
        )}
      </ReportSection>

      {/* SCHEDULES */}
      <ReportSection title="Schedules">
        {schedules.length === 0 ? (
          <p className="text-sm text-gray-400">No schedules on file.</p>
        ) : (
          <ul className="text-sm text-gray-700 space-y-1">
            {schedules.map((s) => (
              <li key={s.id}>
                {s.school_year} — {s.pathways.map((p) => PATHWAY_LABELS[p] ?? p).join(", ") || "no pathways"} · <span className="capitalize">{s.status.replace("_", " ")}</span>
              </li>
            ))}
          </ul>
        )}
      </ReportSection>

      <footer className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400">
        This report is generated from current records and is for internal academic planning use.
        Graduation determinations must be confirmed against official Florida requirements for {CURRENT_SCHOOL_YEAR}.
      </footer>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="report-section mb-6">
      <h2 className="text-base font-semibold text-navy border-b border-gray-200 pb-1 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400 uppercase tracking-wide">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function ReportTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr>{headers.map((h) => <th key={h} className="text-left px-2 py-1 border-b border-gray-300 text-xs uppercase text-gray-500">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>{row.map((cell, j) => <td key={j} className="px-2 py-1 border-b border-gray-100">{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}
