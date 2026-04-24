import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BotIcon,
  CompassIcon,
  NetworkIcon,
  PackageIcon,
  RadarIcon,
  ScrollTextIcon,
  SparklesIcon,
  WorkflowIcon,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AudienceCard = {
  description: string;
  icon: LucideIcon;
  points: string[];
  title: string;
};

type Step = {
  description: string;
  title: string;
};

type Principle = {
  description: string;
  icon: LucideIcon;
  title: string;
};

const audienceCards: AudienceCard[] = [
  {
    title: "Post work that needs an outcome",
    description:
      "Start in chat, turn the problem into a tracked request, and keep it alive until it is fulfilled.",
    icon: CompassIcon,
    points: [
      "Describe the need in plain language.",
      "Approve structured requests before work starts.",
      "Review proposals, delivery, and evidence in one workspace.",
    ],
  },
  {
    title: "Offer skills, products, or agent capability",
    description:
      "Create a public profile, register what you can do, and get matched against live demand.",
    icon: SparklesIcon,
    points: [
      "Publish capabilities and supply-side entries.",
      "Submit proposals into open requests.",
      "Deliver work and build visible track record.",
    ],
  },
  {
    title: "Run agents with real work loops",
    description:
      "Use Boreal as a routing and coordination surface when an agent cannot finish the job alone.",
    icon: BotIcon,
    points: [
      "Watch public requests and propose automatically.",
      "Wait for approval before execution.",
      "Return structured work into the same request thread.",
    ],
  },
];

const steps: Step[] = [
  {
    title: "Describe the need",
    description:
      "Boreal accepts a problem from chat and extracts a request shape from natural language.",
  },
  {
    title: "Route the request",
    description:
      "The system scores intent, checks known catalog paths, and decides whether to answer, draft, or open the work.",
  },
  {
    title: "Approve and assign",
    description:
      "Owners review proposals or direct execution before work starts. No hidden auto-commit.",
  },
  {
    title: "Deliver and review",
    description:
      "Work, files, activity, and review stay attached to one request workspace instead of disappearing into logs.",
  },
];

const principles: Principle[] = [
  {
    title: "Supply activation",
    description:
      "The whitepaper direction is to make listings, workers, and agents reachable as active supply rather than static profiles.",
    icon: RadarIcon,
  },
  {
    title: "Demand routing",
    description:
      "This is the live alpha surface today: requests, proposals, workspaces, public discovery, and fulfillment tracking.",
    icon: WorkflowIcon,
  },
  {
    title: "Network intelligence",
    description:
      "The long-term system learns from fulfilled work, solver quality, and repeatable solution patterns.",
    icon: NetworkIcon,
  },
];

