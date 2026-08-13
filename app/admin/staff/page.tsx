import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { createStaffMember, deactivateStaffMember, getStaffEmails } from "@/app/admin/staff/actions";
import type { StaffProfile } from "@/types";

export default async function ManageStaffPage() {
  const staff = await requireRole(["admin", "director"]);
  const supabase = await createClient();
  const { data: allStaff } = await supabase.from("staff_profiles").select("*").order("full_name");
  const emails = await getStaffEmails((allStaff ?? []).map((s) => s.id));

  async function createAction(formData: FormData) {
    "use server";
    await createStaffMember(formData);
  }

  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <div className="flex-1 bg-cream">
        <PageHeader title="Manage Staff" subtitle="Add staff accounts and manage access." />
        <main className="p-8 max-w-3xl space-y-6">
          <Card className="p-6">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-navy mb-4">Add Staff Member</h2>
            <form action={createAction} className="grid grid-cols-2 gap-3">
              <input name="full_name" placeholder="Full name" required className="border border-hairline rounded px-3 py-2 text-sm" />
              <input name="email" type="email" placeholder="Email" required className="border border-hairline rounded px-3 py-2 text-sm" />
              <input name="password" type="password" placeholder="Initial password" required minLength={6} className="border border-hairline rounded px-3 py-2 text-sm col-span-2" />
              <select name="role" className="border border-hairline rounded px-3 py-2 text-sm col-span-2">
                <option value="director">Director</option>
                <option value="admin">Administrator</option>
                <option value="counselor">Counselor / Advisor</option>
                <option value="teacher">Teacher</option>
                <option value="read_only">Front Office / Read-only</option>
              </select>
              <Button type="submit" className="col-span-2">Add Staff Member</Button>
            </form>
            <p className="text-xs text-navy/40 mt-2">
              Set an initial email and password for the new staff member. Share these credentials with them directly.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-navy mb-4">Current Staff</h2>
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wide text-navy/40">
                <tr>
                  <th className="text-left px-2 py-1.5">Name</th>
                  <th className="text-left px-2 py-1.5">Email</th>
                  <th className="text-left px-2 py-1.5">Role</th>
                  <th className="text-left px-2 py-1.5">Status</th>
                  <th className="text-left px-2 py-1.5"></th>
                </tr>
              </thead>
              <tbody>
                {(allStaff as StaffProfile[] | null)?.map((s) => (
                  <tr key={s.id} className="border-t border-hairline/60">
                    <td className="px-2 py-1.5 text-navy">{s.full_name}</td>
                    <td className="px-2 py-1.5 text-navy/70">{emails[s.id] ?? "—"}</td>
                    <td className="px-2 py-1.5 capitalize text-navy">{s.role.replace("_", " ")}</td>
                    <td className="px-2 py-1.5 text-navy">{s.active ? "Active" : "Deactivated"}</td>
                    <td className="px-2 py-1.5">
                      {s.active && s.id !== staff.id && (
                        <form action={async () => { "use server"; await deactivateStaffMember(s.id); }}>
                          <button className="text-xs text-intervention hover:underline">Deactivate</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </main>
      </div>
    </div>
  );
}
