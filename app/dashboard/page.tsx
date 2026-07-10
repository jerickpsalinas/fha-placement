import { getCurrentStaff } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { listStudents, listPendingApprovals } from "@/lib/queries";

export default async function DashboardPage() {
  const staff = await getCurrentStaff();

  let students: Awaited<ReturnType<typeof listStudents>> = [];
  let studentsError: string | null = null;
  try {
    students = await listStudents();
  } catch (err) {
    studentsError = err instanceof Error ? err.message : "Failed to load students.";
  }

  let pending: Awaited<ReturnType<typeof listPendingApprovals>> = [];
  let pendingError: string | null = null;
  if (staff.role === "admin") {
    try {
      pending = await listPendingApprovals();
    } catch (err) {
      pendingError = err instanceof Error ? err.message : "Failed to load pending approvals.";
    }
  }

  const withIep = students.filter((s) => s.has_iep).length;
  const with504 = students.filter((s) => s.has_504).length;

  return (
    <div>
      <div style={{ background: "red", color: "white", padding: "1rem", fontWeight: "bold" }}>
        ✅ React is rendering — Tailwind test
      </div>
    <div className="flex">
      <Sidebar staff={staff} />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-navy mb-1">Welcome, {staff.full_name.split(" ")[0]}</h1>
        <p className="text-gray-500 mb-8">Here&apos;s what&apos;s happening across your students.</p>

        {studentsError ? (
          <div className="mb-10 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Couldn&apos;t load student stats: {studentsError}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <StatCard label="Students" value={students.length} />
            <StatCard label="IEP Plans" value={withIep} />
            <StatCard label="504 Plans" value={with504} />
          </div>
        )}

        {staff.role === "admin" && (
          <section>
            <h2 className="text-lg font-semibold text-navy mb-3">Schedules Pending Approval</h2>
            {pendingError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Couldn&apos;t load pending approvals: {pendingError}
              </div>
            ) : pending.length === 0 ? (
              <p className="text-sm text-gray-500">Nothing pending approval right now.</p>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg divide-y">
                {pending.map((sch) => (
                  <a
                    key={sch.id}
                    href={`/students/${sch.student_id}/schedule/${sch.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <span className="text-sm font-medium">
                      {sch.students.first_name} {sch.students.last_name} — Grade {sch.students.grade_level}
                    </span>
                    <span className="text-xs text-gold font-medium uppercase">Review &rarr;</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <p className="text-3xl font-bold text-navy">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
