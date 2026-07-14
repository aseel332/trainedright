import type { Transformation } from "@/lib/types";

type TransformationReviewMetric = {
  label: string;
  rating: number;
  summary: string;
};

type TransformationReviewSummary = {
  rating: number;
  metrics: TransformationReviewMetric[];
};

export function getTransformationReviewSummary(
  item: Transformation,
): TransformationReviewSummary {
  const ratingOffset = item.sortOrder % 2 === 0 ? -0.1 : 0;

  return {
    rating: 4.9 + ratingOffset,
    metrics: [
      {
        label: "Consistency",
        rating: 5,
        summary:
          "The plan stayed practical week after week, with progressions that were easy to follow.",
      },
      {
        label: "Punctuality",
        rating: 4.9,
        summary:
          "Sessions started on time and check-ins happened without the client needing to chase.",
      },
      {
        label: "Motivation",
        rating: 4.9 + ratingOffset,
        summary:
          "Coaching felt firm without being harsh, especially when momentum dipped.",
      },
      {
        label: "Technique clarity",
        rating: 4.8,
        summary:
          "Cues were simple, specific, and helped the client train harder without guessing.",
      },
    ],
  };
}
