import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { listPendingApprovals } from "@/lib/queries";
import Link from "next/link";

export default async function ApprovalsPage() {
  const staff = await requireRole(["admin", "director"]);
  const pending = await listPendingApprovals();

  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <div className="flex-1 bg-cream">
        <PageHeader title="Approval Queue" subtitle="Schedules awaiting director or admin sign-off." />
        <main className="p-8 max-w-5xl">
          {pending.length === 0 ? (
            <p className="text-sm text-navy/50">No schedules awaiting approval.</p>
          ) : (
            <Card className="divide-y divide-hairline overflow-hidden">
              {pending.map((sch) => (
                <Link
                  key={sch.id}
                  href={`/students/${sch.student_id}/schedule/${sch.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-cream text-sm"
                >
                  <span className="font-medium text-navy">
                    {sch.students.first_name} {sch.students.last_name} — Grade {sch.students.grade_level}
                  </span>
                  <span className="text-xs text-navy/40">{sch.pathways.length} pathway(s) · {sch.school_year}</span>
                </Link>
              ))}
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
