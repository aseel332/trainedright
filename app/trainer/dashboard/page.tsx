import type { Metadata } from "next";
import { TrainerDashboardClient } from "@/components/trainer-dashboard-client";

export const metadata: Metadata = {
  title: "Trainer dashboard | TrainedRight",
  description: "Create, edit, and submit your trainer profile for approval.",
};

export default function TrainerDashboardPage() {
  return <TrainerDashboardClient />;
}
