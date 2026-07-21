import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { listPendingApprovals } from "@/lib/queries";
import Link from "next/link";

export default async function ApprovalsPage() {
  const staff = await requireRole(["admin", "director"]);
  const pending = await listPendingApprovals();

  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-navy mb-6">Approval Queue</h1>

        {pending.length === 0 ? (
          <p className="text-sm text-gray-500">No schedules awaiting approval.</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg divide-y">
            {pending.map((sch) => (
              <Link
                key={sch.id}
                href={`/students/${sch.student_id}/schedule/${sch.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-sm"
              >
                <span className="font-medium">
                  {sch.students.first_name} {sch.students.last_name} — Grade {sch.students.grade_level}
                </span>
                <span className="text-xs text-gray-400">{sch.pathways.length} pathway(s) · {sch.school_year}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
