import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getStudent, getGraduationRequirementYears } from "@/lib/queries";
import { notFound } from "next/navigation";
import { PATHWAY_LABELS, type AcademicPathway } from "@/types";
import { createDraftSchedule, generateAndCreateSchedule } from "@/app/students/[id]/schedule/actions";

export default async function NewSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireRole(["admin", "director", "counselor"]);
  const student = await getStudent(id);
  if (!student) notFound();

  // Only years with configured graduation requirements can produce gap-based
  // schedules — offering a free-text year silently yielded empty drafts.
  const requirementYears = await getGraduationRequirementYears();
  const defaultYear = requirementYears[0] ?? "2026-2027";

  async function action(formData: FormData) {
    "use server";
    const schoolYear = String(formData.get("school_year") ?? "2026-2027");
    const pathways = formData.getAll("pathways") as AcademicPathway[];
    await createDraftSchedule(student!.id, schoolYear, pathways);
  }

  async function autoGenerateAction(formData: FormData) {
    "use server";
    const schoolYear = String(formData.get("school_year") ?? "2026-2027");
    await generateAndCreateSchedule(student!.id, schoolYear);
  }

  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <div className="flex-1 bg-cream">
        <PageHeader
          title={`Build Schedule — ${student.first_name} ${student.last_name}`}
          subtitle="Select the pathway(s) that fit this student. You can assign more than one — for example, a student can be on both the College Preparatory and IEP Support pathways at once."
        />
        <main className="p-8 max-w-2xl">
          {requirementYears.length === 0 && (
            <div className="bg-wholegroup-bg border border-wholegroup/30 rounded-lg p-4 mb-6 text-sm text-wholegroup">
              <p className="font-semibold mb-1">No graduation requirements are configured</p>
              <p>
                Auto-generate can&apos;t identify credit gaps or intervention needs until an administrator adds
                graduation requirements for a school year. Any draft built now will come out nearly empty.
              </p>
            </div>
          )}

          <Card className="bg-navy/5 border-navy/20 p-6 mb-6">
            <form action={autoGenerateAction}>
              <h2 className="font-semibold text-navy mb-1">Auto-generate a draft</h2>
              <p className="text-sm text-navy/60 mb-4">
                Build a starting draft automatically from this student&apos;s graduation gaps, test scores,
                IEP/504 support needs, credit pace, accommodations, and EDGE recommendations. Students who need
                academic intervention get supported sections and intervention labs. You&apos;ll be able to review
                and edit every block before submitting — nothing is finalized automatically.
              </p>
              <div className="flex items-end gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-navy mb-1">School Year</label>
                  <select name="school_year" defaultValue={defaultYear} className="border border-hairline rounded px-3 py-2 text-sm w-48">
                    {requirementYears.length === 0 ? (
                      <option value="2026-2027">2026-2027</option>
                    ) : (
                      requirementYears.map((y) => <option key={y} value={y}>{y}</option>)
                    )}
                  </select>
                </div>
                <Button type="submit">Auto-generate Draft</Button>
              </div>
            </form>
          </Card>

          <p className="text-[10px] uppercase tracking-wide text-navy/40 mb-3">Or build manually</p>

          <Card className="p-6">
            <form action={action} className="space-y-5">
              <div>
                <label className="block text-[10px] font-semibold text-navy mb-1">School Year</label>
                <select name="school_year" defaultValue={defaultYear} className="border border-hairline rounded px-3 py-2 text-sm w-48">
                  {requirementYears.length === 0 ? (
                    <option value="2026-2027">2026-2027</option>
                  ) : (
                    requirementYears.map((y) => <option key={y} value={y}>{y}</option>)
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-navy mb-2">Pathways</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PATHWAY_LABELS).map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 text-sm text-navy border border-hairline rounded px-3 py-2">
                      <input
                        type="checkbox"
                        name="pathways"
                        value={value}
                        defaultChecked={
                          (value === "iep_support" && student.has_iep) ||
                          (value === "504_support" && student.has_504) ||
                          (value === "dual_enrollment" && student.dual_enrollment_active)
                        }
                        className="rounded border-hairline"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit">Create Draft Schedule</Button>
            </form>
          </Card>
        </main>
      </div>
    </div>
  );
}
