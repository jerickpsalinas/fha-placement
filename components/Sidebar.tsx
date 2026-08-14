"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { StaffProfile } from "@/types";

const NAV_HREFS = ["/dashboard", "/students", "/students/new", "/students/import", "/placement", "/records", "/admin/approvals", "/admin/staff", "/settings"];

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/students") {
    // Only treat as active for nested student pages not covered by their own nav link (e.g. /students/[id])
    return pathname.startsWith("/students/") && !NAV_HREFS.some((h) => h !== href && pathname.startsWith(h));
  }
  return false;
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded text-[13px] transition ${
        active ? "bg-white/10 text-gold font-semibold" : "text-white/70 hover:bg-white/5 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

export function Sidebar({ staff }: { staff: StaffProfile }) {
  return (
    <aside className="w-56 bg-navy text-white h-screen sticky top-0 p-5 flex flex-col overflow-y-auto">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Father&apos;s Harbor Academy</p>
        <p className="font-semibold leading-tight text-gold font-serif">Placement &amp; Schedule Builder</p>
      </div>
      <nav className="flex-1 space-y-1">
        <NavLink href="/dashboard">Dashboard</NavLink>
        <NavLink href="/students">Students</NavLink>
        {(staff.role === "admin" || staff.role === "counselor") && (
          <NavLink href="/students/new">Add Student</NavLink>
        )}
        {(staff.role === "admin" || staff.role === "counselor") && (
          <NavLink href="/students/import">Import CSV</NavLink>
        )}
        <NavLink href="/placement">Placement Guide</NavLink>
        <NavLink href="/records">Records &amp; Transcripts</NavLink>
        {staff.role === "admin" && <NavLink href="/admin/approvals">Approval Queue</NavLink>}
        {staff.role === "admin" && <NavLink href="/admin/staff">Manage Staff</NavLink>}
        <NavLink href="/settings">Settings</NavLink>
      </nav>
      <div className="text-xs text-white/60 pt-4 border-t border-white/10">
        <p className="font-medium text-white">{staff.full_name}</p>
        <p className="capitalize">{staff.role.replace("_", " ")}</p>
        <form action="/api/auth/signout" method="post" className="mt-2">
          <button className="text-white/70 hover:text-gold underline">Sign out</button>
        </form>
      </div>
    </aside>
  );
}
