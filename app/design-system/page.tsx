import {
  BarChart3,
  Bell,
  Bookmark,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  Play,
  Search,
  User,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { Header } from "@/components/nav/header";
import { Pagination } from "@/components/nav/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CourseCard,
  LessonCard,
  ResourceCard,
} from "@/components/ui/card";
import { Input, SearchInput } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Status } from "@/components/ui/status";

const primarySwatches = [
  { name: "Primary 500", token: "bg-primary-500", hex: "#F97316" },
  { name: "Primary 400", token: "bg-primary-400", hex: "#FB923C" },
  { name: "Primary 300", token: "bg-primary-300", hex: "#FDBA74" },
  { name: "Primary 200", token: "bg-primary-200", hex: "#FED7AA" },
  { name: "Primary 100", token: "bg-primary-100", hex: "#FFEEE5" },
];

const neutralSwatches = [
  { name: "Neutral 900", token: "bg-neutral-900", hex: "#0F172A" },
  { name: "Neutral 700", token: "bg-neutral-700", hex: "#334155" },
  { name: "Neutral 500", token: "bg-neutral-500", hex: "#64748B" },
  { name: "Neutral 300", token: "bg-neutral-300", hex: "#CBD5E1" },
  { name: "Neutral 200", token: "bg-neutral-200", hex: "#E2E8F0" },
  { name: "Neutral 100", token: "bg-neutral-100", hex: "#F1F5F9" },
  { name: "Neutral 50", token: "bg-neutral-50", hex: "#FAFAFC" },
  { name: "White", token: "bg-white border border-neutral-200", hex: "#FFFFFF" },
];

const typeSamples = [
  { className: "font-display text-display-1 font-bold", label: "Display 1", sample: "Page titles" },
  { className: "font-display text-display-2 font-bold", label: "Display 2", sample: "Section titles" },
  { className: "text-heading-1 font-semibold", label: "Heading 1", sample: "Card titles" },
  { className: "text-heading-2 font-semibold", label: "Heading 2", sample: "Sub section" },
  { className: "text-heading-3 font-medium", label: "Heading 3", sample: "Small titles" },
  { className: "text-body-lg", label: "Body Large", sample: "Body copy for longer reading." },
  { className: "text-body", label: "Body", sample: "Supporting text across the UI." },
  { className: "text-small", label: "Small", sample: "Captions and meta." },
];

const spacingSteps = [4, 8, 12, 16, 24, 32, 40, 48, 64];

const radii = [
  { name: "xs", className: "rounded-xs" },
  { name: "sm", className: "rounded-sm" },
  { name: "md", className: "rounded-md" },
  { name: "lg", className: "rounded-lg" },
  { name: "xl", className: "rounded-xl" },
  { name: "full", className: "rounded-full" },
];

const shadows = [
  { name: "sm", className: "shadow-sm" },
  { name: "md", className: "shadow-md" },
  { name: "lg", className: "shadow-lg" },
  { name: "xl", className: "shadow-xl" },
];

