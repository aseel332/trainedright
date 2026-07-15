import type {
  PricingOption,
  Story,
  Trainer,
  TrainerCredential,
  TrainerLocation,
  TrainerMedia,
  TrainerProfile,
  TrainerReview,
  Transformation,
} from "@/lib/types";

const wide = "?auto=format&fit=crop&q=78&w=1200";
const card = "?auto=format&fit=crop&q=74&w=640";
const avatar = "?auto=format&fit=crop&q=72&w=128";
const fallbackWhatsAppNumber = "919876543210";

export const fallbackTrainers: Trainer[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    userId: null,
    slug: "vikram-rao",
    name: "Vikram Rao",
    firstName: "Vikram",
    city: "Bengaluru",
    area: "Indiranagar",
    bio: "Ex-national powerlifter turned coach. I build progressive strength programs around your schedule and track every session, with clean technique, smart nutrition, and no guesswork.",
    avatarUrl: `https://images.unsplash.com/photo-1567013127542-490d757e51fc${avatar}`,
    cardImageUrl: `https://images.unsplash.com/photo-1567013127542-490d757e51fc${card}`,
    heroImageUrl: `https://images.unsplash.com/photo-1567013127542-490d757e51fc${wide}`,
    rating: 4.9,
    reviewCount: 128,
    yearsExperience: 8,
    clientsCount: 120,
    replyTimeLabel: "~2 hrs",
    priceFromInr: 800,
    whatsappNumber: fallbackWhatsAppNumber,
    specialties: ["Strength", "Weight loss"],
    tags: ["Strength training", "Hypertrophy", "Powerlifting"],
    badges: ["award", "verified"],
    testimonial:
      "Structured, patient, and he actually tracks your progress every single week. Down 14 kg and lifting more than ever.",
    isVerified: true,
    sortRank: 1,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    userId: null,
    slug: "meera-iyer",
    name: "Meera Iyer",
    firstName: "Meera",
    city: "Bengaluru",
    area: "Koramangala",
    bio: "A weight-loss and mobility coach who keeps plans realistic for busy people. Sessions combine strength basics, movement quality, and simple habit systems.",
    avatarUrl: `https://images.unsplash.com/photo-1550345332-09e3ac987658${avatar}`,
    cardImageUrl: `https://images.unsplash.com/photo-1550345332-09e3ac987658${card}`,
    heroImageUrl: `https://images.unsplash.com/photo-1550345332-09e3ac987658${wide}`,
    rating: 4.8,
    reviewCount: 96,
    yearsExperience: 6,
    clientsCount: 88,
    replyTimeLabel: "~3 hrs",
    priceFromInr: 700,
    whatsappNumber: fallbackWhatsAppNumber,
    specialties: ["Weight loss", "Yoga"],
    tags: ["Weight loss", "Mobility", "Nutrition"],
    badges: ["verified", "loved"],
    testimonial:
      "Lost 9 kg without ever feeling starved. She builds the plan around your life, not the other way around.",
    isVerified: true,
    sortRank: 2,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    userId: null,
    slug: "arjun-nair",
    name: "Arjun Nair",
    firstName: "Arjun",
    city: "Bengaluru",
    area: "Whitefield",
    bio: "Boxing and conditioning coach for people who want sharper footwork, better stamina, and sessions that never feel generic.",
    avatarUrl: `https://images.unsplash.com/photo-1583454110551-21f2fa2afe61${avatar}`,
    cardImageUrl: `https://images.unsplash.com/photo-1583454110551-21f2fa2afe61${card}`,
    heroImageUrl: `https://images.unsplash.com/photo-1583454110551-21f2fa2afe61${wide}`,
    rating: 4.7,
    reviewCount: 64,
    yearsExperience: 5,
    clientsCount: 72,
    replyTimeLabel: "~4 hrs",
    priceFromInr: 900,
    whatsappNumber: fallbackWhatsAppNumber,
    specialties: ["Boxing"],
    tags: ["Boxing", "Kickboxing", "Conditioning"],
    badges: ["loved"],
    testimonial:
      "Every session wrecks you in the best way. His pad work is next level and the cardio gains are very real.",
    isVerified: false,
    sortRank: 3,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    userId: null,
    slug: "sana-kapoor",
    name: "Sana Kapoor",
    firstName: "Sana",
    city: "Bengaluru",
    area: "Jayanagar",
    bio: "Yoga, rehab, and pre/post-natal coach focused on rebuilding strength with patience, breath, and precise progressions.",
    avatarUrl: `https://images.unsplash.com/photo-1544005313-94ddf0286df2${avatar}`,
    cardImageUrl: `https://images.unsplash.com/photo-1544005313-94ddf0286df2${card}`,
    heroImageUrl: `https://images.unsplash.com/photo-1544005313-94ddf0286df2${wide}`,
    rating: 5,
    reviewCount: 41,
    yearsExperience: 10,
    clientsCount: 64,
    replyTimeLabel: "~1 hr",
    priceFromInr: 1000,
    whatsappNumber: fallbackWhatsAppNumber,
    specialties: ["Yoga"],
    tags: ["Pre/post-natal", "Yoga", "Rehab"],
    badges: ["award", "verified"],
    testimonial:
      "Helped me rebuild strength safely after pregnancy. Gentle but effective and incredibly knowledgeable.",
    isVerified: true,
    sortRank: 4,
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    userId: null,
    slug: "rohan-desai",
    name: "Rohan Desai",
    firstName: "Rohan",
    city: "Bengaluru",
    area: "HSR Layout",
    bio: "Sports performance coach for cricket, athletics, and recreational athletes who want power that transfers outside the gym.",
    avatarUrl: `https://images.unsplash.com/photo-1534438327276-14e5300c3a48${avatar}`,
    cardImageUrl: `https://images.unsplash.com/photo-1534438327276-14e5300c3a48${card}`,
    heroImageUrl: `https://images.unsplash.com/photo-1534438327276-14e5300c3a48${wide}`,
    rating: 4.6,
    reviewCount: 52,
    yearsExperience: 4,
    clientsCount: 58,
    replyTimeLabel: "~5 hrs",
    priceFromInr: 650,
    whatsappNumber: fallbackWhatsAppNumber,
    specialties: ["Sports"],
    tags: ["Cricket", "Athletics", "Speed work"],
    badges: ["verified"],
    testimonial:
      "My bowling speed jumped in two months. He knows exactly how to train for the sport, not just the gym.",
    isVerified: true,
    sortRank: 5,
  },
  {
    id: "00000000-0000-4000-8000-000000000006",
    userId: null,
    slug: "neha-sharma",
    name: "Neha Sharma",
    firstName: "Neha",
    city: "Bengaluru",
    area: "JP Nagar",
    bio: "Nutritionist and dietitian building Indian-food meal plans that are sustainable, measurable, and flexible enough for real life.",
    avatarUrl: `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b${avatar}`,
    cardImageUrl: `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b${card}`,
    heroImageUrl: `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b${wide}`,
    rating: 4.9,
    reviewCount: 73,
    yearsExperience: 7,
    clientsCount: 112,
    replyTimeLabel: "~2 hrs",
    priceFromInr: 600,
    whatsappNumber: fallbackWhatsAppNumber,
    specialties: ["Nutrition"],
    tags: ["Meal plans", "Weight loss", "Lifestyle"],
    badges: ["award", "verified"],
    testimonial:
      "Finally a plan with real Indian food I actually enjoy. No crash diets, just steady results week on week.",
    isVerified: true,
    sortRank: 6,
  },
  {
    id: "00000000-0000-4000-8000-000000000007",
    userId: null,
    slug: "kabir-menon",
    name: "Kabir Menon",
    firstName: "Kabir",
    city: "Bengaluru",
    area: "Bellandur",
    bio: "Functional strength coach who blends conditioning, mobility, and performance habits into high-energy sessions.",
    avatarUrl: `https://images.unsplash.com/photo-1517838277536-f5f99be501cd${avatar}`,
    cardImageUrl: `https://images.unsplash.com/photo-1517838277536-f5f99be501cd${card}`,
    heroImageUrl: `https://images.unsplash.com/photo-1517838277536-f5f99be501cd${wide}`,
    rating: 4.5,
    reviewCount: 38,
    yearsExperience: 3,
    clientsCount: 46,
    replyTimeLabel: "~6 hrs",
    priceFromInr: 750,
    whatsappNumber: fallbackWhatsAppNumber,
    specialties: ["Strength", "Sports"],
    tags: ["Functional", "Conditioning", "Mobility"],
    badges: ["verified"],
    testimonial:
      "Great energy and never a boring session. Pushed me harder than I thought I could go, safely.",
    isVerified: true,
    sortRank: 7,
  },
];

