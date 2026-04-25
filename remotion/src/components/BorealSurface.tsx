import type {CSSProperties, ReactNode} from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type {SceneSpec, VideoVariant} from "../data/video-variants";

const BACKGROUND = "#071115";
const PANEL = "rgba(10, 18, 24, 0.9)";
const PANEL_SOFT = "rgba(12, 22, 30, 0.78)";
const BORDER = "rgba(148, 163, 184, 0.16)";
const TEXT = "#f8fafc";
const MUTED = "#9fb0be";
const MONO = '"IBM Plex Mono", "Consolas", monospace';
const SANS = '"IBM Plex Sans", "Aptos", "Segoe UI", sans-serif';

export type FilmSceneProps = {
  scene: SceneSpec;
  sceneCount: number;
  sceneIndex: number;
  variant: VideoVariant;
};

type SceneFrameProps = FilmSceneProps & {
  children: ReactNode;
  notes?: string[];
};

type WindowFrameProps = {
  accent: string;
  children: ReactNode;
  title: string;
};

type SurfaceProps = {
  accent: string;
};

export const BorealBackdrop: React.FC<{accent: string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 300], [0, 140], {
    extrapolateRight: "extend",
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 18% 18%, ${withAlpha(
          accent,
          0.18,
        )}, transparent 34%), radial-gradient(circle at 86% 12%, rgba(56, 189, 248, 0.12), transparent 28%), ${BACKGROUND}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "96px 96px",
          opacity: 0.34,
          transform: `translateY(${drift}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 24,
          border: `1px solid ${withAlpha(accent, 0.26)}`,
          boxShadow: `0 0 0 1px ${withAlpha(accent, 0.08)} inset`,
        }}
      />
    </AbsoluteFill>
  );
};

export const SceneFrame: React.FC<SceneFrameProps> = ({
  children,
  notes = [],
  scene,
  sceneCount,
  sceneIndex,
  variant,
}) => {
  const {durationInFrames, fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const enter = spring({
    fps,
    frame,
    config: {
      damping: 16,
      stiffness: 120,
    },
  });
  const outro = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const opacity = Math.min(enter, outro);
  const shift = interpolate(enter, [0, 1], [34, 0]);
  const isMinimal = variant.overlayMode === "minimal";

  if (isMinimal) {
    return (
      <AbsoluteFill
        style={{
          color: TEXT,
          fontFamily: SANS,
          opacity,
          padding: "68px 78px 112px",
          transform: `translateY(${shift}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 34,
            height: "100%",
          }}
        >
          <div
            style={{
              alignItems: "flex-end",
              display: "flex",
              gap: 28,
              justifyContent: "space-between",
            }}
          >
            <div style={{maxWidth: 1040}}>
              <div
                style={{
                  alignItems: "center",
                  border: `1px solid ${withAlpha(variant.accent, 0.48)}`,
                  color: variant.accent,
                  display: "inline-flex",
                  fontFamily: MONO,
                  fontSize: 15,
                  gap: 12,
                  letterSpacing: "0.18em",
                  padding: "10px 14px",
                  textTransform: "uppercase",
                }}
              >
                {variant.kicker}
              </div>

              <h2
                style={{
                  fontSize: 82,
                  letterSpacing: "-0.055em",
                  lineHeight: 0.94,
                  margin: "18px 0 14px 0",
                }}
              >
                {scene.title}
              </h2>

              <p
                style={{
                  color: MUTED,
                  fontSize: 24,
                  lineHeight: 1.52,
                  margin: 0,
                  maxWidth: 960,
                }}
              >
                {scene.message}
              </p>
            </div>

            <div
              style={{
                color: MUTED,
                fontFamily: MONO,
                fontSize: 14,
                letterSpacing: "0.18em",
                textAlign: "right",
                textTransform: "uppercase",
              }}
            >
              Scene {String(sceneIndex + 1).padStart(2, "0")} / {String(sceneCount).padStart(2, "0")}
            </div>
          </div>

          <div
            style={{
              alignItems: "center",
              display: "flex",
              flex: 1,
            }}
          >
            {children}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        color: TEXT,
        fontFamily: SANS,
        opacity,
        padding: "72px 84px",
        transform: `translateY(${shift}px)`,
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 40,
          gridTemplateColumns: "460px minmax(0, 1fr)",
          height: "100%",
        }}
      >
        <div style={{display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                border: `1px solid ${withAlpha(variant.accent, 0.48)}`,
                color: variant.accent,
                fontFamily: MONO,
                fontSize: 16,
                letterSpacing: "0.18em",
                padding: "10px 14px",
                textTransform: "uppercase",
              }}
            >
              {variant.kicker}
            </div>

            <div
              style={{
                color: MUTED,
                fontFamily: MONO,
                fontSize: 14,
                letterSpacing: "0.18em",
                marginTop: 22,
                textTransform: "uppercase",
              }}
            >
              Scene {String(sceneIndex + 1).padStart(2, "0")} / {String(sceneCount).padStart(2, "0")}
            </div>

            <h2
              style={{
                fontSize: 68,
                letterSpacing: "-0.05em",
                lineHeight: 0.95,
                margin: "18px 0 18px 0",
              }}
            >
              {scene.title}
            </h2>

            <p
              style={{
                color: MUTED,
                fontSize: 24,
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {scene.message}
            </p>
          </div>

          {notes.length > 0 ? (
            <div style={{display: "flex", flexDirection: "column", gap: 14}}>
              {notes.map((note) => (
                <div
                  key={note}
                  style={{
                    background: PANEL_SOFT,
                    border: `1px solid ${BORDER}`,
                    color: MUTED,
                    fontSize: 18,
                    lineHeight: 1.5,
                    padding: "16px 18px",
                  }}
                >
                  {note}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ProblemPulseSurface: React.FC<SurfaceProps> = ({accent}) => {
  const frame = useCurrentFrame();
  const prompts = [
    "Need this done by Friday",
    "Can someone handle this?",
    "Find the best person or tool",
    "Still unresolved",
  ];

  return (
    <div
      style={{
        display: "grid",
        gap: 22,
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      }}
    >
      {prompts.map((prompt, index) => {
        const reveal = spring({
          fps: 30,
          frame: frame - index * 4,
          config: {
            damping: 18,
            stiffness: 130,
          },
        });

        return (
          <div
            key={prompt}
            style={{
              background: PANEL,
              border: `1px solid ${withAlpha(accent, 0.26)}`,
              minHeight: 220,
              opacity: reveal,
              padding: 26,
              transform: `translateY(${interpolate(reveal, [0, 1], [24, 0])}px)`,
            }}
          >
            <div
              style={{
                color: MUTED,
                fontFamily: MONO,
                fontSize: 13,
                letterSpacing: "0.16em",
                marginBottom: 18,
                textTransform: "uppercase",
              }}
            >
              {index === 3 ? "Dead end" : "User intent"}
            </div>
            <div
              style={{
                fontSize: index === 3 ? 54 : 34,
                letterSpacing: "-0.04em",
                lineHeight: index === 3 ? 0.94 : 1.05,
                marginBottom: 18,
              }}
            >
              {prompt}
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                height: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: index === 3 ? "#f97316" : accent,
                  height: "100%",
                  width: `${[82, 64, 72, 18][index]}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const HomepageSurface: React.FC<SurfaceProps> = ({accent}) => {
  return (
    <WindowFrame accent={accent} title="boreal.work">
      <div
        style={{
          display: "grid",
          gap: 26,
          gridTemplateColumns: "1.1fr 0.9fr",
          padding: 30,
        }}
      >
        <div style={{display: "flex", flexDirection: "column", gap: 22}}>
          <Pill accent={accent} label="Request-native commerce infrastructure" />
          <div style={{fontSize: 74, letterSpacing: "-0.06em", lineHeight: 0.96}}>
            Route demand into matched supply, tracked work, and paid execution.
          </div>
          <div style={{color: MUTED, fontSize: 23, lineHeight: 1.5, maxWidth: 760}}>
            Boreal turns chat into a market surface. A message can become a structured request, a
            matched product search, a proposal workflow, a provider-backed service call, or a
            delivery thread that stays accountable until the outcome is complete.
          </div>
          <div style={{display: "flex", gap: 12}}>
            <ActionButton accent={accent} label="Open Boreal" mode="solid" />
            <ActionButton accent={accent} label="Post a request" mode="outline" />
            <ActionButton accent={accent} label="List supply" mode="outline" />
          </div>
          <div style={{display: "grid", gap: 16, gridTemplateColumns: "repeat(3, minmax(0, 1fr))"}}>
            {[
              {
                title: "Post work that needs an outcome",
                body: "Turn the need into a structured request and keep the work visible until it is fulfilled.",
              },
              {
                title: "Publish supply that can actually be matched",
                body: "Register skills, services, products, or agent capability with the metadata Boreal needs for routing.",
              },
              {
                title: "Sell digital products and provider-backed services",
                body: "Surface buyable supply inside requests, move items into cart, and route supported paid flows.",
              },
            ].map((card) => (
              <Card key={card.title} title={card.title} body={card.body} />
            ))}
          </div>
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          <CalloutCard
            accent={accent}
            title="One market, several outcomes"
            body="Some asks should become request workspaces. Some should resolve through supply discovery. Some should move into cart and checkout."
          />
          <CalloutCard
            accent={accent}
            title="Requests"
            body="Post open work, collect proposals, assign participants, review delivery, and keep the full audit trail in one place."
          />
          <CalloutCard
            accent={accent}
            title="Supply"
            body="Publish human expertise, agent capability, products, and services with enough structure to be found and trusted."
          />
          <CalloutCard
            accent={accent}
            title="Commerce"
            body="Add digital items to cart, track checkout state, and route supported provider-backed calls into paid execution."
          />
        </div>
      </div>
    </WindowFrame>
  );
};

export const ChatWorkspaceSurface: React.FC<SurfaceProps> = ({accent}) => {
  return (
    <WindowFrame accent={accent} title="/chat">
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "0.24fr 0.43fr 0.33fr",
          height: 720,
          padding: 22,
        }}
      >
        <SidebarPane title="Requests" subtitle="Tracked asks and active deliveries">
          {[
            "Launch video for Boreal",
            "List a provider-backed service",
            "Package a product for search and checkout",
          ].map((item, index) => (
            <SidebarItem
              active={index === 0}
              key={item}
              subtitle={
                index === 0
                  ? "Video / launch / proposals first"
                  : index === 1
                    ? "Service provider / x402 / Privy"
                    : "Catalog / cart / metadata"
              }
              title={item}
            />
          ))}
        </SidebarPane>

        <div
          style={{
            background: PANEL_SOFT,
            border: `1px solid ${BORDER}`,
            display: "flex",
            flexDirection: "column",
            padding: 24,
          }}
        >
          <div style={{display: "flex", justifyContent: "space-between", marginBottom: 18}}>
            <div>
              <div style={{fontSize: 28, letterSpacing: "-0.04em"}}>Launch video for Boreal</div>
              <div style={{color: MUTED, fontSize: 16, marginTop: 6}}>
                Open Boreal / request workspace / proposals first
              </div>
            </div>
            <StatusPill accent={accent} label="Waiting for approval" />
          </div>

          <StageRail accent={accent} activeIndex={1} />

          <div style={{display: "flex", flexDirection: "column", gap: 18, marginTop: 26}}>
            <ChatBubble
              role="user"
              text="We need a 3-minute launch video for Boreal for a Solana hackathon. Build the concept, route the work, and suggest the best suppliers or tools."
            />
            <ChatBubble
              role="assistant"
              text="I can turn this into a tracked request, recommend the best supply path, and keep the full workflow visible until the final cut is delivered."
            />
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${BORDER}`,
              marginTop: "auto",
              padding: 18,
            }}
          >
            <div
              style={{
                color: MUTED,
                fontFamily: MONO,
                fontSize: 12,
                letterSpacing: "0.16em",
                marginBottom: 10,
                textTransform: "uppercase",
              }}
            >
              Prompt input
            </div>
            <div style={{color: MUTED, fontSize: 17, lineHeight: 1.5}}>
              Start in natural language. Route the outcome, not just the conversation.
            </div>
          </div>
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          <Panel title="Request draft">
            <TagRow
              tags={["video", "launch", "supply routing", "proposals first"]}
            />
            <DataLine label="Route target" value="proposal workflow" />
            <DataLine label="Requested outputs" value="video / messaging / strategy" />
            <DataLine label="Why this matters" value="Turn the ask into a visible execution path." />
          </Panel>
          <Panel title="Operating flow">
            <BulletLine text="A message can become an answer, a request workspace, or a store-like result surface with matched supply." />
            <BulletLine text="Approval stays explicit before work or spend advances." />
            <BulletLine text="Messages, files, and reviews stay attached to the same request." />
          </Panel>
          <Panel title="Next step">
            <ActionButton accent={accent} label="Prepare request" mode="solid" fullWidth />
          </Panel>
        </div>
      </div>
    </WindowFrame>
  );
};

export const SupplyMarketSurface: React.FC<SurfaceProps> = ({accent}) => {
  return (
    <WindowFrame accent={accent} title="Market">
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "0.54fr 0.46fr",
          height: 720,
          padding: 22,
        }}
      >
        <div
          style={{
            background: PANEL_SOFT,
            border: `1px solid ${BORDER}`,
            display: "flex",
            flexDirection: "column",
            padding: 20,
          }}
        >
          <div style={{display: "flex", justifyContent: "space-between", marginBottom: 14}}>
            <div>
              <div style={{fontSize: 24, letterSpacing: "-0.04em"}}>Public supply and requests</div>
              <div style={{color: MUTED, fontSize: 16, marginTop: 6}}>
                Discovery stays here. Execution stays in the workspace.
              </div>
            </div>
            <Pill accent={accent} label="Supply" />
          </div>

          <SearchBar placeholder="Search products, services, capabilities, or tools" />

          <div style={{display: "flex", flexDirection: "column", gap: 12, marginTop: 18}}>
            {[
              {
                title: "Copywriter for Product and Launch Messaging",
                subtitle: "By Copywriter",
                body: "Creates conversion-oriented copy for pages, campaigns, launches, and structured messaging requests.",
                meta: "content / async / USD 45 fixed",
              },
              {
                title: "Research Analyst for Structured Decision Support",
                subtitle: "By Research Analyst",
                body: "Turns open-ended questions into concise research memos, comparisons, and recommendation-ready summaries.",
                meta: "research / async / USD 55 fixed",
              },
              {
                title: "Math Expert Solves Technical Problems",
                subtitle: "By Math Expert",
                body: "Produces structured math solutions, derivations, proof sketches, and concise explainers for technical requests.",
                meta: "research / async / USD 35 fixed",
              },
            ].map((listing, index) => (
              <MarketCard
                accent={accent}
                body={listing.body}
                key={listing.title}
                meta={listing.meta}
                score={`${[96, 93, 88][index]}% match`}
                subtitle={listing.subtitle}
                title={listing.title}
              />
            ))}
          </div>
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          <Panel title="Boreal Agent profile">
            <div style={{fontSize: 28, letterSpacing: "-0.04em", marginBottom: 8}}>Boreal Agent</div>
            <div style={{color: MUTED, fontSize: 18, lineHeight: 1.5, marginBottom: 18}}>
              Boreal is the system operator for request-first work. It drafts intent, coordinates
              approvals, collaborates in thread, and fulfills supported tasks directly when the
              workspace allows it.
            </div>
            <TagRow
              tags={[
                "intent extraction",
                "chat assistance",
                "catalog search",
                "image generation",
                "speech generation",
                "video orchestration",
              ]}
            />
            <div
              style={{
                display: "grid",
                gap: 10,
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                marginTop: 18,
              }}
            >
              <MetricTile label="Average rating" value="4.9" />
              <MetricTile label="Fulfilled" value="128" />
              <MetricTile label="Active" value="17" />
              <MetricTile label="Avg delivery" value="2.1h" />
            </div>
          </Panel>

          <Panel title="Open requests">
            <RequestCard
              category="content"
              status="open to propose"
              summary="Need a short launch film, script options, and a strong demo structure for a hackathon submission."
              title="Prepare a 3-minute launch video for Boreal"
            />
            <RequestCard
              category="commerce"
              status="awaiting approval"
              summary="Package a provider-backed service listing with metadata for search, cart, and payment-aware invocation."
              title="List a provider-backed item"
            />
          </Panel>
        </div>
      </div>
    </WindowFrame>
  );
};

export const LifecycleSurface: React.FC<SurfaceProps> = ({accent}) => {
  return (
    <WindowFrame accent={accent} title="Request workspace">
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "0.56fr 0.44fr",
          height: 720,
          padding: 22,
        }}
      >
        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          <Panel title="Request status">
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: 18}}>
              <div>
                <div style={{fontSize: 30, letterSpacing: "-0.04em"}}>
                  Prepare a 3-minute launch video for Boreal
                </div>
                <div style={{color: MUTED, fontSize: 18, marginTop: 8}}>
                  Open request / assigned / delivery in thread
                </div>
              </div>
              <StatusPill accent={accent} label="Assigned" />
            </div>
            <StageRail accent={accent} activeIndex={2} />
            <div style={{display: "flex", gap: 10, marginTop: 16}}>
              <Pill accent={accent} label="video" />
              <Pill accent={accent} label="launch messaging" />
              <Pill accent={accent} label="strategy" />
            </div>
          </Panel>

          <Panel title="Activity">
            {[
              "request.created  |  Route: proposal workflow",
              "proposal.submitted  |  Agent: Copywriter",
              "proposal.approved  |  Status: claimed",
              "delivery.submitted  |  Progress: 100%",
            ].map((item) => (
              <BulletLine key={item} text={item} />
            ))}
          </Panel>

          <Panel title="Review">
            <div style={{display: "flex", gap: 8, marginBottom: 14}}>
              {Array.from({length: 5}).map((_, index) => (
                <div
                  key={index}
                  style={{
                    color: index < 5 ? "#f59e0b" : MUTED,
                    fontSize: 24,
                  }}
                >
                  *
                </div>
              ))}
            </div>
            <div style={{color: MUTED, fontSize: 17, lineHeight: 1.5}}>
              Messages, files, fulfillments, reviews, and outcomes stay attached to the same
              request so the market learns from the result.
            </div>
          </Panel>
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          <Panel title="Accepted proposal">
            <DataLine label="Supplier" value="Copywriter" />
            <DataLine label="Price" value="USD 45 fixed" />
            <DataLine label="ETA" value="2 hours" />
            <DataLine
              label="Deliverables"
              value="Hero angle / script options / pacing and tone notes"
            />
          </Panel>

          <Panel title="Delivery package">
            <div style={{fontSize: 24, letterSpacing: "-0.03em", marginBottom: 10}}>
              Boreal launch draft
            </div>
            <div style={{color: MUTED, fontSize: 17, lineHeight: 1.5, marginBottom: 16}}>
              Messaging angle, hero line, visual structure, and short-form variants delivered into
              the same accountable thread.
            </div>
            <TagRow tags={["script", "video flow", "hook", "CTA"]} />
          </Panel>
        </div>
      </div>
    </WindowFrame>
  );
};

export const FulfillmentSurface: React.FC<SurfaceProps> = ({accent}) => {
  return (
    <WindowFrame accent={accent} title="Direct fulfillment">
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "1fr 0.42fr",
          height: 720,
          padding: 22,
        }}
      >
        <div style={{display: "grid", gap: 16, gridTemplateColumns: "repeat(3, minmax(0, 1fr))"}}>
          <ArtifactCard accent={accent} kind="image" title="Poster concept" />
          <ArtifactCard accent={accent} kind="audio" title="Voice note" />
          <ArtifactCard accent={accent} kind="video" title="Product walkthrough" />
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          <Panel title="Matched supply">
            <div style={{fontSize: 24, letterSpacing: "-0.04em", marginBottom: 8}}>
              Provider-backed creative service
            </div>
            <div style={{color: MUTED, fontSize: 17, lineHeight: 1.5, marginBottom: 14}}>
              Supported listings can move from request context into cart, checkout, or paid
              provider-backed execution without leaving the market surface.
            </div>
            <DataLine label="Category" value="creative / digital delivery" />
            <DataLine label="Price" value="USD 29 / fixed" />
            <DataLine label="Checkout" value="payment-aware invocation" />
            <div style={{display: "flex", gap: 10, marginTop: 14}}>
              <ActionButton accent={accent} label="Add to cart" mode="solid" />
              <ActionButton accent={accent} label="Preview" mode="outline" />
            </div>
          </Panel>

          <Panel title="Why it matters">
            <BulletLine text="The user does not have to know in advance whether the answer is a person, an agent, a product, or a provider-backed service." />
            <BulletLine text="Boreal picks the right route and keeps the result attached to the original request." />
          </Panel>
        </div>
      </div>
    </WindowFrame>
  );
};

export const SolanaSurface: React.FC<SurfaceProps> = ({accent}) => {
  return (
    <WindowFrame accent={accent} title="Boreal x Solana">
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "0.46fr 0.54fr",
          height: 720,
          padding: 22,
        }}
      >
        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          <Panel title="Current alpha">
            <BulletLine text="Provider-backed service flows" />
            <BulletLine text="Agentic Market discovery sync" />
            <BulletLine text="Privy-backed x402 payment initiation" />
          </Panel>
          <Panel title="Next layer">
            <BulletLine text="Solana Agent Kit execution" />
            <BulletLine text="MoonPay funding and bridge adapters" />
            <BulletLine text="Settlement, trust, and evidence that compound" />
          </Panel>
        </div>

        <div
          style={{
            background: PANEL_SOFT,
            border: `1px solid ${BORDER}`,
            padding: 26,
          }}
        >
          <div style={{fontSize: 30, letterSpacing: "-0.04em", marginBottom: 18}}>
            {"Request -> Supply -> Approval -> Settlement"}
          </div>
          <div
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            }}
          >
            {[
              {
                title: "Intent",
                body: "Chat, search, and requests become structured market demand.",
              },
              {
                title: "Routing",
                body: "Boreal matches people, agents, products, or provider-backed services.",
              },
              {
                title: "Approval",
                body: "Privy-backed approval keeps spend and action explicit.",
              },
              {
                title: "Settlement",
                body: "Solana is the economic layer for speed, programmability, and verifiable trust.",
              },
            ].map((column) => (
              <div
                key={column.title}
                style={{
                  border: `1px solid ${withAlpha(accent, 0.22)}`,
                  padding: 18,
                }}
              >
                <div
                  style={{
                    color: accent,
                    fontFamily: MONO,
                    fontSize: 13,
                    letterSpacing: "0.16em",
                    marginBottom: 12,
                    textTransform: "uppercase",
                  }}
                >
                  {column.title}
                </div>
                <div style={{fontSize: 20, lineHeight: 1.45, color: MUTED}}>{column.body}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 18,
            }}
          >
            <Pill accent={accent} label="fast coordination" />
            <Pill accent={accent} label="programmable trust" />
            <Pill accent={accent} label="verifiable execution" />
          </div>
        </div>
      </div>
    </WindowFrame>
  );
};

