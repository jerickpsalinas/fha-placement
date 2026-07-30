import { getCurrentStaff } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LevelBadge } from "@/components/ui/Badge";
import { getStudent, getScheduleBlocks, getSupportPlans } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PATHWAY_LABELS } from "@/types";
import type { PlacementLevel } from "@/lib/placement/norms";
import {
  addScheduleBlock, submitForApproval, approveSchedule, rejectSchedule,
} from "@/app/students/[id]/schedule/actions";

const COURSE_CATEGORIES = [
  "core", "honors", "intervention", "credit_recovery", "elective",
  "steam", "edge", "act_sat_prep", "online", "dual_enrollment", "lunch",
];

export default async function ScheduleDetailPage({
  params,
}: { params: Promise<{ id: string; scheduleId: string }> }) {
  const { id, scheduleId } = await params;
  const staff = await getCurrentStaff();
  const student = await getStudent(id);
  if (!student) notFound();

  const supabase = await createClient();
  const { data: schedule } = await supabase.from("schedules").select("*").eq("id", scheduleId).single();
  if (!schedule) notFound();

  const blocks = await getScheduleBlocks(schedule.id);
  const supportPlans = staff.role === "teacher" ? [] : await getSupportPlans(student.id);
  const schedulingNotes = supportPlans.flatMap((sp) => sp.accommodations.filter((a) => a.affects_scheduling));

  async function addBlockAction(formData: FormData) {
    "use server";
    await addScheduleBlock(schedule!.id, student!.id, formData);
  }
  async function submitAction() {
    "use server";
    await submitForApproval(schedule!.id, student!.id);
  }
  async function approveAction(formData: FormData) {
    "use server";
    await approveSchedule(schedule!.id, student!.id, String(formData.get("admin_notes") ?? ""));
  }
  async function rejectAction(formData: FormData) {
    "use server";
    await rejectSchedule(schedule!.id, student!.id, String(formData.get("reason") ?? ""));
  }

  const canEdit = ["admin", "director", "counselor"].includes(staff.role) && schedule.status !== "approved";
  const canApprove = ["admin", "director"].includes(staff.role) && schedule.status === "pending_approval";
  const interventionBlocks = blocks.filter((b) => b.course_category === "intervention");

  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <div className="flex-1 bg-cream">
        <PageHeader
          title={`Schedule — ${student.first_name} ${student.last_name}`}
          subtitle={`${schedule.school_year} · ${schedule.status.replace("_", " ")}`}
        />
        <main className="p-8 max-w-3xl space-y-6">
          <Card className="p-6">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-navy mb-3">Pathways</h2>
            <div className="flex flex-wrap gap-2">
              {schedule.pathways.map((p: string) => (
                <span key={p} className="text-xs bg-cream px-2 py-1 rounded text-navy">{PATHWAY_LABELS[p as keyof typeof PATHWAY_LABELS] ?? p}</span>
              ))}
            </div>
          </Card>

          {interventionBlocks.length > 0 ? (
            <div className="bg-wholegroup-bg border border-wholegroup/30 rounded-lg p-4 text-sm text-wholegroup">
              <p className="font-semibold mb-1">
                Intervention placements ({interventionBlocks.length})
              </p>
              <p className="mb-2">
                This student was flagged for academic support. The reasoning is in &ldquo;How this draft was built&rdquo; below.
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                {interventionBlocks.map((b) => (
                  <li key={b.id}>
                    <span className="font-medium">{b.course_name}</span>
                    {b.notes ? ` — ${b.notes}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-cream border border-hairline rounded-lg p-4 text-sm text-navy/60">
              <p className="font-medium text-navy">No intervention placements in this schedule.</p>
              <p>
                The generator found no support triggers (GPA, test scores, credit pace, IEP/504). If you expected
                intervention here, check that the student&apos;s test scores and GPA are on file.
              </p>
            </div>
          )}

          {schedule.admin_notes && (
            <Card className="p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-wide text-navy mb-3">How this draft was built</h2>
              <pre className="whitespace-pre-wrap text-xs text-navy/70 font-sans leading-relaxed">
                {schedule.admin_notes}
              </pre>
            </Card>
          )}

          {schedulingNotes.length > 0 && (
            <div className="bg-onlevel-bg border border-onlevel/30 rounded-lg p-4 text-sm text-onlevel">
              <p className="font-medium mb-1">Accommodations affecting this schedule</p>
              <ul className="list-disc list-inside space-y-0.5">
                {schedulingNotes.map((a) => <li key={a.id}>{a.description}</li>)}
              </ul>
            </div>
          )}

          <Card className="p-6">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-navy mb-3">Course Blocks</h2>
            {blocks.length === 0 ? (
              <p className="text-sm text-navy/40 mb-4">No blocks added yet.</p>
            ) : (
              <table className="w-full text-sm mb-4">
                <thead className="text-[10px] uppercase tracking-wide text-navy/40">
                  <tr>
                    <th className="text-left px-2 py-1.5">Block</th>
                    <th className="text-left px-2 py-1.5">Course</th>
                    <th className="text-left px-2 py-1.5">Level</th>
                    <th className="text-left px-2 py-1.5">Category</th>
                    <th className="text-left px-2 py-1.5">Online</th>
                    <th className="text-left px-2 py-1.5">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((b) => (
                    <tr key={b.id} className="border-t border-hairline/60">
                      <td className="px-2 py-1.5 text-navy">{b.block_label}</td>
                      <td className="px-2 py-1.5 text-navy">{b.course_name}</td>
                      <td className="px-2 py-1.5">
                        {b.placement_level ? <LevelBadge level={b.placement_level as PlacementLevel} /> : "—"}
                      </td>
                      <td className="px-2 py-1.5 capitalize text-navy">{b.course_category.replace("_", " ")}</td>
                      <td className="px-2 py-1.5 text-navy">{b.is_online ? "Yes" : "—"}</td>
                      <td className="px-2 py-1.5 text-navy/50">{b.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {canEdit && (
              <form action={addBlockAction} className="grid grid-cols-2 gap-3 border-t border-hairline pt-4">
                <input name="block_label" placeholder="Block label (e.g. Period 1)" required className="border border-hairline rounded px-3 py-2 text-sm" />
                <input name="course_name" placeholder="Course name" required className="border border-hairline rounded px-3 py-2 text-sm" />
                <select name="course_category" className="border border-hairline rounded px-3 py-2 text-sm">
                  {COURSE_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm text-navy">
                  <input type="checkbox" name="is_online" className="rounded border-hairline" /> Online course
                </label>
                <input name="notes" placeholder="Notes (optional)" className="border border-hairline rounded px-3 py-2 text-sm col-span-2" />
                <Button type="submit" className="col-span-2">+ Add Block</Button>
              </form>
            )}
          </Card>

          {["admin", "director", "counselor"].includes(staff.role) && schedule.status === "draft" && (
            <form action={submitAction}>
              <Button type="submit">Submit for Admin Approval</Button>
            </form>
          )}

          {canApprove && (
            <Card className="p-6 space-y-4">
              <h2 className="text-[11px] font-bold uppercase tracking-wide text-navy">Administrator Review</h2>
              <form action={approveAction} className="space-y-2">
                <textarea name="admin_notes" placeholder="Admin notes (optional)" className="w-full border border-hairline rounded px-3 py-2 text-sm" rows={2} />
                <Button type="submit">Approve Schedule</Button>
              </form>
              <form action={rejectAction} className="space-y-2">
                <textarea name="reason" placeholder="Reason for rejection" required className="w-full border border-hairline rounded px-3 py-2 text-sm" rows={2} />
                <button type="submit" className="bg-intervention text-white text-xs font-bold px-5 py-2.5 rounded hover:opacity-90">
                  Reject &amp; Send Back
                </button>
              </form>
            </Card>
          )}

          {schedule.status === "approved" && (
            <p className="text-sm text-advanced font-medium">
              Approved {schedule.approved_at ? `on ${new Date(schedule.approved_at).toLocaleDateString()}` : ""}.
              This schedule is locked.
            </p>
          )}
          {schedule.status === "rejected" && schedule.rejection_reason && (
            <p className="text-sm text-intervention">Rejected: {schedule.rejection_reason}</p>
          )}
        </main>
      </div>
    </div>
  );
}
