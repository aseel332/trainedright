import { Award, Heart } from "lucide-react";
import type { TrainerBadge } from "@/lib/types";

const badgeStyles: Record<TrainerBadge, string> = {
  award: "text-blue-400",
  loved: "text-red-400",
};

export function BadgeIcon({
  badge,
  size = 15,
}: {
  badge: TrainerBadge;
  size?: number;
}) {
  const className = badgeStyles[badge];

  if (badge === "award") {
    return <Award aria-hidden="true" className={className} size={size} />;
  }

  return (
    <Heart
      aria-hidden="true"
      className={className}
      fill="currentColor"
      size={size}
      strokeWidth={0}
    />
  );
}
