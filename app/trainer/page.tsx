import type { Metadata } from "next";
import { TrainerLandingClient } from "@/components/trainer-landing-client";

export const metadata: Metadata = {
  title: "Grow your coaching business | TrainedRight",
  description:
    "Build a profile that sells your coaching, collect verified reviews and transformations, and track real demand. Zero platform fee.",
};

export default function TrainerLandingPage() {
  return <TrainerLandingClient />;
}