export const ClosingMontageSurface: React.FC<SurfaceProps> = ({accent}) => {
  return (
    <WindowFrame accent={accent} title="Boreal montage">
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          height: 720,
          padding: 22,
        }}
      >
        <MiniSurface title="Homepage" body="Route demand into matched supply, tracked work, and paid execution." />
        <MiniSurface title="Request workspace" body="Chat becomes structure, approvals stay explicit, and outcomes stay attached." />
        <MiniSurface title="Supply market" body="Humans, agents, products, and services become routable supply." />
        <MiniSurface title="Direct fulfillment" body="Known supply can resolve instantly while harder work still routes to specialists." />
      </div>
    </WindowFrame>
  );
};

export const FilmOverlay: React.FC<{variant: VideoVariant}> = ({variant}) => {
  const frame = useCurrentFrame();
  const sceneFrames = variant.scenes.map((scene) => scene.durationInSeconds * VIDEO_FPS);
  const currentSceneIndex = getCurrentSceneIndex(frame, sceneFrames);

  if (variant.overlayMode === "minimal") {
    return (
      <div
        style={{
          alignItems: "center",
          bottom: 32,
          color: TEXT,
          display: "flex",
          justifyContent: "space-between",
          left: 48,
          pointerEvents: "none",
          position: "absolute",
          right: 48,
        }}
      >
        <div
          style={{
            background: PANEL_SOFT,
            border: `1px solid ${withAlpha(variant.accent, 0.28)}`,
            color: variant.accent,
            fontFamily: MONO,
            fontSize: 14,
            letterSpacing: "0.18em",
            padding: "10px 14px",
            textTransform: "uppercase",
          }}
        >
          {variant.label}
        </div>
        <div
          style={{
            background: PANEL_SOFT,
            border: `1px solid ${withAlpha(variant.accent, 0.28)}`,
            color: MUTED,
            fontFamily: MONO,
            fontSize: 14,
            letterSpacing: "0.18em",
            padding: "10px 14px",
            textTransform: "uppercase",
          }}
        >
          {variant.scenes[currentSceneIndex]?.title ?? "Boreal"}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        bottom: 28,
        display: "flex",
        gap: 16,
        left: 48,
        pointerEvents: "none",
        position: "absolute",
        right: 48,
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: PANEL_SOFT,
          border: `1px solid ${withAlpha(variant.accent, 0.28)}`,
          display: "flex",
          gap: 12,
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            color: variant.accent,
            fontFamily: MONO,
            fontSize: 14,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          {variant.label}
        </div>
        <div style={{color: MUTED, fontSize: 16}}>{variant.subheadline}</div>
      </div>

      <div
        style={{
          background: PANEL_SOFT,
          border: `1px solid ${withAlpha(variant.accent, 0.28)}`,
          display: "grid",
          gap: 10,
          gridAutoFlow: "column",
          padding: "12px 16px",
        }}
      >
        {variant.scenes.map((scene, index) => {
          const progress = getSceneProgress(frame, index, sceneFrames);
          return (
            <div key={`${scene.id}-${index}`} style={{display: "flex", flexDirection: "column", gap: 8}}>
              <div
                style={{
                  color: index === currentSceneIndex ? variant.accent : MUTED,
                  fontFamily: MONO,
                  fontSize: 12,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.08)",
                  height: 6,
                  width: 42,
                }}
              >
                <div
                  style={{
                    background: variant.accent,
                    height: "100%",
                    width: `${Math.round(progress * 100)}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const getCurrentSceneIndex = (frame: number, sceneFrames: number[]) => {
  let consumed = 0;

  for (let index = 0; index < sceneFrames.length; index++) {
    const next = consumed + sceneFrames[index];
    if (frame < next) {
      return index;
    }

    consumed = next;
  }

  return sceneFrames.length - 1;
};

export const getSceneProgress = (frame: number, sceneIndex: number, sceneFrames: number[]) => {
  const start = getSceneStartFrame(sceneIndex, sceneFrames);
  const duration = sceneFrames[sceneIndex];

  if (frame <= start) {
    return 0;
  }

  if (frame >= start + duration) {
    return 1;
  }

  return (frame - start) / duration;
};

export const getSceneStartFrame = (sceneIndex: number, sceneFrames: number[]) => {
  return sceneFrames.slice(0, sceneIndex).reduce((sum, duration) => sum + duration, 0);
};

export const withAlpha = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const WindowFrame: React.FC<WindowFrameProps> = ({accent, children, title}) => {
  return (
    <div
      style={{
        background: PANEL,
        border: `1px solid ${withAlpha(accent, 0.28)}`,
        boxShadow: `0 18px 80px ${withAlpha("#000000", 0.34)}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          alignItems: "center",
          borderBottom: `1px solid ${BORDER}`,
          display: "flex",
          justifyContent: "space-between",
          padding: "14px 18px",
        }}
      >
        <div style={{display: "flex", gap: 8}}>
          {["#ef4444", "#f59e0b", "#22c55e"].map((color) => (
            <div
              key={color}
              style={{
                background: color,
                borderRadius: 999,
                height: 10,
                width: 10,
              }}
            />
          ))}
        </div>
        <div
          style={{
            color: MUTED,
            fontFamily: MONO,
            fontSize: 13,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
      </div>
      {children}
    </div>
  );
};

const Pill: React.FC<{accent: string; label: string}> = ({accent, label}) => {
  return (
    <div
      style={{
        alignItems: "center",
        border: `1px solid ${withAlpha(accent, 0.4)}`,
        color: accent,
        display: "inline-flex",
        fontFamily: MONO,
        fontSize: 12,
        letterSpacing: "0.16em",
        padding: "8px 12px",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  );
};

const StatusPill: React.FC<{accent: string; label: string}> = ({accent, label}) => {
  return (
    <div
      style={{
        background: withAlpha(accent, 0.14),
        border: `1px solid ${withAlpha(accent, 0.34)}`,
        color: TEXT,
        fontFamily: MONO,
        fontSize: 12,
        letterSpacing: "0.16em",
        padding: "10px 12px",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  );
};

const ActionButton: React.FC<{
  accent: string;
  fullWidth?: boolean;
  label: string;
  mode: "outline" | "solid";
}> = ({accent, fullWidth = false, label, mode}) => {
  return (
    <div
      style={{
        alignItems: "center",
        background: mode === "solid" ? accent : "transparent",
        border: `1px solid ${mode === "solid" ? accent : withAlpha(accent, 0.44)}`,
        color: mode === "solid" ? "#041017" : TEXT,
        display: "inline-flex",
        fontSize: 16,
        fontWeight: 600,
        justifyContent: "center",
        padding: "12px 18px",
        width: fullWidth ? "100%" : "auto",
      }}
    >
      {label}
    </div>
  );
};

const Card: React.FC<{body: string; title: string}> = ({body, title}) => {
  return (
    <div
      style={{
        background: PANEL_SOFT,
        border: `1px solid ${BORDER}`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 220,
        padding: 18,
      }}
    >
      <div style={{fontSize: 22, letterSpacing: "-0.03em", lineHeight: 1.12}}>{title}</div>
      <div style={{color: MUTED, fontSize: 17, lineHeight: 1.5}}>{body}</div>
    </div>
  );
};

const CalloutCard: React.FC<{accent: string; body: string; title: string}> = ({
  accent,
  body,
  title,
}) => {
  return (
    <div
      style={{
        background: PANEL_SOFT,
        border: `1px solid ${withAlpha(accent, 0.24)}`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 18,
      }}
    >
      <div style={{fontSize: 22, letterSpacing: "-0.03em"}}>{title}</div>
      <div style={{color: MUTED, fontSize: 17, lineHeight: 1.5}}>{body}</div>
    </div>
  );
};

const SidebarPane: React.FC<{children: ReactNode; subtitle: string; title: string}> = ({
  children,
  subtitle,
  title,
}) => {
  return (
    <div
      style={{
        background: PANEL_SOFT,
        border: `1px solid ${BORDER}`,
        display: "flex",
        flexDirection: "column",
        padding: 18,
      }}
    >
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 13,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <div style={{fontSize: 20, marginTop: 10}}>{subtitle}</div>
      <div style={{display: "flex", flexDirection: "column", gap: 10, marginTop: 18}}>
        {children}
      </div>
    </div>
  );
};

const SidebarItem: React.FC<{active: boolean; subtitle: string; title: string}> = ({
  active,
  subtitle,
  title,
}) => {
  return (
    <div
      style={{
        background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${active ? "rgba(20, 184, 166, 0.3)" : BORDER}`,
        padding: 14,
      }}
    >
      <div style={{fontSize: 17, lineHeight: 1.35}}>{title}</div>
      <div style={{color: MUTED, fontSize: 14, marginTop: 6}}>{subtitle}</div>
    </div>
  );
};

const ChatBubble: React.FC<{role: "assistant" | "user"; text: string}> = ({role, text}) => {
  return (
    <div
      style={{
        alignSelf: role === "user" ? "flex-end" : "flex-start",
        background: role === "user" ? "rgba(20, 184, 166, 0.16)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${role === "user" ? "rgba(20, 184, 166, 0.32)" : BORDER}`,
        maxWidth: role === "user" ? "86%" : "92%",
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: "0.16em",
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        {role}
      </div>
      <div style={{fontSize: 18, lineHeight: 1.5}}>{text}</div>
    </div>
  );
};

const StageRail: React.FC<{accent: string; activeIndex: number}> = ({accent, activeIndex}) => {
  const labels = ["Detect", "Approve", "Work", "Deliver"];
  return (
    <div
      style={{
        alignItems: "center",
        display: "grid",
        gap: 6,
        gridTemplateColumns: "auto 1fr auto 1fr auto 1fr auto",
      }}
    >
      {labels.map((label, index) => (
        <StageRailNode
          accent={accent}
          active={index <= activeIndex}
          key={label}
          label={label}
          showLine={index < labels.length - 1}
        />
      ))}
    </div>
  );
};

const StageRailNode: React.FC<{
  accent: string;
  active: boolean;
  label: string;
  showLine: boolean;
}> = ({accent, active, label, showLine}) => {
  return (
    <>
      <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 8}}>
        <div
          style={{
            alignItems: "center",
            background: active ? accent : "rgba(255,255,255,0.08)",
            borderRadius: 999,
            color: active ? "#041017" : TEXT,
            display: "flex",
            height: 28,
            justifyContent: "center",
            width: 28,
          }}
        >
          {active ? "+" : "o"}
        </div>
        <div
          style={{
            color: MUTED,
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      </div>
      {showLine ? (
        <div
          style={{
            background: active ? accent : "rgba(255,255,255,0.08)",
            height: 2,
            width: "100%",
          }}
        />
      ) : null}
    </>
  );
};

const Panel: React.FC<{children: ReactNode; title: string}> = ({children, title}) => {
  return (
    <div
      style={{
        background: PANEL_SOFT,
        border: `1px solid ${BORDER}`,
        padding: 18,
      }}
    >
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 13,
          letterSpacing: "0.16em",
          marginBottom: 14,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
};

const TagRow: React.FC<{tags: string[]}> = ({tags}) => {
  return (
    <div style={{display: "flex", flexWrap: "wrap", gap: 8}}>
      {tags.map((tag) => (
        <div
          key={tag}
          style={{
            border: `1px solid ${BORDER}`,
            color: MUTED,
            fontSize: 13,
            padding: "8px 10px",
            textTransform: "uppercase",
          }}
        >
          {tag}
        </div>
      ))}
    </div>
  );
};

const DataLine: React.FC<{label: string; value: string}> = ({label, value}) => {
  return (
    <div
      style={{
        borderTop: `1px solid ${BORDER}`,
        display: "grid",
        gap: 16,
        gridTemplateColumns: "180px 1fr",
        padding: "12px 0",
      }}
    >
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{fontSize: 16, lineHeight: 1.5}}>{value}</div>
    </div>
  );
};

const BulletLine: React.FC<{text: string}> = ({text}) => {
  return (
    <div style={{display: "flex", gap: 12, alignItems: "flex-start"}}>
      <div
        style={{
          background: "#14b8a6",
          height: 8,
          marginTop: 9,
          width: 8,
        }}
      />
      <div style={{color: MUTED, fontSize: 17, lineHeight: 1.5}}>{text}</div>
    </div>
  );
};

const SearchBar: React.FC<{placeholder: string}> = ({placeholder}) => {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${BORDER}`,
        color: MUTED,
        fontSize: 16,
        padding: "12px 14px",
      }}
    >
      {placeholder}
    </div>
  );
};

const MarketCard: React.FC<{
  accent: string;
  body: string;
  meta: string;
  score: string;
  subtitle: string;
  title: string;
}> = ({accent, body, meta, score, subtitle, title}) => {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${BORDER}`,
        padding: 16,
      }}
    >
      <div style={{display: "flex", justifyContent: "space-between", gap: 12}}>
        <div style={{fontSize: 19, letterSpacing: "-0.03em", lineHeight: 1.3}}>{title}</div>
        <div style={{color: accent, fontFamily: MONO, fontSize: 12, textTransform: "uppercase"}}>
          {score}
        </div>
      </div>
      <div style={{color: MUTED, fontSize: 14, marginTop: 6}}>{subtitle}</div>
      <div style={{color: MUTED, fontSize: 16, lineHeight: 1.5, marginTop: 10}}>{body}</div>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 12, marginTop: 12}}>{meta}</div>
    </div>
  );
};

const MetricTile: React.FC<{label: string; value: string}> = ({label, value}) => {
  return (
    <div
      style={{
        border: `1px solid ${BORDER}`,
        padding: 14,
      }}
    >
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: "0.16em",
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{fontSize: 28, letterSpacing: "-0.04em"}}>{value}</div>
    </div>
  );
};

const RequestCard: React.FC<{
  category: string;
  status: string;
  summary: string;
  title: string;
}> = ({category, status, summary, title}) => {
  return (
    <div
      style={{
        border: `1px solid ${BORDER}`,
        marginTop: 10,
        padding: 16,
      }}
    >
      <div style={{fontSize: 20, letterSpacing: "-0.03em"}}>{title}</div>
      <div style={{color: MUTED, fontSize: 16, lineHeight: 1.5, marginTop: 10}}>{summary}</div>
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 12,
          marginTop: 12,
          textTransform: "uppercase",
        }}
      >
        {category} / {status}
      </div>
    </div>
  );
};

const ArtifactCard: React.FC<{accent: string; kind: "audio" | "image" | "video"; title: string}> = ({
  accent,
  kind,
  title,
}) => {
  const frame = useCurrentFrame();
  const progress = Math.min(1, frame / 60);
  const waveformBars = Array.from({length: 20}).map((_, index) => {
    const oscillation = Math.sin(frame / 4 + index * 0.8);
    return Math.max(12, 48 + oscillation * 32);
  });

  return (
    <div
      style={{
        background: PANEL_SOFT,
        border: `1px solid ${withAlpha(accent, 0.22)}`,
        display: "flex",
        flexDirection: "column",
        minHeight: 520,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: "0.16em",
          padding: "14px 16px",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>

      <div style={{flex: 1, padding: 16}}>
        {kind === "image" ? (
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(20, 184, 166, 0.28), rgba(56, 189, 248, 0.18), rgba(248, 250, 252, 0.08))",
              border: `1px solid ${BORDER}`,
              height: "100%",
              position: "relative",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                bottom: 16,
                left: 16,
                padding: "10px 12px",
                position: "absolute",
              }}
            >
              Poster concept / generated artwork
            </div>
          </div>
        ) : null}

        {kind === "audio" ? (
          <div
            style={{
              alignItems: "center",
              border: `1px solid ${BORDER}`,
              display: "flex",
              gap: 8,
              height: "100%",
              justifyContent: "center",
              padding: 18,
            }}
          >
            {waveformBars.map((height, index) => (
              <div
                key={index}
                style={{
                  background: index % 2 === 0 ? accent : "#38bdf8",
                  height,
                  width: 10,
                }}
              />
            ))}
          </div>
        ) : null}

        {kind === "video" ? (
          <div
            style={{
              border: `1px solid ${BORDER}`,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              height: "100%",
              padding: 18,
            }}
          >
            <div
              style={{
                alignItems: "center",
                display: "flex",
                fontSize: 18,
                gap: 12,
                justifyContent: "space-between",
              }}
            >
              <span>Status: in progress</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div style={{background: "rgba(255,255,255,0.08)", height: 8}}>
              <div
                style={{
                  background: accent,
                  height: "100%",
                  width: `${Math.round(progress * 100)}%`,
                }}
              />
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${BORDER}`,
                color: MUTED,
                flex: 1,
                fontSize: 17,
                lineHeight: 1.5,
                padding: 18,
              }}
            >
              Product walkthrough / video orchestration / provider-backed generation state
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const MiniSurface: React.FC<{body: string; title: string}> = ({body, title}) => {
  return (
    <div
      style={{
        background: PANEL_SOFT,
        border: `1px solid ${BORDER}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 18,
      }}
    >
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: "0.16em",
          marginBottom: 12,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <div style={{fontSize: 26, letterSpacing: "-0.04em", lineHeight: 1.1}}>{body}</div>
    </div>
  );
};

export const VIDEO_FPS = 30;

export const sharedShadow: CSSProperties["boxShadow"] = `0 18px 80px ${withAlpha(
  "#000000",
  0.34,
)}`;
