import { getCurrentStaff } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { getStudent, getScheduleBlocks, getSupportPlans } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PATHWAY_LABELS } from "@/types";
import {
  addScheduleBlock, submitForApproval, approveSchedule, rejectSchedule,
} from "@/app/students/[id]/schedule/actions";

const COURSE_CATEGORIES = [
  "core", "honors", "intervention", "credit_recovery", "elective",
  "steam", "edge", "act_sat_prep", "online", "dual_enrollment",
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

  const canEdit = (staff.role === "admin" || staff.role === "counselor") && schedule.status !== "approved";
  const canApprove = staff.role === "admin" && schedule.status === "pending_approval";

  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <main className="flex-1 p-8 max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            Schedule — {student.first_name} {student.last_name}
          </h1>
          <p className="text-sm text-gray-500">{schedule.school_year} · <StatusLabel status={schedule.status} /></p>
        </div>

        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold text-navy mb-3">Pathways</h2>
          <div className="flex flex-wrap gap-2">
            {schedule.pathways.map((p: string) => (
              <span key={p} className="text-xs bg-gray-100 px-2 py-1 rounded">{PATHWAY_LABELS[p as keyof typeof PATHWAY_LABELS] ?? p}</span>
            ))}
          </div>
        </section>

        {schedulingNotes.length > 0 && (
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <p className="font-medium mb-1">Accommodations affecting this schedule</p>
            <ul className="list-disc list-inside space-y-0.5">
              {schedulingNotes.map((a) => <li key={a.id}>{a.description}</li>)}
            </ul>
          </section>
        )}

        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold text-navy mb-3">Course Blocks</h2>
          {blocks.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">No blocks added yet.</p>
          ) : (
            <table className="w-full text-sm mb-4">
              <thead className="text-xs uppercase text-gray-400">
                <tr>
                  <th className="text-left px-2 py-1.5">Block</th>
                  <th className="text-left px-2 py-1.5">Course</th>
                  <th className="text-left px-2 py-1.5">Category</th>
                  <th className="text-left px-2 py-1.5">Online</th>
                  <th className="text-left px-2 py-1.5">Notes</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((b) => (
                  <tr key={b.id} className="border-t border-gray-100">
                    <td className="px-2 py-1.5">{b.block_label}</td>
                    <td className="px-2 py-1.5">{b.course_name}</td>
                    <td className="px-2 py-1.5 capitalize">{b.course_category.replace("_", " ")}</td>
                    <td className="px-2 py-1.5">{b.is_online ? "Yes" : "—"}</td>
                    <td className="px-2 py-1.5 text-gray-500">{b.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {canEdit && (
            <form action={addBlockAction} className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
              <input name="block_label" placeholder="Block label (e.g. Period 1)" required className="border border-gray-300 rounded px-3 py-2 text-sm" />
              <input name="course_name" placeholder="Course name" required className="border border-gray-300 rounded px-3 py-2 text-sm" />
              <select name="course_category" className="border border-gray-300 rounded px-3 py-2 text-sm">
                {COURSE_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_online" className="rounded border-gray-300" /> Online course
              </label>
              <input name="notes" placeholder="Notes (optional)" className="border border-gray-300 rounded px-3 py-2 text-sm col-span-2" />
              <button type="submit" className="col-span-2 bg-navy text-white text-sm font-medium px-4 py-2 rounded hover:bg-navy/90">
                + Add Block
              </button>
            </form>
          )}
        </section>

        {(staff.role === "admin" || staff.role === "counselor") && schedule.status === "draft" && (
          <form action={submitAction}>
            <button type="submit" className="bg-gold text-white text-sm font-medium px-5 py-2.5 rounded hover:opacity-90">
              Submit for Admin Approval
            </button>
          </form>
        )}

        {canApprove && (
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-navy">Administrator Review</h2>
            <form action={approveAction} className="space-y-2">
              <textarea name="admin_notes" placeholder="Admin notes (optional)" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" rows={2} />
              <button type="submit" className="bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded hover:bg-green-700">
                Approve Schedule
              </button>
            </form>
            <form action={rejectAction} className="space-y-2">
              <textarea name="reason" placeholder="Reason for rejection" required className="w-full border border-gray-300 rounded px-3 py-2 text-sm" rows={2} />
              <button type="submit" className="bg-red-600 text-white text-sm font-medium px-5 py-2.5 rounded hover:bg-red-700">
                Reject &amp; Send Back
              </button>
            </form>
          </section>
        )}

        {schedule.status === "approved" && (
          <p className="text-sm text-green-700 font-medium">
            Approved {schedule.approved_at ? `on ${new Date(schedule.approved_at).toLocaleDateString()}` : ""}.
            This schedule is locked.
          </p>
        )}
        {schedule.status === "rejected" && schedule.rejection_reason && (
          <p className="text-sm text-red-700">Rejected: {schedule.rejection_reason}</p>
        )}
      </main>
    </div>
  );
}

function StatusLabel({ status }: { status: string }) {
  return <span className="capitalize">{status.replace("_", " ")}</span>;
}