export const fallbackStories: Story[] = [
  {
    id: "story-global-1",
    trainerId: null,
    title: "-14 kg in six months",
    authorName: "Aarav R.",
    excerpt:
      "Six months ago I couldn't finish a single set. Vikram rebuilt my plan from scratch and the weight just kept coming off.",
    imageUrl: `https://images.unsplash.com/photo-1517836357463-d25dfeac3438${wide}`,
    avatarUrl: fallbackTrainers[0].avatarUrl,
    isFeatured: true,
    sortOrder: 1,
  },
  {
    id: "story-global-2",
    trainerId: null,
    title: "From ACL tear to the podium",
    authorName: "Coach Meera",
    excerpt:
      "The doctors said I might not compete again. I spent a year relearning how to move before I touched a barbell.",
    imageUrl: `https://images.unsplash.com/photo-1534438327276-14e5300c3a48${wide}`,
    avatarUrl: fallbackTrainers[1].avatarUrl,
    isFeatured: true,
    sortOrder: 2,
  },
  {
    id: "story-global-3",
    trainerId: null,
    title: "Gold at state powerlifting",
    authorName: "IronWorks Pune",
    excerpt:
      "We walked in as underdogs and left with three golds. This was the last twelve weeks of prep.",
    imageUrl: `https://images.unsplash.com/photo-1526506118085-60ce8714f8c5${wide}`,
    avatarUrl: fallbackTrainers[5].avatarUrl,
    isFeatured: true,
    sortOrder: 3,
  },
  {
    id: "story-global-4",
    trainerId: null,
    title: "75 Hard, day 60 of 75",
    authorName: "Rhea S.",
    excerpt:
      "Day 60 and my legs are shot, but I haven't missed a session yet. Some mornings the only win is showing up.",
    imageUrl: `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b${wide}`,
    avatarUrl: fallbackTrainers[3].avatarUrl,
    isFeatured: true,
    sortOrder: 4,
  },
];

