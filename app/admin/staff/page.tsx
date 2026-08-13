import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { createStaffMember, deactivateStaffMember, getOrphanedAuthUsers, recoverOrphanedUser } from "@/app/admin/staff/actions";
import type { StaffProfile } from "@/types";

export default async function ManageStaffPage() {
  const staff = await requireRole(["admin", "director"]);
  const supabase = await createClient();
  const { data: allStaff } = await supabase.from("staff_profiles").select("*").order("full_name");
  const orphaned = await getOrphanedAuthUsers();

  async function createAction(formData: FormData) {
    "use server";
    await createStaffMember(formData);
  }

  async function recoverAction(userId: string, formData: FormData) {
    "use server";
    const fullName = String(formData.get("full_name") ?? "");
    const role = String(formData.get("role") ?? "read_only") as StaffProfile["role"];
    await recoverOrphanedUser(userId, fullName, role);
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

          {orphaned.length > 0 && (
            <Card className="p-6 border-amber-300 bg-amber-50">
              <h2 className="text-[11px] font-bold uppercase tracking-wide text-amber-800 mb-2">
                Logins missing a staff profile
              </h2>
              <p className="text-xs text-amber-800/80 mb-4">
                These accounts exist and can sign in, but have no staff profile — so they were invisible above.
                Give each one a name and role to bring it into the staff list, or leave it if it's not a real account.
              </p>
              <div className="space-y-3">
                {orphaned.map((u) => (
                  <form
                    key={u.id}
                    action={recoverAction.bind(null, u.id)}
                    className="grid grid-cols-4 gap-2 items-center bg-white border border-amber-200 rounded p-3"
                  >
                    <span className="text-xs text-navy col-span-1 truncate">{u.email}</span>
                    <input name="full_name" placeholder="Full name" required className="border border-hairline rounded px-2 py-1.5 text-xs" />
                    <select name="role" className="border border-hairline rounded px-2 py-1.5 text-xs">
                      <option value="director">Director</option>
                      <option value="admin">Administrator</option>
                      <option value="counselor">Counselor / Advisor</option>
                      <option value="teacher">Teacher</option>
                      <option value="read_only">Front Office / Read-only</option>
                    </select>
                    <Button type="submit" className="text-xs py-1.5">Add to Staff List</Button>
                  </form>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-navy mb-4">Current Staff</h2>
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wide text-navy/40">
                <tr>
                  <th className="text-left px-2 py-1.5">Name</th>
                  <th className="text-left px-2 py-1.5">Role</th>
                  <th className="text-left px-2 py-1.5">Status</th>
                  <th className="text-left px-2 py-1.5"></th>
                </tr>
              </thead>
              <tbody>
                {(allStaff as StaffProfile[] | null)?.map((s) => (
                  <tr key={s.id} className="border-t border-hairline/60">
                    <td className="px-2 py-1.5 text-navy">{s.full_name}</td>
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
