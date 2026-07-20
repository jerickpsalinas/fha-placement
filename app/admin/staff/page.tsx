import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { createStaffMember, deactivateStaffMember } from "@/app/admin/staff/actions";
import type { StaffProfile } from "@/types";

export default async function ManageStaffPage() {
  const staff = await requireRole(["admin", "director"]);
  const supabase = await createClient();
  const { data: allStaff } = await supabase.from("staff_profiles").select("*").order("full_name");

  async function createAction(formData: FormData) {
    "use server";
    await createStaffMember(formData);
  }

  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <main className="flex-1 p-8 max-w-3xl space-y-8">
        <h1 className="text-2xl font-bold text-navy">Manage Staff</h1>

        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold text-navy mb-4">Add Staff Member</h2>
          <form action={createAction} className="grid grid-cols-2 gap-3">
            <input name="full_name" placeholder="Full name" required className="border border-gray-300 rounded px-3 py-2 text-sm" />
            <input name="email" type="email" placeholder="Email" required className="border border-gray-300 rounded px-3 py-2 text-sm" />
            <input name="password" type="password" placeholder="Initial password" required minLength={6} className="border border-gray-300 rounded px-3 py-2 text-sm col-span-2" />
            <select name="role" className="border border-gray-300 rounded px-3 py-2 text-sm col-span-2">
              <option value="director">Director</option>
              <option value="admin">Administrator</option>
              <option value="counselor">Counselor / Advisor</option>
              <option value="teacher">Teacher</option>
              <option value="read_only">Front Office / Read-only</option>
            </select>
            <button type="submit" className="col-span-2 bg-navy text-white text-sm font-medium px-4 py-2 rounded hover:bg-navy/90">
              Add Staff Member
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2">
            Set an initial email and password for the new staff member. Share these credentials with them directly.
          </p>
        </section>

        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold text-navy mb-4">Current Staff</h2>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-gray-400">
              <tr>
                <th className="text-left px-2 py-1.5">Name</th>
                <th className="text-left px-2 py-1.5">Role</th>
                <th className="text-left px-2 py-1.5">Status</th>
                <th className="text-left px-2 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {(allStaff as StaffProfile[] | null)?.map((s) => (
                <tr key={s.id} className="border-t border-gray-100">
                  <td className="px-2 py-1.5">{s.full_name}</td>
                  <td className="px-2 py-1.5 capitalize">{s.role.replace("_", " ")}</td>
                  <td className="px-2 py-1.5">{s.active ? "Active" : "Deactivated"}</td>
                  <td className="px-2 py-1.5">
                    {s.active && s.id !== staff.id && (
                      <form action={async () => { "use server"; await deactivateStaffMember(s.id); }}>
                        <button className="text-xs text-red-600 hover:underline">Deactivate</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
