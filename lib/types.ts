export type TrainerBadge = "award" | "verified" | "loved";

export type Trainer = {
  id: string;
  /** The auth user who owns this published profile. */
  userId: string | null;
  slug: string;
  name: string;
  firstName: string;
  city: string;
  area: string;
  bio: string;
  avatarUrl: string;
  cardImageUrl: string;
  heroImageUrl: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  clientsCount: number;
  replyTimeLabel: string;
  priceFromInr: number;
  whatsappNumber: string;
  specialties: string[];
  tags: string[];
  badges: TrainerBadge[];
  testimonial: string;
  isVerified: boolean;
  sortRank: number;
};

export type Story = {
  id: string;
  trainerId: string | null;
  title: string;
  authorName: string;
  excerpt: string;
  imageUrl: string;
  avatarUrl: string;
  isFeatured: boolean;
  sortOrder: number;
};

export type TrainerMedia = {
  id: string;
  trainerId: string;
  type: "photo" | "video";
  url: string;
  posterUrl: string | null;
  sortOrder: number;
};

export type PricingOption = {
  id: string;
  trainerId: string;
  name: string;
  description: string;
  priceInr: number | null;
  unit: string;
  badge: string | null;
  sortOrder: number;
};

export type Transformation = {
  id: string;
  trainerId: string;
  resultLabel: string;
  durationLabel: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  clientName: string;
  clientInitials: string;
  avatarColor: string;
  review: string;
  /** The client's star rating, when they submitted one via their link. */
  rating: number | null;
  isConfirmed: boolean;
  sortOrder: number;
};

export type TrainerReview = {
  id: string;
  trainerId: string;
  clientName: string;
  clientInitials: string;
  avatarColor: string;
  rating: number;
  reviewText: string;
  whenLabel: string;
  isVerified: boolean;
  sortOrder: number;
};

export type TrainerLocation = {
  id: string;
  trainerId: string;
  name: string;
  area: string;
  sortOrder: number;
};

export type TrainerCredential = {
  id: string;
  trainerId: string;
  title: string;
  subtitle: string;
  credentialType: "certified" | "id" | "medical" | "award";
  isVerified: boolean;
  sortOrder: number;
};

export type TrainerProfile = Trainer & {
  media: TrainerMedia[];
  pricing: PricingOption[];
  transformations: Transformation[];
  stories: Story[];
  reviews: TrainerReview[];
  locations: TrainerLocation[];
  credentials: TrainerCredential[];
};

export type TrainerSort = "recommended" | "rating" | "experience" | "price";

/** Aggregated demand analytics shown on the trainer dashboard. */
export type TrainerAnalytics = {
  /** false until the trainer_events migration has been applied. */
  available: boolean;
  totals: {
    profileViews: number;
    whatsappClicks: number;
    trialRequests: number;
    saves: number;
  };
  /** Profile views per week for the last 8 weeks, oldest first. */
  weeklyViews: number[];
};
