import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { RecentContacts } from "@/components/dashboard/RecentContacts";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header with greeting and action button */}
      <DashboardHeader />

      {/* KPI Cards Grid */}
      <KPIGrid />

      {/* Chart and Recent Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityChart />
        </div>
        <div className="lg:col-span-1">
          <RecentContacts />
        </div>
      </div>
    </div>
  );
}
