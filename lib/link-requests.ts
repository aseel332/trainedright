export type ReviewRequestItem = {
  id: string;
  clientName: string;
  source: "client_link" | "trainer";
  status: "pending" | "submitted";
  rating: number | null;
  reviewText: string;
  createdAt: string;
  submittedAt: string | null;
};

export type TransformationRequestItem = {
  id: string;
  mode: "client_all" | "trainer_photos";
  clientName: string;
  title: string;
  resultLabel: string;
  durationLabel: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  rating: number | null;
  reviewText: string;
  status: "pending" | "submitted";
  createdAt: string;
  submittedAt: string | null;
};

type Row = Record<string, unknown>;

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function num(value: unknown): number | null {
  const parsed = Number(value);
  return value === null || value === undefined || Number.isNaN(parsed)
    ? null
    : parsed;
}

export function mapReviewRequestRow(row: Row): ReviewRequestItem {
  return {
    id: str(row.id),
    clientName: str(row.client_name),
    source: row.source === "trainer" ? "trainer" : "client_link",
    status: row.status === "submitted" ? "submitted" : "pending",
    rating: num(row.rating),
    reviewText: str(row.review_text),
    createdAt: str(row.created_at),
    submittedAt: row.submitted_at ? str(row.submitted_at) : null,
  };
}

export function mapTransformationRequestRow(
  row: Row,
): TransformationRequestItem {
  return {
    id: str(row.id),
    mode: row.mode === "trainer_photos" ? "trainer_photos" : "client_all",
    clientName: str(row.client_name),
    title: str(row.title),
    resultLabel: str(row.result_label),
    durationLabel: str(row.duration_label),
    beforeImageUrl: str(row.before_image_url),
    afterImageUrl: str(row.after_image_url),
    rating: num(row.rating),
    reviewText: str(row.review_text),
    status: row.status === "submitted" ? "submitted" : "pending",
    createdAt: str(row.created_at),
    submittedAt: row.submitted_at ? str(row.submitted_at) : null,
  };
}
