import { getCurrentStaff } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import {
  getStudent, getTestScores, getTranscript, getSupportPlans,
  getOnlineLearningRecords, getGraduationRequirements, getSchedules, getEdgePathways,
  getSteamModules, getSteamAssignments,
} from "@/lib/queries";
import { runGraduationAudit } from "@/lib/audit/graduation";
import { recommendEdgePathways } from "@/lib/recommendations/edge";
import { recommendSteamModules, gradeBandForStudent } from "@/lib/recommendations/steam";
import { EDGE_PATHWAY_LABELS } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DocumentUpload } from "./support-plans/DocumentUpload";
import { AddSupportPlan } from "./support-plans/AddSupportPlan";

const CURRENT_SCHOOL_YEAR = "2026-2027";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getCurrentStaff();
  const student = await getStudent(id);
  if (!student) notFound();

  const [testScores, transcript, supportPlans, onlineRecords, requirements, schedules, edgePathways, steamModules, steamAssignments] =
    await Promise.all([
      getTestScores(student.id),
      getTranscript(student.id),
      staff.role === "teacher" ? Promise.resolve([]) : getSupportPlans(student.id),
      getOnlineLearningRecords(student.id),
      getGraduationRequirements(CURRENT_SCHOOL_YEAR),
      getSchedules(student.id),
      getEdgePathways(student.id),
      getSteamModules(),
      getSteamAssignments(student.id),
    ]);

  const audit = runGraduationAudit(transcript, requirements, onlineRecords, CURRENT_SCHOOL_YEAR, student.gpa);
  const edgeRecs = recommendEdgePathways(student);
  const steamRecs = recommendSteamModules(student, steamModules);
  const schedulingAccommodations = supportPlans.flatMap((sp) =>
    sp.accommodations.filter((a) => a.affects_scheduling)
  );

  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <main className="flex-1 p-8 max-w-5xl space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy">
              {student.first_name} {student.last_name}
            </h1>
            <p className="text-sm text-gray-500">
              Grade {student.grade_level} · {student.enrollment_type === "public_transfer" ? "Public school transfer" : "Continuing private school student"}
            </p>
          </div>
          <div className="flex gap-2">
            {staff.role !== "teacher" && staff.role !== "read_only" && (
              <Link
                href={`/students/${student.id}/report`}
                className="border border-navy text-navy text-sm font-medium px-4 py-2 rounded hover:bg-navy/5"
              >
                Export Report
              </Link>
            )}
            {(staff.role === "admin" || staff.role === "counselor") && (
              <Link
                href={`/students/${student.id}/import-pdf`}
                className="border border-navy text-navy text-sm font-medium px-4 py-2 rounded hover:bg-navy/5"
              >
                Import Transcript PDF
              </Link>
            )}
            <Link
              href={`/students/${student.id}/schedule/new`}
              className="bg-navy text-white text-sm font-medium px-4 py-2 rounded hover:bg-navy/90"
            >
              Build Schedule
            </Link>
          </div>
        </div>

        {/* STUDENT PROFILE */}
        <Section title="Student Profile">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Stat label="GPA" value={student.gpa?.toFixed(2) ?? "—"} />
            <Stat label="Credits Earned" value={String(student.credits_earned)} />
            <Stat label="IEP" value={student.has_iep ? "Yes" : "No"} />
            <Stat label="504 Plan" value={student.has_504 ? "Yes" : "No"} />
            <Stat label="Dual Enrollment" value={student.dual_enrollment_active ? "Active" : "Not active"} />
            <Stat label="Career Goals" value={student.career_goals ?? "Not on file"} />
            <Stat label="College Goals" value={student.college_goals ?? "Not on file"} />
          </div>
        </Section>

        {/* TESTING HISTORY */}
        <Section title="Testing History">
          {testScores.length === 0 ? (
            <EmptyNote text="No test scores on file yet. Add via manual entry or CSV import." />
          ) : (
            <SimpleTable
              headers={["Type", "Subject", "Score", "Percentile", "Date", "Year"]}
              rows={testScores.map((t) => [t.test_type, t.subject ?? "—", t.score?.toString() ?? "—", t.percentile?.toString() ?? "—", t.test_date, t.school_year])}
            />
          )}
        </Section>

        {/* IEP / 504 - hidden entirely from teachers at the data level via RLS;
            this UI block simply won't render meaningful data for that role. */}
        {staff.role !== "teacher" && (
          <Section title="IEP / 504 Plans">
            {supportPlans.length === 0 ? (
              <EmptyNote text="No support plans on file." />
            ) : (
              <div className="space-y-3">
                {supportPlans.map((sp) => (
                  <div key={sp.id} className="border border-gray-200 rounded p-4">
                    <p className="font-medium text-sm mb-2">{sp.plan_type} Plan {sp.effective_date ? `— effective ${sp.effective_date}` : ""}</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {sp.accommodations.map((a) => (
                        <li key={a.id}>
                          <span className="font-medium capitalize">{a.category}:</span> {a.description}
                          {a.affects_scheduling && <span className="ml-2 text-xs text-gold font-medium">affects scheduling</span>}
                        </li>
                      ))}
                    </ul>
                    <DocumentUpload
                      planId={sp.id}
                      studentId={student.id}
                      existingPath={sp.document_url}
                    />
                  </div>
                ))}
              </div>
            )}
            {["admin", "counselor"].includes(staff.role) && (
              <AddSupportPlan studentId={student.id} />
            )}
          </Section>
        )}

        {/* GRADUATION AUDIT */}
        <Section title={`Graduation Analysis (${CURRENT_SCHOOL_YEAR})`}>
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <Stat label="Credits Required" value={audit.totalCreditsRequired.toFixed(1)} />
            <Stat label="Credits Earned" value={audit.totalCreditsEarned.toFixed(1)} />
            <Stat label="Credits Remaining" value={audit.totalCreditsRemaining.toFixed(1)} />
          </div>
          <SimpleTable
            headers={["Subject Area", "Required", "Earned", "Remaining", "Status"]}
            rows={audit.subjectAreas.map((s) => [
              s.subjectArea, s.creditsRequired.toFixed(1), s.creditsEarned.toFixed(1), s.creditsRemaining.toFixed(1),
              s.satisfied ? "Satisfied" : "Needs attention",
            ])}
          />
          <div className="mt-4 text-sm">
            <p className="font-medium mb-1">Online Learning Requirement</p>
            <p className={audit.onlineLearningRequirementMet ? "text-green-700" : "text-amber-700"}>
              {audit.onlineLearningRequirementMet ? "Met" : "Not yet met — recommend an approved online course (e.g. FLVS elective or credit recovery)."}
            </p>
          </div>
          {audit.deficiencies.length > 0 && (
            <Callout color="amber" title="Deficiencies Identified">
              <ul className="list-disc list-inside space-y-0.5">
                {audit.deficiencies.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </Callout>
          )}
          {audit.scholarshipReadinessFlags.length > 0 && (
            <Callout color="blue" title="Scholarship Readiness Notes">
              <ul className="list-disc list-inside space-y-0.5">
                {audit.scholarshipReadinessFlags.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </Callout>
          )}
        </Section>

        {/* EDGE RECOMMENDATIONS */}
        <Section title="EDGE Program Recommendations">
          {edgeRecs.length === 0 ? (
            <EmptyNote text="No EDGE pathway matches yet — add career/college goals or interests to generate suggestions." />
          ) : (
            <div className="space-y-2">
              {edgeRecs.map((r) => {
                const alreadyTracked = edgePathways.find((e) => e.pathway === r.pathway);
                return (
                  <div key={r.pathway} className="flex items-center justify-between border border-gray-200 rounded px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">{EDGE_PATHWAY_LABELS[r.pathway]}</p>
                      <p className="text-gray-500 text-xs">{r.reason}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                      {alreadyTracked ? alreadyTracked.status.replace("_", " ") : "Suggested — not yet confirmed"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* STEAM RECOMMENDATIONS */}
        <Section title={`STEAM Program Recommendations (${gradeBandForStudent(student)} band)`}>
          {steamRecs.length === 0 ? (
            <EmptyNote text="No STEAM modules configured for this student's grade band yet. Admins can add modules in reference data." />
          ) : (
            <div className="space-y-2">
              {steamRecs.map((r) => {
                const alreadyAssigned = steamAssignments.find((a) => a.steam_module_id === r.module.id);
                return (
                  <div key={r.module.id} className="flex items-center justify-between border border-gray-200 rounded px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">
                        {r.module.month} — {r.module.theme}
                        {r.currentMonth && <span className="ml-2 text-xs text-gold font-medium">this month</span>}
                      </p>
                      {r.module.description && <p className="text-gray-500 text-xs">{r.module.description}</p>}
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                      {alreadyAssigned ? (alreadyAssigned.completed ? "completed" : "assigned") : "Suggested — not yet assigned"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* ADMINISTRATIVE NOTES */}
        <Section title="Administrative Notes">
          {schedulingAccommodations.length === 0 ? (
            <EmptyNote text="No scheduling-relevant accommodations on file." />
          ) : (
            <Callout color="blue" title="Accommodations Affecting Scheduling">
              <ul className="list-disc list-inside space-y-0.5">
                {schedulingAccommodations.map((a) => <li key={a.id}>{a.description}</li>)}
              </ul>
            </Callout>
          )}
        </Section>

        {/* SCHEDULES */}
        <Section title="Schedules">
          {schedules.length === 0 ? (
            <EmptyNote text="No schedules built yet." />
          ) : (
            <div className="space-y-2">
              {schedules.map((s) => (
                <Link
                  key={s.id}
                  href={`/students/${student.id}/schedule/${s.id}`}
                  className="flex items-center justify-between border border-gray-200 rounded px-4 py-3 text-sm hover:bg-gray-50"
                >
                  <span>{s.school_year} — {s.pathways.length} pathway(s)</span>
                  <StatusBadge status={s.status} />
                </Link>
              ))}
            </div>
          )}
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-navy mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-sm text-gray-400">{text}</p>;
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-xs uppercase text-gray-400">
        <tr>{headers.map((h) => <th key={h} className="text-left px-2 py-1.5 border-b border-gray-100">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-gray-50">
            {row.map((cell, j) => <td key={j} className="px-2 py-1.5">{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Callout({ color, title, children }: { color: "amber" | "blue"; title: string; children: React.ReactNode }) {
  const styles = color === "amber" ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-blue-50 border-blue-200 text-blue-900";
  return (
    <div className={`mt-4 border rounded p-4 text-sm ${styles}`}>
      <p className="font-medium mb-1">{title}</p>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    pending_approval: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  return <span className={`text-xs px-2 py-1 rounded font-medium ${styles[status] ?? ""}`}>{status.replace("_", " ")}</span>;
}
