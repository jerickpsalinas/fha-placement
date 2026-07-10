import Link from "next/link";
import type { StaffProfile } from "@/types";

export function Sidebar({ staff }: { staff: StaffProfile }) {
  return (
    <aside className="w-56 bg-navy text-white min-h-screen p-5 flex flex-col">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wide text-white/60">FHA</p>
        <p className="font-semibold leading-tight">Placement &amp; Schedule Builder</p>
      </div>
      <nav className="flex-1 space-y-1 text-sm">
        <Link href="/dashboard" className="block px-3 py-2 rounded hover:bg-white/10">
          Dashboard
        </Link>
        <Link href="/students" className="block px-3 py-2 rounded hover:bg-white/10">
          Students
        </Link>
        {(staff.role === "admin" || staff.role === "counselor") && (
          <Link href="/students/new" className="block px-3 py-2 rounded hover:bg-white/10">
            Add Student
          </Link>
        )}
        {(staff.role === "admin" || staff.role === "counselor") && (
          <Link href="/students/import" className="block px-3 py-2 rounded hover:bg-white/10">
            Import CSV
          </Link>
        )}
        {staff.role === "admin" && (
          <Link href="/admin/approvals" className="block px-3 py-2 rounded hover:bg-white/10">
            Approval Queue
          </Link>
        )}
        {staff.role === "admin" && (
          <Link href="/admin/staff" className="block px-3 py-2 rounded hover:bg-white/10">
            Manage Staff
          </Link>
        )}
      </nav>
      <div className="text-xs text-white/60 pt-4 border-t border-white/10">
        <p className="font-medium text-white">{staff.full_name}</p>
        <p className="capitalize">{staff.role.replace("_", " ")}</p>
        <form action="/api/auth/signout" method="post" className="mt-2">
          <button className="text-white/70 hover:text-white underline">Sign out</button>
        </form>
      </div>
    </aside>
  );
}
