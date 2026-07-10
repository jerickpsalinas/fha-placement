import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { getStudent } from "@/lib/queries";
import { notFound } from "next/navigation";
import { PATHWAY_LABELS, type AcademicPathway } from "@/types";
import { createDraftSchedule } from "@/app/students/[id]/schedule/actions";

export default async function NewSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireRole(["admin", "counselor"]);
  const student = await getStudent(id);
  if (!student) notFound();

  async function action(formData: FormData) {
    "use server";
    const schoolYear = String(formData.get("school_year") ?? "2026-2027");
    const pathways = formData.getAll("pathways") as AcademicPathway[];
    await createDraftSchedule(student!.id, schoolYear, pathways);
  }

  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <main className="flex-1 p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-navy mb-1">
          Build Schedule — {student.first_name} {student.last_name}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Select the pathway(s) that fit this student. You can assign more than one — for example, a student
          can be on both the College Preparatory and IEP Support pathways at once.
        </p>

        <form action={action} className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">School Year</label>
            <input
              name="school_year"
              defaultValue="2026-2027"
              className="border border-gray-300 rounded px-3 py-2 text-sm w-48"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Pathways</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PATHWAY_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm border border-gray-200 rounded px-3 py-2">
                  <input
                    type="checkbox"
                    name="pathways"
                    value={value}
                    defaultChecked={
                      (value === "iep_support" && student.has_iep) ||
                      (value === "504_support" && student.has_504) ||
                      (value === "dual_enrollment" && student.dual_enrollment_active)
                    }
                    className="rounded border-gray-300"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="bg-navy text-white text-sm font-medium px-5 py-2.5 rounded hover:bg-navy/90">
            Create Draft Schedule
          </button>
        </form>
      </main>
    </div>
  );
}