const profileMedia = (trainer: Trainer): TrainerMedia[] => [
  {
    id: `${trainer.slug}-media-1`,
    trainerId: trainer.id,
    type: "video",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    posterUrl: `https://images.unsplash.com/photo-1534438327276-14e5300c3a48${wide}`,
    sortOrder: 1,
  },
  {
    id: `${trainer.slug}-media-2`,
    trainerId: trainer.id,
    type: "photo",
    url: trainer.heroImageUrl,
    posterUrl: null,
    sortOrder: 2,
  },
  {
    id: `${trainer.slug}-media-3`,
    trainerId: trainer.id,
    type: "photo",
    url: `https://images.unsplash.com/photo-1517836357463-d25dfeac3438${wide}`,
    posterUrl: null,
    sortOrder: 3,
  },
  {
    id: `${trainer.slug}-media-4`,
    trainerId: trainer.id,
    type: "photo",
    url: `https://images.unsplash.com/photo-1583454110551-21f2fa2afe61${wide}`,
    posterUrl: null,
    sortOrder: 4,
  },
];

const profilePricing = (trainer: Trainer): PricingOption[] => [
  {
    id: `${trainer.slug}-price-1`,
    trainerId: trainer.id,
    name: "Trial session",
    description: "45 min meet and assess",
    priceInr: null,
    unit: "first session",
    badge: "START HERE",
    sortOrder: 1,
  },
  {
    id: `${trainer.slug}-price-2`,
    trainerId: trainer.id,
    name: "Per session",
    description: "60 min pay as you go",
    priceInr: trainer.priceFromInr,
    unit: "per session",
    badge: null,
    sortOrder: 2,
  },
  {
    id: `${trainer.slug}-price-3`,
    trainerId: trainer.id,
    name: "Monthly plan",
    description: "12 sessions plus WhatsApp support",
    priceInr: Math.round(trainer.priceFromInr * 7.5),
    unit: "per month",
    badge: "SAVE 22%",
    sortOrder: 3,
  },
];

const profileTransformations = (trainer: Trainer): Transformation[] => [
  {
    id: `${trainer.slug}-transform-1`,
    trainerId: trainer.id,
    resultLabel: trainer.specialties.includes("Nutrition") ? "-9 kg" : "-14 kg",
    durationLabel: "6 months",
    beforeImageUrl: `https://images.unsplash.com/photo-1526401485004-46910ecc8e51${card}`,
    afterImageUrl: `https://images.unsplash.com/photo-1517836357463-d25dfeac3438${card}`,
    clientName: "Aarav R.",
    clientInitials: "AR",
    avatarColor: "#F02D28",
    review:
      "I came in unable to finish a single set. The plan rebuilt nutrition, sleep, and training in a way I could actually follow.",
    isConfirmed: true,
    sortOrder: 1,
  },
  {
    id: `${trainer.slug}-transform-2`,
    trainerId: trainer.id,
    resultLabel: trainer.specialties.includes("Boxing")
      ? "+30% stamina"
      : "First 100 kg deadlift",
    durationLabel: "4 months",
    beforeImageUrl: `https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5${card}`,
    afterImageUrl: `https://images.unsplash.com/photo-1583454110551-21f2fa2afe61${card}`,
    clientName: "Nikhil M.",
    clientInitials: "NM",
    avatarColor: "#3B8CFF",
    review:
      "The cueing was precise and the progression never felt random. I hit a goal I had been circling for years.",
    isConfirmed: true,
    sortOrder: 2,
  },
];

