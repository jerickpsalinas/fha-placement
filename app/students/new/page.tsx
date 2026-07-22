import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { createStudent } from "@/app/students/actions";
import { EDGE_PATHWAY_LABELS } from "@/types";

const GRADES = ["K","1","2","3","4","5","6","7","8","9","10","11","12"];

export default async function NewStudentPage() {
  const staff = await requireRole(["admin", "counselor"]);

  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <main className="flex-1 p-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-navy mb-6">Add Student</h1>

        <form action={createStudent} className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" name="first_name" required />
            <Field label="Last Name" name="last_name" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date of Birth" name="date_of_birth" type="date" />
            <div>
              <label className="block text-sm font-medium mb-1">Grade Level</label>
              <select name="grade_level" required className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Enrollment Type</label>
              <select name="enrollment_type" className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option value="private_continuing">Private school (continuing)</option>
                <option value="public_transfer">Public school transfer</option>
              </select>
            </div>
            <Field label="Prior School (if transfer)" name="prior_school" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="GPA" name="gpa" type="number" step="0.01" min="0" max="4" />
            <Field label="Credits Earned" name="credits_earned" type="number" step="0.5" min="0" />
          </div>

          <div className="flex gap-6">
            <Checkbox label="Has IEP" name="has_iep" />
            <Checkbox label="Has 504 Plan" name="has_504" />
            <Checkbox label="Dual Enrollment Active" name="dual_enrollment_active" />
          </div>

          <Field label="Career Goals" name="career_goals" textarea />
          <Field label="College Goals" name="college_goals" textarea />

          <div>
            <label className="block text-sm font-medium mb-2">EDGE Interests</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(EDGE_PATHWAY_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm border border-gray-200 rounded px-3 py-2">
                  <input type="checkbox" name="edge_interests" value={value} className="rounded border-gray-300" />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" className="bg-navy text-white text-sm font-medium px-5 py-2.5 rounded hover:bg-navy/90">
              Create Student
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({
  label, name, type = "text", required, textarea, ...rest
}: { label: string; name: string; type?: string; required?: boolean; textarea?: boolean } & Record<string, unknown>) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {textarea ? (
        <textarea name={name} rows={2} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          {...rest}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}

function Checkbox({ label, name }: { label: string; name: string }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} className="rounded border-gray-300" />
      {label}
    </label>
  );
}
