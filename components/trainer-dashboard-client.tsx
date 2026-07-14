"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Camera,
  Check,
  ChevronRight,
  ClipboardCheck,
  Dumbbell,
  Eye,
  ImagePlus,
  LogIn,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
} from "lucide-react";

type DashboardStep =
  | "essentials"
  | "media"
  | "services"
  | "proof"
  | "contact"
  | "analytics"
  | "approval";

type AuthMode = "signin" | "signup";
type ApprovalStatus = "draft" | "review";

type UploadedAsset = {
  id: string;
  url: string;
  name: string;
};

const specialtyOptions = [
  "Strength",
  "Weight loss",
  "Yoga",
  "Boxing",
  "Sports",
  "Nutrition",
  "Mobility",
  "Rehab",
];

const steps: {
  id: DashboardStep;
  label: string;
  detail: string;
  icon: typeof User;
}[] = [
  {
    id: "essentials",
    label: "Profile basics",
    detail: "Name, cover, specialty, bio",
    icon: User,
  },
  {
    id: "media",
    label: "Photos",
    detail: "Avatar, gallery, training media",
    icon: Camera,
  },
  {
    id: "services",
    label: "Services",
    detail: "Pricing, locations, schedule",
    icon: Dumbbell,
  },
  {
    id: "proof",
    label: "Proof",
    detail: "Results, stories, credentials",
    icon: ShieldCheck,
  },
  {
    id: "contact",
    label: "Contact",
    detail: "WhatsApp and reply settings",
    icon: MessageCircle,
  },
  {
    id: "analytics",
    label: "Analytics",
    detail: "Visits, calls, lead intent",
    icon: BarChart3,
  },
  {
    id: "approval",
    label: "Approval",
    detail: "Final review and submit",
    icon: ClipboardCheck,
  },
];

const initialGallery = [
  {
    id: "gallery-1",
    url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=78&w=900",
    name: "Strength floor",
  },
  {
    id: "gallery-2",
    url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=78&w=900",
    name: "Client session",
  },
];

const defaultCover =
  "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&q=80&w=1600";
const defaultAvatar =
  "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=78&w=420";

function fileAssets(files: FileList | null) {
  if (!files) {
    return [];
  }

  return Array.from(files)
    .filter((file) => file.type.startsWith("image/"))
    .map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }));
}

function sanitizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function completionPercent(checks: boolean[]) {
  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

function AuthGate({ onEnter }: { onEnter: () => void }) {
  const [mode, setMode] = useState<AuthMode>("signup");

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-48px)] max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
        <section>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-white"
          >
            <ChevronRight aria-hidden="true" size={16} className="rotate-180" />
            Back home
          </Link>
          <div className="mt-10 max-w-2xl">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-brand-light">
              TrainedRight for trainers
            </p>
            <h1 className="mt-4 font-display text-[48px] font-black leading-none text-white sm:text-[68px]">
              Build your coach profile, then send it for approval.
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-soft">
              Start with the essentials: name, cover image, specialties, and
              description. Add media, services, proof, and WhatsApp contact when
              you are ready.
            </p>
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-panel p-5 shadow-2xl shadow-black/30">
          <div className="grid grid-cols-2 rounded-full border border-white/10 bg-black/30 p-1">
            {(["signup", "signin"] as AuthMode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-full px-4 py-2.5 text-sm font-extrabold transition ${
                  mode === item
                    ? "bg-brand text-white"
                    : "text-muted hover:text-white"
                }`}
              >
                {item === "signup" ? "Sign up" : "Log in"}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {mode === "signup" ? (
              <label className="block">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
                  Trainer name
                </span>
                <input
                  className="mt-2 h-12 w-full rounded-[14px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition focus:border-brand"
                  placeholder="Vikram Rao"
                />
              </label>
            ) : null}
            <label className="block">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
                Email
              </span>
              <input
                type="email"
                className="mt-2 h-12 w-full rounded-[14px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition focus:border-brand"
                placeholder="coach@example.com"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
                Password
              </span>
              <input
                type="password"
                className="mt-2 h-12 w-full rounded-[14px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition focus:border-brand"
                placeholder="••••••••"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={onEnter}
            className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-brand px-4 text-sm font-extrabold text-white transition hover:bg-brand-dark"
          >
            <LogIn aria-hidden="true" size={18} />
            Continue to dashboard
          </button>
        </section>
      </div>
    </main>
  );
}

function UploadControl({
  label,
  icon: Icon,
  onUpload,
  multiple = false,
}: {
  label: string;
  icon: typeof Upload;
  onUpload: (files: FileList | null) => void;
  multiple?: boolean;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] font-extrabold text-white transition hover:border-brand/50 hover:text-brand-light">
      <Icon aria-hidden="true" size={15} />
      {label}
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        className="sr-only"
        onChange={(event) => onUpload(event.target.files)}
      />
    </label>
  );
}

export function TrainerDashboardClient() {
  const [authenticated, setAuthenticated] = useState(false);
  const [activeStep, setActiveStep] = useState<DashboardStep>("essentials");
  const [approvalStatus, setApprovalStatus] =
    useState<ApprovalStatus>("draft");
  const [trainerName, setTrainerName] = useState("Vikram Rao");
  const [description, setDescription] = useState(
    "Ex-national powerlifter turned coach. I build progressive strength programs around your schedule and track every session, with clean technique, smart nutrition, and no guesswork.",
  );
  const [specialties, setSpecialties] = useState(["Strength", "Weight loss"]);
  const [coverImage, setCoverImage] = useState(defaultCover);
  const [avatarImage, setAvatarImage] = useState(defaultAvatar);
  const [gallery, setGallery] = useState<UploadedAsset[]>(initialGallery);
  const [whatsappNumber, setWhatsappNumber] = useState("919876543210");
  const [city, setCity] = useState("Bengaluru");
  const [area, setArea] = useState("Indiranagar");
  const [price, setPrice] = useState("800");
  const [packageName, setPackageName] = useState("1:1 strength session");
  const [location, setLocation] = useState("IronWorks Strength Co.");
  const [credential, setCredential] = useState("NSCA Certified Strength Coach");
  const [storyTitle, setStoryTitle] = useState("How I train around a desk job");
  const [transformationResult, setTransformationResult] = useState("-14 kg");

  const requiredChecks = useMemo(
    () => [
      trainerName.trim().length > 1,
      Boolean(coverImage),
      specialties.length > 0,
      description.trim().length >= 80,
    ],
    [coverImage, description, specialties.length, trainerName],
  );
  const requiredReady = requiredChecks.every(Boolean);
  const percent = completionPercent([
    ...requiredChecks,
    Boolean(avatarImage),
    gallery.length > 0,
    sanitizePhone(whatsappNumber).length >= 10,
    Boolean(price.trim()),
    Boolean(credential.trim()),
    Boolean(storyTitle.trim()),
  ]);
  const whatsappHref = `https://wa.me/${sanitizePhone(
    whatsappNumber,
  )}?text=${encodeURIComponent(
    `Hi ${trainerName}, I found your profile on TrainedRight and want to ask about training.`,
  )}`;

  if (!authenticated) {
    return <AuthGate onEnter={() => setAuthenticated(true)} />;
  }

  function toggleSpecialty(item: string) {
    setSpecialties((current) =>
      current.includes(item)
        ? current.filter((specialty) => specialty !== item)
        : [...current, item],
    );
  }

  return (
    <main className="min-h-screen bg-background text-white">
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="font-display text-[18px] font-black uppercase tracking-[-0.02em] text-white"
          >
            TrainedRight
          </Link>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1.5 text-[11px] font-extrabold uppercase ${
                approvalStatus === "review"
                  ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
                  : "border-white/10 bg-panel text-muted"
              }`}
            >
              {approvalStatus === "review" ? "In admin review" : "Draft"}
            </span>
            <Link
              href="/trainers/vikram-rao"
              className="hidden rounded-full border border-white/10 bg-panel px-4 py-2 text-sm font-bold text-white transition hover:border-brand/50 md:inline-flex"
            >
              View profile
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)_330px] lg:px-8">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[22px] border border-white/10 bg-panel p-4">
            <div className="mb-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
                Profile readiness
              </p>
              <div className="mt-2 flex items-end justify-between">
                <span className="font-display text-[34px] font-black leading-none text-white">
                  {percent}%
                </span>
                <span className="text-[11px] font-bold text-muted">
                  Required {requiredChecks.filter(Boolean).length}/4
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <nav className="space-y-2">
              {steps.map((step) => {
                const Icon = step.icon;
                const active = activeStep === step.id;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className={`flex w-full items-center gap-3 rounded-[16px] border p-3 text-left transition ${
                      active
                        ? "border-brand/50 bg-brand/10"
                        : "border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className={`grid h-10 w-10 flex-none place-items-center rounded-[13px] ${
                        active
                          ? "bg-brand text-white"
                          : "bg-white/[0.06] text-soft"
                      }`}
                    >
                      <Icon aria-hidden="true" size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold text-white">
                        {step.label}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] font-medium text-muted">
                        {step.detail}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <section className="min-w-0">
          <DashboardStepPanel
            activeStep={activeStep}
            trainerName={trainerName}
            setTrainerName={setTrainerName}
            description={description}
            setDescription={setDescription}
            specialties={specialties}
            toggleSpecialty={toggleSpecialty}
            coverImage={coverImage}
            setCoverImage={setCoverImage}
            avatarImage={avatarImage}
            setAvatarImage={setAvatarImage}
            gallery={gallery}
            setGallery={setGallery}
            whatsappNumber={whatsappNumber}
            setWhatsappNumber={setWhatsappNumber}
            city={city}
            setCity={setCity}
            area={area}
            setArea={setArea}
            price={price}
            setPrice={setPrice}
            packageName={packageName}
            setPackageName={setPackageName}
            location={location}
            setLocation={setLocation}
            credential={credential}
            setCredential={setCredential}
            storyTitle={storyTitle}
            setStoryTitle={setStoryTitle}
            transformationResult={transformationResult}
            setTransformationResult={setTransformationResult}
            requiredReady={requiredReady}
            approvalStatus={approvalStatus}
            onSubmitApproval={() => setApprovalStatus("review")}
            whatsappHref={whatsappHref}
          />
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <ProfilePreview
            trainerName={trainerName}
            coverImage={coverImage}
            avatarImage={avatarImage}
            specialties={specialties}
            description={description}
            price={price}
            city={city}
          />
          <AnalyticsPreview />
        </aside>
      </div>
    </main>
  );
}

function DashboardStepPanel(props: {
  activeStep: DashboardStep;
  trainerName: string;
  setTrainerName: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  specialties: string[];
  toggleSpecialty: (value: string) => void;
  coverImage: string;
  setCoverImage: (value: string) => void;
  avatarImage: string;
  setAvatarImage: (value: string) => void;
  gallery: UploadedAsset[];
  setGallery: (value: UploadedAsset[]) => void;
  whatsappNumber: string;
  setWhatsappNumber: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  area: string;
  setArea: (value: string) => void;
  price: string;
  setPrice: (value: string) => void;
  packageName: string;
  setPackageName: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  credential: string;
  setCredential: (value: string) => void;
  storyTitle: string;
  setStoryTitle: (value: string) => void;
  transformationResult: string;
  setTransformationResult: (value: string) => void;
  requiredReady: boolean;
  approvalStatus: ApprovalStatus;
  onSubmitApproval: () => void;
  whatsappHref: string;
}) {
  if (props.activeStep === "media") {
    return <MediaStep {...props} />;
  }

  if (props.activeStep === "services") {
    return <ServicesStep {...props} />;
  }

  if (props.activeStep === "proof") {
    return <ProofStep {...props} />;
  }

  if (props.activeStep === "contact") {
    return <ContactStep {...props} />;
  }

  if (props.activeStep === "analytics") {
    return <AnalyticsStep />;
  }

  if (props.activeStep === "approval") {
    return <ApprovalStep {...props} />;
  }

  return <EssentialsStep {...props} />;
}

function PanelShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-panel p-4 md:p-6">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-light">
        {eyebrow}
      </p>
      <h1 className="mt-2 font-display text-[32px] font-black leading-none text-white md:text-[42px]">
        {title}
      </h1>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-[14px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition focus:border-brand"
      />
    </label>
  );
}

function EssentialsStep(props: Parameters<typeof DashboardStepPanel>[0]) {
  return (
    <PanelShell eyebrow="Step 1" title="Start with what must be approved.">
      <div className="grid gap-5">
        <div className="relative h-[300px] overflow-hidden rounded-[20px] border border-white/10 bg-black">
          <Image
            src={props.coverImage}
            alt=""
            fill
            unoptimized={props.coverImage.startsWith("blob:")}
            className="object-cover opacity-85"
            sizes="(min-width: 1024px) 680px, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/60">
                Cover image
              </p>
              <h2 className="mt-1 font-display text-[30px] font-black leading-none text-white">
                {props.trainerName || "Trainer name"}
              </h2>
            </div>
            <UploadControl
              label="Upload cover"
              icon={ImagePlus}
              onUpload={(files) => {
                const [asset] = fileAssets(files);
                if (asset) {
                  props.setCoverImage(asset.url);
                }
              }}
            />
          </div>
        </div>

        <TextInput
          label="Trainer name"
          value={props.trainerName}
          onChange={props.setTrainerName}
          placeholder="Your public profile name"
        />

        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
            Description
          </span>
          <textarea
            value={props.description}
            onChange={(event) => props.setDescription(event.target.value)}
            rows={5}
            className="mt-2 w-full resize-none rounded-[14px] border border-white/10 bg-black/30 px-4 py-3 text-sm font-medium leading-6 text-white outline-none transition focus:border-brand"
          />
        </label>

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
            Specialties
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {specialtyOptions.map((item) => {
              const active = props.specialties.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => props.toggleSpecialty(item)}
                  className={`rounded-full border px-3 py-2 text-[12px] font-extrabold transition ${
                    active
                      ? "border-brand bg-brand text-white"
                      : "border-white/10 bg-white/[0.04] text-soft hover:border-brand/50"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </PanelShell>
  );
}

function MediaStep(props: Parameters<typeof DashboardStepPanel>[0]) {
  return (
    <PanelShell eyebrow="Step 2" title="Upload the media clients inspect first.">
      <div className="grid gap-5">
        <div className="flex flex-wrap items-center gap-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
          <span className="relative h-24 w-24 overflow-hidden rounded-full border border-white/10">
            <Image
              src={props.avatarImage}
              alt=""
              fill
              unoptimized={props.avatarImage.startsWith("blob:")}
              className="object-cover"
              sizes="96px"
            />
          </span>
          <div className="min-w-[220px] flex-1">
            <h2 className="font-display text-[22px] font-black text-white">
              Profile photo
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              This appears in cards, stories, and search results.
            </p>
          </div>
          <UploadControl
            label="Upload avatar"
            icon={Upload}
            onUpload={(files) => {
              const [asset] = fileAssets(files);
              if (asset) {
                props.setAvatarImage(asset.url);
              }
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-[22px] font-black text-white">
            Photos and videos
          </h2>
          <UploadControl
            label="Add media"
            icon={ImagePlus}
            multiple
            onUpload={(files) => {
              const nextAssets = fileAssets(files);
              if (nextAssets.length > 0) {
                props.setGallery([...props.gallery, ...nextAssets]);
              }
            }}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {props.gallery.map((asset) => (
            <div
              key={asset.id}
              className="relative h-48 overflow-hidden rounded-[18px] border border-white/10 bg-black"
            >
              <Image
                src={asset.url}
                alt=""
                fill
                unoptimized={asset.url.startsWith("blob:")}
                className="object-cover"
                sizes="(min-width: 768px) 300px, 100vw"
              />
              <span className="absolute bottom-3 left-3 max-w-[80%] truncate rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur">
                {asset.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </PanelShell>
  );
}

function ServicesStep(props: Parameters<typeof DashboardStepPanel>[0]) {
  return (
    <PanelShell eyebrow="Step 3" title="Shape the offer clients can book.">
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Package name"
          value={props.packageName}
          onChange={props.setPackageName}
        />
        <TextInput
          label="Price from"
          value={props.price}
          onChange={props.setPrice}
          type="number"
        />
        <TextInput label="City" value={props.city} onChange={props.setCity} />
        <TextInput label="Area" value={props.area} onChange={props.setArea} />
        <div className="md:col-span-2">
          <TextInput
            label="Primary training location"
            value={props.location}
            onChange={props.setLocation}
          />
        </div>
      </div>
      <div className="mt-5 rounded-[18px] border border-brand/25 bg-brand/10 p-4">
        <p className="text-sm font-bold leading-6 text-white">
          The public profile will show pricing, locations, trial booking, and a
          WhatsApp contact action after admin approval.
        </p>
      </div>
    </PanelShell>
  );
}

function ProofStep(props: Parameters<typeof DashboardStepPanel>[0]) {
  return (
    <PanelShell eyebrow="Step 4" title="Add trust signals when you have them.">
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Transformation result"
          value={props.transformationResult}
          onChange={props.setTransformationResult}
        />
        <TextInput
          label="Credential"
          value={props.credential}
          onChange={props.setCredential}
        />
        <div className="md:col-span-2">
          <TextInput
            label="Story title"
            value={props.storyTitle}
            onChange={props.setStoryTitle}
          />
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {["Client transformations", "Stories", "Reviews"].map((item) => (
          <div
            key={item}
            className="rounded-[16px] border border-white/10 bg-black/20 p-4"
          >
            <Sparkles aria-hidden="true" size={18} className="text-brand-light" />
            <h3 className="mt-3 text-sm font-extrabold text-white">{item}</h3>
            <p className="mt-1 text-[12px] leading-5 text-muted">
              Can be completed after the required approval fields.
            </p>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function ContactStep(props: Parameters<typeof DashboardStepPanel>[0]) {
  return (
    <PanelShell eyebrow="Step 5" title="Route client conversations to WhatsApp.">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <TextInput
          label="WhatsApp number"
          value={props.whatsappNumber}
          onChange={props.setWhatsappNumber}
          placeholder="919876543210"
        />
        <a
          href={props.whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="flex h-12 items-center justify-center gap-2 self-end rounded-[14px] bg-emerald-500 px-4 text-sm font-extrabold text-black transition hover:bg-emerald-400"
        >
          <MessageCircle aria-hidden="true" size={18} />
          Test WhatsApp
        </a>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          ["Reply target", "Under 2 hrs"],
          ["Lead source", "Profile CTA"],
          ["Client action", "WhatsApp chat"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[16px] border border-white/10 bg-black/20 p-4"
          >
            <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
              {label}
            </p>
            <p className="mt-2 font-display text-[20px] font-black text-white">
              {value}
            </p>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function AnalyticsStep() {
  return (
    <PanelShell eyebrow="Insights" title="Track demand before and after approval.">
      <div className="grid gap-3 md:grid-cols-2">
        {analytics.map((item) => (
          <div
            key={item.label}
            className="rounded-[18px] border border-white/10 bg-black/20 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
                {item.label}
              </p>
              <span
                className={`text-[11px] font-extrabold ${
                  item.delta.startsWith("+")
                    ? "text-emerald-300"
                    : "text-muted"
                }`}
              >
                {item.delta}
              </span>
            </div>
            <p className="mt-3 font-display text-[32px] font-black leading-none text-white">
              {item.value}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-[18px] border border-white/10 bg-black/20 p-4">
        <div className="flex h-36 items-end gap-2">
          {[42, 54, 49, 68, 72, 88, 80, 96].map((height, index) => (
            <span
              key={height + index}
              className="flex-1 rounded-t-[10px] bg-brand"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <p className="mt-3 text-[12px] font-bold text-muted">
          Weekly profile visits trend
        </p>
      </div>
    </PanelShell>
  );
}

function ApprovalStep(props: Parameters<typeof DashboardStepPanel>[0]) {
  const checklist = [
    ["Trainer name", props.trainerName.trim().length > 1],
    ["Cover image", Boolean(props.coverImage)],
    ["Specialties", props.specialties.length > 0],
    ["Description", props.description.trim().length >= 80],
    ["WhatsApp number", sanitizePhone(props.whatsappNumber).length >= 10],
  ] as const;

  return (
    <PanelShell eyebrow="Final step" title="Send the profile to admin review.">
      <div className="space-y-2">
        {checklist.map(([label, done]) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-black/20 p-3"
          >
            <span
              className={`grid h-8 w-8 place-items-center rounded-full ${
                done ? "bg-emerald-400 text-black" : "bg-white/10 text-muted"
              }`}
            >
              <Check aria-hidden="true" size={15} />
            </span>
            <span className="text-sm font-bold text-white">{label}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={!props.requiredReady || props.approvalStatus === "review"}
        onClick={props.onSubmitApproval}
        className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-brand px-4 text-sm font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
      >
        <Send aria-hidden="true" size={18} />
        {props.approvalStatus === "review"
          ? "Sent for admin approval"
          : "Submit for approval"}
      </button>
    </PanelShell>
  );
}

function ProfilePreview({
  trainerName,
  coverImage,
  avatarImage,
  specialties,
  description,
  price,
  city,
}: {
  trainerName: string;
  coverImage: string;
  avatarImage: string;
  specialties: string[];
  description: string;
  price: string;
  city: string;
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-white/10 bg-panel">
      <div className="relative h-44">
        <Image
          src={coverImage}
          alt=""
          fill
          unoptimized={coverImage.startsWith("blob:")}
          className="object-cover"
          sizes="330px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
      </div>
      <div className="p-4">
        <span className="relative -mt-12 mb-3 block h-20 w-20 overflow-hidden rounded-full border-4 border-panel">
          <Image
            src={avatarImage}
            alt=""
            fill
            unoptimized={avatarImage.startsWith("blob:")}
            className="object-cover"
            sizes="80px"
          />
        </span>
        <h2 className="font-display text-[26px] font-black leading-none text-white">
          {trainerName || "Trainer name"}
        </h2>
        <p className="mt-2 line-clamp-3 text-[13px] leading-6 text-muted">
          {description}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {specialties.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-extrabold text-soft"
            >
              {item}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-[14px] border border-white/10 bg-black/20 p-3">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-soft">
            <Eye aria-hidden="true" size={14} />
            Public preview
          </span>
          <span className="text-[12px] font-extrabold text-white">
            ₹{Number(price || 0).toLocaleString("en-IN")} · {city}
          </span>
        </div>
      </div>
    </div>
  );
}

const analytics = [
  { label: "Profile visits", value: "1,284", delta: "+18%" },
  { label: "WhatsApp taps", value: "96", delta: "+12%" },
  { label: "Calls", value: "32", delta: "+6%" },
  { label: "Saves", value: "118", delta: "+22%" },
];

function AnalyticsPreview() {
  return (
    <div className="rounded-[22px] border border-white/10 bg-panel p-4">
      <h2 className="font-display text-[20px] font-black text-white">
        Analytics snapshot
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {analytics.map((item) => (
          <div
            key={item.label}
            className="rounded-[15px] border border-white/10 bg-black/20 p-3"
          >
            <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted">
              {item.label}
            </p>
            <p className="mt-2 font-display text-[24px] font-black leading-none text-white">
              {item.value}
            </p>
            <p className="mt-1 text-[11px] font-bold text-emerald-300">
              {item.delta}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[15px] border border-white/10 bg-black/20 p-3">
        <p className="inline-flex items-center gap-2 text-[12px] font-bold text-soft">
          <Phone aria-hidden="true" size={14} />
          Call tracking and WhatsApp taps are separated.
        </p>
      </div>
    </div>
  );
}
