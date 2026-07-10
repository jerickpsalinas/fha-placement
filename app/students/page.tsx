import { getCurrentStaff } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { listStudents } from "@/lib/queries";
import Link from "next/link";

export default async function StudentsPage() {
  const staff = await getCurrentStaff();
  const students = await listStudents();

  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-navy">Students</h1>
          {(staff.role === "admin" || staff.role === "counselor") && (
            <Link href="/students/new" className="bg-navy text-white text-sm font-medium px-4 py-2 rounded hover:bg-navy/90">
              + Add Student
            </Link>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Grade</th>
                <th className="text-left px-4 py-3">GPA</th>
                <th className="text-left px-4 py-3">Credits</th>
                <th className="text-left px-4 py-3">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/students/${s.id}`} className="font-medium text-navy hover:underline">
                      {s.last_name}, {s.first_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{s.grade_level}</td>
                  <td className="px-4 py-3">{s.gpa ?? "—"}</td>
                  <td className="px-4 py-3">{s.credits_earned}</td>
                  <td className="px-4 py-3 space-x-1">
                    {s.has_iep && <Badge color="bg-blue-100 text-blue-700">IEP</Badge>}
                    {s.has_504 && <Badge color="bg-purple-100 text-purple-700">504</Badge>}
                    {s.dual_enrollment_active && <Badge color="bg-green-100 text-green-700">DE</Badge>}
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No students yet. Add your first student to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={`text-xs px-2 py-0.5 rounded font-medium ${color}`}>{children}</span>;
}
