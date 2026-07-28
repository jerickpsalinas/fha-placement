import { getCurrentStaff } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { RecordsTool } from "./RecordsTool";

export default async function RecordsPage() {
  const staff = await getCurrentStaff();
  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <main className="flex-1 overflow-y-auto">
        <RecordsTool />
      </main>
    </div>
  );
}
