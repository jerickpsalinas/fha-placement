import { getCurrentStaff } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { LevelBadge } from "@/components/ui/Badge";
import {
  getStudent, getTestScores, getTranscript, getSupportPlans,
  getOnlineLearningRecords, getGraduationRequirements, getSchedules, getEdgePathways,
  getSteamModules, getSteamAssignments, getGraduationRequirementYears,
} from "@/lib/queries";
import { runGraduationAudit } from "@/lib/audit/graduation";
import { recommendEdgePathways } from "@/lib/recommendations/edge";
import { recommendSteamModules, gradeBandForStudent } from "@/lib/recommendations/steam";
import { EDGE_PATHWAY_LABELS } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DocumentUpload } from "./support-plans/DocumentUpload";
import { AddSupportPlan } from "./support-plans/AddSupportPlan";
import { placeStudent } from "@/lib/placement/engine";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getCurrentStaff();
  const student = await getStudent(id);
  if (!student) notFound();

  const requirementYears = await getGraduationRequirementYears();
  const schoolYear = requirementYears[0] ?? "2026-2027";

  const [testScores, transcript, supportPlans, onlineRecords, requirements, schedules, edgePathways, steamModules, steamAssignments] =
    await Promise.all([
      getTestScores(student.id),
      getTranscript(student.id),
      staff.role === "teacher" ? Promise.resolve([]) : getSupportPlans(student.id),
      getOnlineLearningRecords(student.id),
      getGraduationRequirements(schoolYear),
      getSchedules(student.id),
      getEdgePathways(student.id),
      getSteamModules(),
      getSteamAssignments(student.id),
    ]);

  const audit = runGraduationAudit(transcript, requirements, onlineRecords, schoolYear, student.gpa);
  const edgeRecs = recommendEdgePathways(student);
  const steamRecs = recommendSteamModules(student, steamModules);
  const { placements, warnings: placementWarnings } = placeStudent(student, testScores);
  const schedulingAccommodations = supportPlans.flatMap((sp) =>
    sp.accommodations.filter((a) => a.affects_scheduling)
  );

  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <div className="flex-1 bg-cream">
        <PageHeader
          title={`${student.first_name} ${student.last_name}`}
          subtitle={`Grade ${student.grade_level} · ${student.enrollment_type === "public_transfer" ? "Public school transfer" : "Continuing private school student"}`}
          action={
            <div className="flex gap-2">
              {staff.role !== "teacher" && staff.role !== "read_only" && (
                <LinkButton href={`/students/${student.id}/report`} variant="secondary">Export Report</LinkButton>
              )}
              {(staff.role === "admin" || staff.role === "counselor") && (
                <LinkButton href={`/students/${student.id}/import-pdf`} variant="secondary">Import Transcript PDF</LinkButton>
              )}
              <LinkButton href={`/students/${student.id}/schedule/new`}>Build Schedule</LinkButton>
            </div>
          }
        />
        <main className="p-8 max-w-5xl space-y-6">
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
                    <div key={sp.id} className="border border-hairline rounded p-4">
                      <p className="font-semibold text-sm text-navy mb-2">{sp.plan_type} Plan {sp.effective_date ? `— effective ${sp.effective_date}` : ""}</p>
                      <ul className="text-sm text-navy/70 space-y-1">
                        {sp.accommodations.map((a) => (
                          <li key={a.id}>
                            <span className="font-medium capitalize text-navy">{a.category}:</span> {a.description}
                            {a.affects_scheduling && <span className="ml-2 text-xs text-gold font-bold">affects scheduling</span>}
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

          {/* CURRENT PLACEMENT */}
          <Section title="Current Placement">
            {placementWarnings.length > 0 && (
              <div className="bg-wholegroup-bg border border-wholegroup/30 rounded p-3 text-sm text-wholegroup mb-4">
                {placementWarnings.map((w, i) => <p key={i}>{w}</p>)}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {placements.filter((p) => p.level !== "whole_group").map((p) => {
                const cardStyles: Record<string, string> = {
                  intervention: "border-l-intervention bg-intervention-bg",
                  on_level: "border-l-onlevel bg-onlevel-bg",
                  advanced: "border-l-advanced bg-advanced-bg",
                };
                return (
                  <div key={p.subject} className={`border-l-[3px] rounded-lg p-3 ${cardStyles[p.level] ?? "border-l-hairline bg-white"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-navy">{p.subject}</span>
                      <LevelBadge level={p.level} />
                    </div>
                    <p className="text-sm text-navy/80">{p.courseName}</p>
                    <p className="text-xs text-navy/50 mt-1">{p.why}</p>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* GRADUATION AUDIT */}
          <Section title={`Graduation Analysis (${schoolYear})`}>
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
              <p className="font-semibold text-navy mb-1">Online Learning Requirement</p>
              <p className={audit.onlineLearningRequirementMet ? "text-advanced" : "text-wholegroup"}>
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
                    <div key={r.pathway} className="flex items-center justify-between border border-hairline rounded px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-navy">{EDGE_PATHWAY_LABELS[r.pathway]}</p>
                        <p className="text-navy/50 text-xs">{r.reason}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-cream text-navy/60 font-medium">
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
                    <div key={r.module.id} className="flex items-center justify-between border border-hairline rounded px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-navy">
                          {r.module.month} — {r.module.theme}
                          {r.currentMonth && <span className="ml-2 text-xs text-gold font-bold">this month</span>}
                        </p>
                        {r.module.description && <p className="text-navy/50 text-xs">{r.module.description}</p>}
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-cream text-navy/60 font-medium">
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
                    className="flex items-center justify-between border border-hairline rounded px-4 py-3 text-sm hover:bg-cream"
                  >
                    <span className="text-navy">{s.school_year} — {s.pathways.length} pathway(s)</span>
                    <StatusBadge status={s.status} />
                  </Link>
                ))}
              </div>
            )}
          </Section>
        </main>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="text-[11px] font-bold uppercase tracking-wide text-navy mb-4">{title}</h2>
      {children}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] text-navy/40 uppercase tracking-wide">{label}</p>
      <p className="font-medium text-navy">{value}</p>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-sm text-navy/40">{text}</p>;
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-[10px] uppercase tracking-wide text-navy/40">
        <tr>{headers.map((h) => <th key={h} className="text-left px-2 py-1.5 border-b border-hairline">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-hairline/60">
            {row.map((cell, j) => <td key={j} className="px-2 py-1.5 text-navy">{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Callout({ color, title, children }: { color: "amber" | "blue"; title: string; children: React.ReactNode }) {
  const styles = color === "amber" ? "bg-wholegroup-bg border-wholegroup/30 text-wholegroup" : "bg-onlevel-bg border-onlevel/30 text-onlevel";
  return (
    <div className={`mt-4 border rounded p-4 text-sm ${styles}`}>
      <p className="font-semibold mb-1">{title}</p>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-cream text-navy/60",
    pending_approval: "bg-wholegroup-bg text-wholegroup",
    approved: "bg-advanced-bg text-advanced",
    rejected: "bg-intervention-bg text-intervention",
  };
  return <span className={`text-xs px-2 py-1 rounded font-medium ${styles[status] ?? ""}`}>{status.replace("_", " ")}</span>;
}
