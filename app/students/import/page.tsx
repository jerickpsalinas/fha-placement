import { getCurrentStaff } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { ImportCSVTool } from "./ImportCSVTool";

export default async function ImportPage() {
  const staff = await getCurrentStaff();
  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <ImportCSVTool />
    </div>
  );
}
