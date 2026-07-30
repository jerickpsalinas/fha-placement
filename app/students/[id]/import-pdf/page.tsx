import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { ImportPdfTool } from "./ImportPdfTool";

export default async function ImportPdfPage() {
  const staff = await requireRole(["admin", "counselor"]);
  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <ImportPdfTool />
    </div>
  );
}
