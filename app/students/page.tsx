import { getCurrentStaff } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, TableHead, TableBody, Th, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { listStudents } from "@/lib/queries";
import Link from "next/link";

export default async function StudentsPage() {
  const staff = await getCurrentStaff();
  const students = await listStudents();

  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <div className="flex-1 bg-cream">
        <PageHeader
          title="Students"
          subtitle="View, manage, and build placement plans for every enrolled student."
          action={
            (staff.role === "admin" || staff.role === "counselor") && (
              <LinkButton href="/students/new">+ Add Student</LinkButton>
            )
          }
        />
        <main className="p-8 max-w-5xl">
          <Table>
            <TableHead>
              <tr>
                <Th>Name</Th>
                <Th>Grade</Th>
                <Th>GPA</Th>
                <Th>Credits</Th>
                <Th>Flags</Th>
              </tr>
            </TableHead>
            <TableBody>
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-cream">
                  <Td>
                    <Link href={`/students/${s.id}`} className="font-medium text-navy hover:text-gold hover:underline">
                      {s.last_name}, {s.first_name}
                    </Link>
                  </Td>
                  <Td>{s.grade_level}</Td>
                  <Td>{s.gpa ?? "—"}</Td>
                  <Td>{s.credits_earned}</Td>
                  <Td className="space-x-1">
                    {s.has_iep && <Badge color="blue">IEP</Badge>}
                    {s.has_504 && <Badge color="purple">504</Badge>}
                    {s.dual_enrollment_active && <Badge color="green">DE</Badge>}
                  </Td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-navy/40">
                    No students yet. Add your first student to get started.
                  </td>
                </tr>
              )}
            </TableBody>
          </Table>
        </main>
      </div>
    </div>
  );
}