const profileReviews = (trainer: Trainer): TrainerReview[] => [
  {
    id: `${trainer.slug}-review-1`,
    trainerId: trainer.id,
    clientName: "Aarav R.",
    clientInitials: "AR",
    avatarColor: "#F02D28",
    rating: Math.min(5, trainer.rating + 0.1),
    reviewText: trainer.testimonial,
    whenLabel: "2 weeks ago",
    isVerified: true,
    sortOrder: 1,
  },
  {
    id: `${trainer.slug}-review-2`,
    trainerId: trainer.id,
    clientName: "Priya S.",
    clientInitials: "PS",
    avatarColor: "#3B8CFF",
    rating: trainer.rating,
    reviewText:
      "The sessions feel personal, measured, and motivating. I finally know why I am doing each exercise.",
    whenLabel: "1 month ago",
    isVerified: true,
    sortOrder: 2,
  },
];

const profileLocations = (trainer: Trainer): TrainerLocation[] => [
  {
    id: `${trainer.slug}-location-1`,
    trainerId: trainer.id,
    name: trainer.specialties.includes("Yoga")
      ? "The Breath Studio"
      : "IronWorks Strength Co.",
    area: `${trainer.area} - 4.2 km`,
    sortOrder: 1,
  },
  {
    id: `${trainer.slug}-location-2`,
    trainerId: trainer.id,
    name: "Cult.fit HSR Layout",
    area: "HSR Layout - 7.8 km",
    sortOrder: 2,
  },
];

const profileCredentials = (trainer: Trainer): TrainerCredential[] => [
  {
    id: `${trainer.slug}-credential-1`,
    trainerId: trainer.id,
    title: "Certified",
    subtitle: trainer.specialties.includes("Nutrition")
      ? "Registered dietitian document verified"
      : "NSCA-CSCS document verified",
    credentialType: "certified",
    isVerified: true,
    sortOrder: 1,
  },
  {
    id: `${trainer.slug}-credential-2`,
    trainerId: trainer.id,
    title: "ID Verified",
    subtitle: "Government ID confirmed",
    credentialType: "id",
    isVerified: trainer.isVerified,
    sortOrder: 2,
  },
  {
    id: `${trainer.slug}-credential-3`,
    trainerId: trainer.id,
    title: "First-aid trained",
    subtitle: "CPR and basic life support",
    credentialType: "medical",
    isVerified: true,
    sortOrder: 3,
  },
];

const profileStories = (trainer: Trainer): Story[] => [
  {
    id: `${trainer.slug}-story-1`,
    trainerId: trainer.id,
    title: `How ${trainer.firstName} structures a busy week`,
    authorName: trainer.firstName,
    excerpt:
      "Most clients do not need more motivation. They need a plan that survives real calendars, travel, and tired days.",
    imageUrl: `https://images.unsplash.com/photo-1534438327276-14e5300c3a48${wide}`,
    avatarUrl: trainer.avatarUrl,
    isFeatured: false,
    sortOrder: 1,
  },
  {
    id: `${trainer.slug}-story-2`,
    trainerId: trainer.id,
    title: "Why we film form every month",
    authorName: trainer.firstName,
    excerpt:
      "Progress becomes easier to trust when you can see movement getting cleaner, not just numbers going up.",
    imageUrl: `https://images.unsplash.com/photo-1526506118085-60ce8714f8c5${wide}`,
    avatarUrl: trainer.avatarUrl,
    isFeatured: false,
    sortOrder: 2,
  },
];

export function buildFallbackProfile(slug: string): TrainerProfile | null {
  const trainer = fallbackTrainers.find((item) => item.slug === slug);

  if (!trainer) {
    return null;
  }

  return {
    ...trainer,
    media: profileMedia(trainer),
    pricing: profilePricing(trainer),
    transformations: profileTransformations(trainer),
    stories: profileStories(trainer),
    reviews: profileReviews(trainer),
    locations: profileLocations(trainer),
    credentials: profileCredentials(trainer),
  };
}

export function buildFallbackProfileFromTrainer(trainer: Trainer): TrainerProfile {
  return {
    ...trainer,
    media: profileMedia(trainer),
    pricing: profilePricing(trainer),
    transformations: profileTransformations(trainer),
    stories: profileStories(trainer),
    reviews: profileReviews(trainer),
    locations: profileLocations(trainer),
    credentials: profileCredentials(trainer),
  };
}