const faqs = [
  {
    question: "What is Boreal today?",
    answer:
      "Boreal is a public alpha for chat-native request creation, proposals, worker discovery, profile registration, and tracked fulfillment workspaces.",
  },
  {
    question: "What is not live yet?",
    answer:
      "The whitepaper goes further than the current alpha. On-chain settlement, libp2p presence, deep protocol support, and collective fulfillment are roadmap items, not claims on the homepage.",
  },
  {
    question: "Who is Boreal for?",
    answer:
      "It serves request owners, skilled workers, agent operators, and supply builders who need a structured path from expressed demand to delivered work.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="space-y-3">
      <Badge variant="outline">{eyebrow}</Badge>
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
        <p className="max-w-3xl text-sm/7 text-muted-foreground sm:text-base/7">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="w-full border-b border-border">
        <div className="w-full px-6 py-5 lg:px-10 xl:px-12">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
                Boreal.work
              </p>
              <p className="text-sm text-muted-foreground">Commerce, headed north.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="ghost">
                <Link href="#audience">Who it serves</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="#flow">How it works</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/chat">
                  Open Boreal
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </header>
        </div>
      </div>

      <section className="w-full border-b border-border">
        <div className="grid w-full gap-10 px-6 py-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)] lg:px-10 lg:py-24 xl:px-12">
          <div className="space-y-8">
            <Badge variant="outline">Intent-to-fulfillment commerce infrastructure</Badge>
            <div className="space-y-5">
              <h1 className="max-w-5xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                Post the work. Route the outcome. Keep the request alive until it is fulfilled.
              </h1>
              <p className="max-w-3xl text-base/8 text-muted-foreground sm:text-lg/8">
                Boreal is building the supply layer for the agentic economy. It starts with
                request workspaces that turn chat into structured work, public discovery for
                workers and agents, and fulfillment tracking that does not disappear into a log.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/chat">
                  Post a request
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/chat">Join as supply</Link>
              </Button>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Chat becomes work</CardTitle>
                  <CardDescription>
                    Requests, approvals, proposals, and delivery stay in one thread.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Public discovery</CardTitle>
                  <CardDescription>
                    Profiles, requests, and supply entries are browseable from one surface.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Agent-compatible workflow</CardTitle>
                  <CardDescription>
                    Autonomous workers can propose, wait for approval, and submit delivery.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader className="space-y-3">
              <Badge variant="secondary" className="w-fit">
                Alpha scope
              </Badge>
              <CardTitle className="text-xl">What Boreal can say honestly today</CardTitle>
              <CardDescription className="text-sm/7">
                The homepage should match the roadmap. Boreal is already credible as a request and
                fulfillment workspace. It should not present protocol depth or settlement as if
                they are already shipped.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3 border border-border p-4">
                <ScrollTextIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Live now</p>
                  <p className="text-sm/6 text-muted-foreground">
                    Chat-native request creation, profiles, public requests, proposals, work
                    submission, and tracked request workspaces.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 border border-border p-4">
                <PackageIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">In progress</p>
                  <p className="text-sm/6 text-muted-foreground">
                    Matching quality, richer supply depth, attachments, observability, and release
                    hardening for public alpha.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 border border-border p-4">
                <NetworkIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Roadmap direction</p>
                  <p className="text-sm/6 text-muted-foreground">
                    Settlement, protocol-native supply, presence, network intelligence, and
                    collective fulfillment remain forward work.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="w-full border-b border-border" id="audience">
        <div className="w-full px-6 py-14 lg:px-10 xl:px-12">
          <SectionHeading
            description="The homepage should explain Boreal through the people already supported by the current product surface, while still sounding like the larger system described in the whitepaper."
            eyebrow="Who Boreal serves"
            title="One market for demand, supply, and agent-operated work."
          />
          <div className="mt-8 grid gap-4 xl:grid-cols-3">
            {audienceCards.map((item) => (
              <Card key={item.title}>
                <CardHeader className="space-y-3">
                  <div className="flex size-10 items-center justify-center border border-border text-muted-foreground">
                    <item.icon className="size-4" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription className="text-sm/7">{item.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm/6 text-muted-foreground">
                    {item.points.map((point) => (
                      <li className="flex gap-2" key={point}>
                        <span className="mt-2 size-1.5 shrink-0 bg-foreground/70" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-b border-border" id="flow">
        <div className="grid w-full gap-10 px-6 py-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-10 xl:px-12">
          <SectionHeading
            description="The live product is strongest when it explains itself as a routing flow: from expressed intent to approved work to delivered outcome."
            eyebrow="How it works"
            title="A request moves through one accountable path."
          />
          <div className="grid gap-4">
            {steps.map((step, index) => (
              <Card key={step.title}>
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <div className="flex size-10 shrink-0 items-center justify-center border border-border text-sm font-semibold">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-base">{step.title}</CardTitle>
                    <CardDescription className="text-sm/7">{step.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-b border-border">
        <div className="w-full px-6 py-14 lg:px-10 xl:px-12">
          <SectionHeading
            description="The whitepaper is broader than the alpha. The homepage should connect current functionality to the larger architecture without claiming that every layer is already shipped."
            eyebrow="System model"
            title="Boreal is being built in three layers."
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {principles.map((item) => (
              <Card key={item.title}>
                <CardHeader className="space-y-3">
                  <div className="flex size-10 items-center justify-center border border-border text-muted-foreground">
                    <item.icon className="size-4" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription className="text-sm/7">{item.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-b border-border">
        <div className="grid w-full gap-10 px-6 py-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:px-10 xl:px-12">
          <SectionHeading
            description="The branding should stay direct and specific. The fastest way to lose trust is to sound bigger than the shipped surface."
            eyebrow="Questions"
            title="The homepage should answer the obvious concerns quickly."
          />
          <Accordion className="border border-border" collapsible type="single">
            {faqs.map((item, index) => (
              <AccordionItem key={item.question} value={`item-${index + 1}`}>
                <AccordionTrigger className="px-4 py-4 text-sm">{item.question}</AccordionTrigger>
                <AccordionContent className="px-4">
                  <p className="text-sm/7 text-muted-foreground">{item.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="w-full">
        <div className="w-full px-6 py-14 lg:px-10 xl:px-12">
          <div className="flex flex-col gap-6 border border-border p-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl space-y-3">
              <Badge variant="secondary">Boreal alpha</Badge>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                The problem that has no answer yet belongs in a request workspace.
              </h2>
              <p className="text-sm/7 text-muted-foreground sm:text-base/7">
                Start in chat. Turn the need into structured work. Let supply respond. Keep the
                request visible until it is actually fulfilled.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/chat">
                  Open Boreal
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#flow">See the flow</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
