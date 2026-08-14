import { getCurrentStaff } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function SettingsPage() {
  const staff = await getCurrentStaff();

  return (
    <div className="flex">
      <Sidebar staff={staff} />
      <div className="flex-1 bg-cream">
        <PageHeader title="Settings" subtitle="Manage your account." />
        <main className="p-8 max-w-md">
          <Card className="p-6">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-navy mb-4">Change Password</h2>
            <ChangePasswordForm />
          </Card>
        </main>
      </div>
    </div>
  );
}
