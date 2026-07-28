import { getCurrentStaff } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { PlacementGuide } from "./PlacementGuide";

export default async function PlacementPage() {
  const staff = await getCurrentStaff();
  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <main className="flex-1 overflow-y-auto">
        <PlacementGuide />
      </main>
    </div>
  );
}