const outlineIcons = [
  Bell,
  Search,
  Play,
  FileText,
  Bookmark,
  BarChart3,
  Clock,
  User,
  ChevronDown,
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 border-t border-neutral-200 pt-10">
      <h2 className="font-display text-display-2 font-bold text-neutral-900">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-12 flex flex-col gap-4">
        <Logo href={undefined} />
        <h1 className="font-display text-display-1 font-bold text-neutral-900">
          Design System
        </h1>
        <p className="max-w-2xl text-body-lg text-neutral-500">
          A unified design language for Vertex learning platform. Clean, modern
          and focused on clarity, consistency and intuitive learning experiences.
        </p>
        <p className="text-small text-neutral-500">Version 1.0 — May 2025</p>
      </header>

      <div className="flex flex-col gap-16">
        <Section id="colors" title="01 Colors">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-heading-3 font-medium">Primary</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {primarySwatches.map((swatch) => (
                  <div key={swatch.name} className="flex flex-col gap-2">
                    <div className={`h-16 rounded-md ${swatch.token}`} />
                    <p className="text-small font-medium text-neutral-900">
                      {swatch.name}
                    </p>
                    <p className="text-small text-neutral-500">{swatch.hex}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-heading-3 font-medium">Neutral</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {neutralSwatches.map((swatch) => (
                  <div key={swatch.name} className="flex flex-col gap-2">
                    <div className={`h-16 rounded-md ${swatch.token}`} />
                    <p className="text-small font-medium text-neutral-900">
                      {swatch.name}
                    </p>
                    <p className="text-small text-neutral-500">{swatch.hex}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section id="typography" title="02 Typography">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-md border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="font-display text-display-2 font-bold">Aa</p>
              <p className="mt-2 text-heading-3 font-medium">Playfair Display</p>
              <p className="text-body text-neutral-500">
                Elegant · Readable · Timeless
              </p>
            </div>
            <div className="rounded-md border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="text-display-2 font-semibold">Aa</p>
              <p className="mt-2 text-heading-3 font-medium">Inter</p>
              <p className="text-body text-neutral-500">
                Clean · Modern · Highly legible
              </p>
            </div>
          </div>
        </Section>

        <Section id="type-scale" title="03 Type Scale">
          <div className="flex flex-col gap-5">
            {typeSamples.map((item) => (
              <div
                key={item.label}
                className="grid gap-2 border-b border-neutral-100 pb-4 last:border-0 sm:grid-cols-[140px_1fr]"
              >
                <p className="text-small font-medium text-neutral-500">
                  {item.label}
                </p>
                <p className={`${item.className} text-neutral-900`}>
                  {item.sample}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="spacing" title="04 Spacing System">
          <p className="mb-4 text-body text-neutral-500">Base unit: 4px</p>
          <div className="flex flex-wrap items-end gap-4">
            {spacingSteps.map((step) => (
              <div key={step} className="flex flex-col items-center gap-2">
                <div
                  className="rounded-xs bg-primary-500"
                  style={{ width: step, height: step }}
                />
                <p className="text-small text-neutral-500">{step}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="radius-shadows" title="05 Radius & Shadows">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-heading-3 font-medium">Radius</h3>
              <div className="flex flex-wrap gap-4">
                {radii.map((item) => (
                  <div key={item.name} className="flex flex-col items-center gap-2">
                    <div
                      className={`size-16 border border-neutral-200 bg-white ${item.className}`}
                    />
                    <p className="text-small text-neutral-500">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-heading-3 font-medium">Shadows</h3>
              <div className="flex flex-wrap gap-4">
                {shadows.map((item) => (
                  <div key={item.name} className="flex flex-col items-center gap-2">
                    <div
                      className={`size-16 rounded-md border border-neutral-100 bg-white ${item.className}`}
                    />
                    <p className="text-small text-neutral-500">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section id="icons" title="06 Icons">
          <p className="mb-4 text-body text-neutral-500">
            24×24 · 2px stroke · rounded caps
          </p>
          <div className="flex flex-wrap gap-4 text-neutral-700">
            {outlineIcons.map((Icon) => (
              <div
                key={Icon.displayName ?? Icon.name}
                className="flex size-12 items-center justify-center rounded-md border border-neutral-200 bg-white"
              >
                <Icon className="size-6" strokeWidth={2} aria-hidden="true" />
              </div>
            ))}
          </div>
        </Section>

        <Section id="buttons" title="07 Buttons">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="tertiary">
                Tertiary
                <ExternalLink className="size-4" strokeWidth={2} aria-hidden="true" />
              </Button>
              <Button variant="text">
                <Play className="size-4" strokeWidth={2} aria-hidden="true" />
                Text
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled>Primary disabled</Button>
              <Button variant="secondary" disabled>
                Secondary disabled
              </Button>
            </div>
          </div>
        </Section>

        <Section id="inputs" title="08 Inputs">
          <div className="grid max-w-xl gap-4">
            <SearchInput />
            <Input placeholder="Text input" />
            <Select defaultValue="all">
              <option value="all">All courses</option>
              <option value="beginner">Beginner</option>
              <option value="advanced">Advanced</option>
            </Select>
          </div>
        </Section>

        <Section id="badges" title="09 Badges / Tags">
          <div className="flex flex-wrap gap-3">
            <Badge variant="video">VIDEO</Badge>
            <Badge variant="lesson">LESSON</Badge>
            <Badge variant="popular">POPULAR</Badge>
          </div>
        </Section>

        <Section id="status" title="10 Status / Indicators">
          <div className="flex flex-wrap gap-6">
            <Status status="in-progress" />
            <Status status="completed" />
            <Status status="now-playing" />
            <Status status="locked" />
          </div>
        </Section>

        <Section id="progress" title="11 Progress Bar">
          <div className="max-w-md">
            <Progress value={35} />
          </div>
        </Section>

        <Section id="cards" title="12 Cards">
          <div className="grid gap-6 lg:grid-cols-2">
            <CourseCard
              title="Next.js for Production"
              description="Ship reliable Next.js apps with patterns used in real production systems."
              level="Intermediate"
              duration="6h 20m"
              moduleCount="8 modules"
            />
            <div className="flex flex-col gap-4">
              <LessonCard
                variant="video"
                title="Caching and revalidation"
                description="Match the exact second where caching strategies are taught."
                lessonLabel="Lesson 5.1"
                duration="12:40"
                actionLabel="Watch from 2:14"
              />
              <LessonCard
                variant="lesson"
                title="Data fetching patterns"
                description="Learn when to fetch on the server versus the client."
                lessonLabel="Lesson 5.2"
                duration="18:05"
                actionLabel="View lesson"
              />
              <ResourceCard
                title="Lesson cheat sheet"
                description="Quick reference for fetch, cache, and revalidate."
                fileMeta="PDF · 1.2 MB"
              />
            </div>
          </div>
        </Section>

        <Section id="navigation" title="13 Navigation">
          <div className="flex flex-col gap-8 overflow-hidden rounded-md border border-neutral-200 bg-white shadow-sm">
            <Header activeHref="/courses" />
            <div className="flex flex-col gap-6 px-6 pb-6">
              <Breadcrumbs
                items={[
                  { label: "All Courses", href: "#" },
                  { label: "Next.js for Production", href: "#" },
                  { label: "Data Fetching & Caching" },
                ]}
              />
              <Pagination page={1} totalPages={8} />
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}
