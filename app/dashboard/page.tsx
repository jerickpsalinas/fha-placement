import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { listStudents, listPendingApprovals } from "@/lib/queries";
import { redirect } from "next/navigation";
import type { StaffProfile } from "@/types";

async function getStaffSafe(): Promise<
  { ok: true; staff: StaffProfile } | { ok: false; error: string; redirect?: string }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) return { ok: false, error: `Auth error: ${authError.message}` };
    if (!user) return { ok: false, error: "No session found", redirect: "/login" };

    const { data, error } = await supabase
      .from("staff_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) return { ok: false, error: `DB error: ${error.message} (code: ${error.code})` };
    if (!data) return { ok: false, error: `No staff profile found for user ${user.id}` };
    if (!data.active) return { ok: false, error: "Account is deactivated", redirect: "/login?error=account_deactivated" };

    return { ok: true, staff: data as StaffProfile };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? `Unexpected error: ${err.message}` : `Unknown error: ${String(err)}`,
    };
  }
}

export default async function DashboardPage() {
  const result = await getStaffSafe();

  if (!result.ok) {
    if (result.redirect) redirect(result.redirect);
    return (
      <div style={{ fontFamily: "monospace", padding: "2rem" }}>
        <div style={{ background: "red", color: "white", padding: "1rem", borderRadius: "6px", marginBottom: "1rem", fontWeight: "bold", fontSize: "1.1rem" }}>
          Dashboard failed to load — server error
        </div>
        <pre style={{ background: "#1e1e1e", color: "#f8f8f2", padding: "1rem", borderRadius: "6px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {result.error}
        </pre>
        <p style={{ marginTop: "1rem", color: "#555" }}>
          Check your Supabase environment variables and that a staff_profiles row exists for this user.
        </p>
      </div>
    );
  }

  const { staff } = result;

  const [studentsResult, pendingResult] = await Promise.allSettled([
    listStudents(),
    staff.role === "admin" ? listPendingApprovals() : Promise.resolve([]),
  ]);

  const students = studentsResult.status === "fulfilled" ? studentsResult.value : [];
  const studentsError = studentsResult.status === "rejected"
    ? (studentsResult.reason instanceof Error ? studentsResult.reason.message : "Failed to load students.")
    : null;

  const pending = pendingResult.status === "fulfilled" ? pendingResult.value : [];
  const pendingError = pendingResult.status === "rejected"
    ? (pendingResult.reason instanceof Error ? pendingResult.reason.message : "Failed to load pending approvals.")
    : null;

  const withIep = students.filter((s) => s.has_iep).length;
  const with504 = students.filter((s) => s.has_504).length;

  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <div className="flex-1 bg-cream">
        <PageHeader
          title={`Welcome, ${staff.full_name.split(" ")[0]}`}
          subtitle="Here's what's happening across your students."
        />
        <main className="p-8 max-w-5xl">
          {studentsError ? (
            <div className="mb-10 rounded-lg border border-intervention/30 bg-intervention-bg p-4 text-sm text-intervention">
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
              <h2 className="text-[10px] font-bold uppercase tracking-wide text-navy mb-3">Schedules Pending Approval</h2>
              {pendingError ? (
                <div className="rounded-lg border border-intervention/30 bg-intervention-bg p-4 text-sm text-intervention">
                  Couldn&apos;t load pending approvals: {pendingError}
                </div>
              ) : pending.length === 0 ? (
                <p className="text-sm text-navy/50">Nothing pending approval right now.</p>
              ) : (
                <Card className="divide-y divide-hairline overflow-hidden">
                  {pending.map((sch) => (
                    <a
                      key={sch.id}
                      href={`/students/${sch.student_id}/schedule/${sch.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-cream"
                    >
                      <span className="text-sm font-medium text-navy">
                        {sch.students.first_name} {sch.students.last_name} — Grade {sch.students.grade_level}
                      </span>
                      <span className="text-xs text-gold font-bold uppercase">Review &rarr;</span>
                    </a>
                  ))}
                </Card>
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
    <Card className="p-5">
      <p className="text-3xl font-bold text-navy font-serif">{value}</p>
      <p className="text-sm text-navy/50">{label}</p>
    </Card>
  );
}
