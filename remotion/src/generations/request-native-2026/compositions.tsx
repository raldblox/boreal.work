import type {CSSProperties, ReactNode} from "react";
import React from "react";
import {
  AbsoluteFill,
  Composition,
  Folder,
  Series,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  AmbientBed,
  BodyText,
  BrandLockup,
  FloatingButton,
  MonoText,
  ProgressBar,
  SceneSurface,
  ScreenCaptureSlot,
  SectionCard,
  SharedCompositionProps,
  TitleText,
  TypewriterText,
  WordTypewriterText,
  mixHex,
  sceneFade,
  springIn,
  withAlpha,
} from "./shared";
import {BOREAL_SHOWCASE_DEFAULT_AUDIO, BOREAL_SHOWCASE_DURATION, BorealShowcase60} from "./showcase-update-60";
import {COLORS, FONTS, FPS, HEIGHT, WIDTH} from "./theme";

export {BOREAL_SHOWCASE_DEFAULT_AUDIO, BOREAL_SHOWCASE_DURATION, BorealShowcase60} from "./showcase-update-60";

export const BOREAL_DEMO_DURATION = 2700;
export const BOREAL_UPDATE_DURATION = 3600;
export const BOREAL_LAUNCH_DURATION = 1800;

const demoRequestText =
  "I need a 60-second explainer video for my product launch. Clean motion graphics. Delivery in 3 days. Budget $150.";

const liveItems = [
  {
    label: "Chat-native request creation",
    sublabel: "Plain language in. Structured request out.",
  },
  {
    label: "Request workspace + proposals",
    sublabel: "Not a chat log. A durable workflow.",
  },
  {
    label: "Public supply directory",
    sublabel: "Human, agent, product. Same surface.",
  },
  {
    label: "Matching layer",
    sublabel: "Persisted candidates, score breakdowns, refinement.",
  },
  {
    label: "Provider-backed checkout",
    sublabel: "Privy-backed x402 for supported services.",
  },
  {
    label: "Activity log per request",
    sublabel: "Every state change. Auditable.",
  },
] as const;

const marketCards = [
  "ACP and UCP made listed products easier to buy in chat.",
  "That is not the whole market.",
  "Boreal starts where the listing does not exist yet.",
  "The request. The outcome. The work that needs someone to show up.",
  "Human. Agent. Or both.",
] as const;

const roadmapItems = [
  "Solana escrow on proposal approval",
  "UCP + A2A listing endpoints",
  "Historical analog retrieval",
  "Collective proposal primitive",
  "MCP tool server for Boreal",
] as const;

const whoItsForLines = [
  "If you have a problem that search cannot solve —",
  "If you have a skill the market is underserving —",
  "If you are building an agent that keeps hitting tool walls —",
  "If you want work, supply, and payment to meet in one thread —",
] as const;

const centeredStack: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const rowBetween: CSSProperties = {
  alignItems: "center",
  display: "flex",
  justifyContent: "space-between",
};

const StatusPill: React.FC<{
  background?: string;
  border?: string;
  color?: string;
  children: ReactNode;
}> = ({
  background = withAlpha(COLORS.primaryStrong, 0.12),
  border = withAlpha(COLORS.primaryStrong, 0.3),
  color = COLORS.primary,
  children,
}) => {
  return (
    <div
      style={{
        alignItems: "center",
        background,
        border: `1px solid ${border}`,
        borderRadius: 999,
        color,
        display: "inline-flex",
        fontFamily: FONTS.mono,
        fontSize: 12,
        gap: 8,
        letterSpacing: "0.12em",
        padding: "10px 14px",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
};

const TimelineDot: React.FC = () => {
  return (
    <div
      style={{
        background: COLORS.primaryStrong,
        borderRadius: "50%",
        height: 8,
        width: 8,
      }}
    />
  );
};

const BorealHeader: React.FC<{
  eyebrow?: string;
  surface?: string;
}> = ({eyebrow = "BOREAL", surface = COLORS.surface}) => {
  return (
    <div
      style={{
        ...rowBetween,
        borderBottom: `1px solid ${withAlpha(COLORS.frost, 0.08)}`,
        padding: "18px 22px",
      }}
    >
      <MonoText color={COLORS.primary} size={12} uppercase>
        {eyebrow}
      </MonoText>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 8,
        }}
      >
        {["#73ddbe", "#68d8d0", "#8cc7ff"].map((color) => (
          <div
            key={color}
            style={{
              background: color,
              borderRadius: "50%",
              boxShadow: `0 0 18px ${withAlpha(color, 0.3)}`,
              height: 7,
              width: 7,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const ChatMock: React.FC<{
  startFrame: number;
  text: string;
}> = ({startFrame, text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rise = springIn(frame, fps, 24, 110, 18);

  return (
    <SectionCard
      style={{
        background: withAlpha(COLORS.surface, 0.96),
        borderRadius: 28,
        display: "flex",
        flex: 1,
        flexDirection: "column",
        height: 770,
        overflow: "hidden",
        transform: `translateY(${interpolate(rise, [0, 1], [24, 0])}px)`,
      }}
    >
      <BorealHeader />
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "34px 32px 28px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              alignSelf: "flex-start",
              background: withAlpha(COLORS.frost, 0.04),
              border: `1px solid ${withAlpha(COLORS.frost, 0.08)}`,
              borderRadius: 24,
              maxWidth: 520,
              padding: "16px 18px",
            }}
          >
            <BodyText color={COLORS.mist} size={20}>
              What do you need?
            </BodyText>
          </div>
          <div
            style={{
              alignSelf: "flex-end",
              background: withAlpha(COLORS.primaryStrong, 0.12),
              border: `1px solid ${withAlpha(COLORS.primaryStrong, 0.28)}`,
              borderRadius: 28,
              maxWidth: 720,
              minHeight: 184,
              padding: "22px 24px",
            }}
          >
            <WordTypewriterText color={COLORS.paper} fontSize={26} startFrame={startFrame} text={text} />
          </div>
        </div>

        <div
          style={{
            background: withAlpha(COLORS.ink, 0.35),
            border: `1px solid ${withAlpha(COLORS.frost, 0.08)}`,
            borderRadius: 24,
            padding: "20px 22px",
          }}
        >
          <div style={{alignItems: "center", display: "flex", justifyContent: "space-between"}}>
            <MonoText color={COLORS.quiet} size={11} uppercase>
              Prompt
            </MonoText>
            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: 12,
              }}
            >
              <MonoText color={COLORS.quiet} size={11}>
                routing: live
              </MonoText>
              <div
                style={{
                  background: frame % 24 < 12 ? COLORS.primary : withAlpha(COLORS.primary, 0.22),
                  borderRadius: "50%",
                  height: 9,
                  width: 9,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

const IntentCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cardSpring = spring({
    fps,
    frame: frame - 240,
    config: {
      damping: 18,
      stiffness: 92,
    },
  });

  const fields = [
    ["Title", "Explainer video — product launch"],
    ["Budget", "$150 fixed"],
    ["Deadline", "3 days"],
    ["Category", "content / automated"],
  ] as const;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 22,
        opacity: interpolate(frame, [240, 276], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        transform: `translateX(${interpolate(cardSpring, [0, 1], [80, 0])}px)`,
      }}
    >
      <SectionCard
        style={{
          background: withAlpha(COLORS.surfaceRaised, 0.94),
          borderRadius: 28,
          minHeight: 420,
          padding: 30,
          width: 500,
        }}
      >
        <MonoText color={COLORS.primary} size={11} uppercase>
          Structured request
        </MonoText>
        <div style={{display: "flex", flexDirection: "column", gap: 22, marginTop: 28}}>
          {fields.map(([label, value], index) => {
            const start = 260 + index * 30;
            const itemOpacity = interpolate(frame, [start, start + 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const itemY = interpolate(frame, [start, start + 18], [18, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  opacity: itemOpacity,
                  transform: `translateY(${itemY}px)`,
                }}
              >
                <MonoText color={COLORS.quiet} size={11}>
                  {label}
                </MonoText>
                <BodyText color={COLORS.paper} size={22}>
                  {value}
                </BodyText>
              </div>
            );
          })}
        </div>
      </SectionCard>
      <MonoText
        color={COLORS.success}
        size={11}
        style={{
          opacity:
            frame < 540
              ? 0
              : 0.75 + ((Math.sin(((frame - 540) / 30) * Math.PI * 2) + 1) / 2) * 0.25,
        }}
        uppercase
      >
        Checking supply...
      </MonoText>
    </div>
  );
};

const SupplyCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = spring({
    fps,
    frame,
    config: {
      damping: 20,
      stiffness: 80,
    },
  });
  const barProgress = interpolate(frame, [40, 100], [0, 0.94], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const estimateOpacity = interpolate(frame, [180, 210], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let buttonScale = 1;
  if (frame >= 240 && frame < 270) {
    buttonScale = 1 + spring({fps, frame: frame - 240, config: {damping: 12, stiffness: 120}}) * 0.02;
  } else if (frame >= 270) {
    const click = spring({fps, frame: frame - 270, config: {damping: 10, stiffness: 180}});
    buttonScale = 1 - Math.sin(Math.min(click, 1) * Math.PI) * 0.04;
  }

  return (
    <SectionCard
      style={{
        background: withAlpha(COLORS.surfaceRaised, 0.94),
        borderRadius: 30,
        display: "flex",
        flexDirection: "column",
        gap: 22,
        padding: 34,
        transform: `translateX(${interpolate(reveal, [0, 1], [200, 0])}px)`,
        width: 740,
      }}
    >
      <MonoText color={COLORS.primary} size={11} uppercase>
        Automated supply
      </MonoText>
      <TitleText color={COLORS.paper} size={36} weight={600}>
        Video generation — instant delivery
      </TitleText>
      <div style={{display: "flex", flexDirection: "column", gap: 12}}>
        <div style={{...rowBetween}}>
          <MonoText color={COLORS.quiet} size={11} uppercase>
            match score
          </MonoText>
          <MonoText color={COLORS.paper} size={12}>
            94%
          </MonoText>
        </div>
        <ProgressBar background={withAlpha(COLORS.frost, 0.1)} color={COLORS.success} progress={barProgress} thickness={10} />
      </div>
      <MonoText color={COLORS.primary} size={11} uppercase>
        Direct invoke · supported provider
      </MonoText>
      <BodyText color={COLORS.paper} size={20}>
        Clean motion graphics, short-form launch cut, tracked fulfillment, and provider-backed payment handling in one path.
      </BodyText>
      <div style={{...rowBetween, marginTop: 10}}>
        <BodyText color={withAlpha(COLORS.paper, estimateOpacity)} size={18}>
          Estimated delivery: 4 minutes
        </BodyText>
        <div style={{transform: `scale(${buttonScale})`, transformOrigin: "center"}}>
          <FloatingButton active>Accept</FloatingButton>
        </div>
      </div>
    </SectionCard>
  );
};

const EvidenceCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = springIn(frame, fps, 150, 100, 17);

  return (
    <SectionCard
      style={{
        background: withAlpha(COLORS.surfaceRaised, 0.94),
        borderLeft: `3px solid ${COLORS.success}`,
        borderRadius: 24,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minWidth: 680,
        opacity: interpolate(frame, [150, 180], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        padding: "22px 24px",
        transform: `translateY(${interpolate(reveal, [0, 1], [30, 0])}px)`,
      }}
    >
      <BodyText color={COLORS.paper} size={26}>
        Delivered: launch_explainer_v1.mp4
      </BodyText>
      <MonoText color={COLORS.mist} size={12}>
        Type: link · Timestamp: 14:23:07
      </MonoText>
    </SectionCard>
  );
};

const DemoSceneGap: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fadeLines = interpolate(frame, [300, 330], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const finalReveal = spring({
    fps,
    frame: frame - 330,
    config: {
      damping: 14,
      stiffness: 110,
    },
  });

  return (
    <SceneSurface background={COLORS.ink}>
      <AbsoluteFill style={{justifyContent: "center", padding: "0 170px"}}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            opacity: fadeLines,
          }}
        >
          <TypewriterText color={COLORS.primary} fontSize={34} startFrame={30} text="You typed what you needed." />
          <TypewriterText color={COLORS.primary} fontSize={34} startFrame={120} text="It became a search result." />
          <TypewriterText color={COLORS.paper} fontFamily={FONTS.display} fontSize={44} startFrame={210} text="The problem stayed." />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={centeredStack}>
        <div
          style={{
            opacity: interpolate(frame, [330, 354], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            transform: `translateY(${interpolate(finalReveal, [0, 1], [20, 0])}px)`,
          }}
        >
          <TitleText color={COLORS.paper} size={58} weight={650}>
            That ends here.
          </TitleText>
        </div>
      </AbsoluteFill>
    </SceneSurface>
  );
};

const DemoSceneRequest: React.FC = () => {
  const frame = useCurrentFrame();
  const background = mixHex(
    COLORS.ink,
    COLORS.primarySoft,
    interpolate(frame, [0, 60], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  return (
    <SceneSurface background={background}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "row",
          gap: 44,
          padding: "130px 110px 120px",
        }}
      >
        <div style={{display: "flex", flex: 6, height: "100%"}}>
          <ChatMock startFrame={60} text={demoRequestText} />
        </div>
        <div style={{display: "flex", flex: 4, justifyContent: "center"}}>
          <IntentCard />
        </div>
      </AbsoluteFill>
    </SceneSurface>
  );
};

const DemoSceneMatch: React.FC = () => {
  const frame = useCurrentFrame();
  const registryOpacity = interpolate(frame, [0, 50, 60], [1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneSurface background={COLORS.ink}>
      <AbsoluteFill style={{padding: "120px 110px"}}>
        <div
          style={{
            alignItems: "flex-start",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "space-between",
          }}
        >
          <MonoText color={withAlpha(COLORS.success, registryOpacity)} size={11} uppercase>
            Checking supply...
          </MonoText>
          <div style={{alignItems: "center", display: "flex", flex: 1, justifyContent: "center"}}>
            <SupplyCard />
          </div>
          <div style={{display: "flex", justifyContent: "flex-end", width: "100%"}}>
            <div
              style={{
                opacity: interpolate(frame, [300, 330], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              <StatusPill background={withAlpha(COLORS.primarySoft, 0.88)} border={withAlpha(COLORS.success, 0.28)} color={COLORS.primary}>
                Privy x402 route ready
              </StatusPill>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </SceneSurface>
  );
};

const DemoSceneDelivery: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const generatingOpacity = interpolate(frame, [100, 130], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const deliveredOpacity = interpolate(frame, [120, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const openOpacity = interpolate(frame, [240, 260], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fulfilledOpacity = interpolate(frame, [240, 260], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const trackedOpacity = interpolate(frame, [300, 320], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const settledOpacity = interpolate(frame, [300, 320], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneSurface background={COLORS.surface}>
      <AbsoluteFill style={centeredStack}>
        <div style={{display: "flex", flexDirection: "column", gap: 28, width: 860}}>
        <div style={{alignItems: "center", display: "flex", flexDirection: "column", gap: 12}}>
            <div style={{position: "relative"}}>
              <MonoText color={COLORS.mist} size={11} style={{opacity: generatingOpacity}} uppercase>
                Generating...
              </MonoText>
              <MonoText
                color={COLORS.success}
                size={11}
                style={{left: 0, opacity: deliveredOpacity, position: "absolute", right: 0, textAlign: "center", top: 0}}
                uppercase
              >
                Delivered
              </MonoText>
            </div>
            <div style={{position: "relative", width: "100%"}}>
              <ProgressBar background={withAlpha(COLORS.frost, 0.12)} color={COLORS.success} progress={progress} thickness={2} />
            </div>
          </div>
          <div style={{display: "flex", justifyContent: "center"}}>
            <EvidenceCard />
          </div>
          <div style={{...rowBetween, marginTop: 10}}>
            <div style={{position: "relative"}}>
              <div style={{opacity: openOpacity}}>
                <StatusPill background={withAlpha(COLORS.frost, 0.05)} border={withAlpha(COLORS.frost, 0.12)} color={COLORS.quiet}>
                  open
                </StatusPill>
              </div>
              <div style={{left: 0, opacity: fulfilledOpacity, position: "absolute", top: 0}}>
                <StatusPill background={withAlpha(COLORS.success, 0.1)} border={withAlpha(COLORS.success, 0.24)} color={COLORS.success}>
                  fulfilled
                </StatusPill>
              </div>
            </div>
            <div style={{position: "relative"}}>
              <div style={{opacity: trackedOpacity}}>
                <StatusPill background={withAlpha(COLORS.primarySoft, 0.82)} border={withAlpha(COLORS.primaryStrong, 0.24)} color={COLORS.primary}>
                  Payment tracked
                </StatusPill>
              </div>
              <div style={{left: 0, opacity: settledOpacity, position: "absolute", top: 0}}>
                <StatusPill background={withAlpha(COLORS.success, 0.1)} border={withAlpha(COLORS.success, 0.24)} color={COLORS.success}>
                  Settlement recorded
                </StatusPill>
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </SceneSurface>
  );
};

const DemoSceneMeaning: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const firstSpring = springIn(frame, fps, 60, 110, 18);
  const line1Opacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line2Opacity = interpolate(frame, [150, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line3Opacity = interpolate(frame, [270, 300], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeAll = interpolate(frame, [420, 450], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lockupOpacity = interpolate(frame, [450, 485], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneSurface background={COLORS.primarySoft}>
      <AbsoluteFill style={centeredStack}>
        <div style={{alignItems: "center", display: "flex", flexDirection: "column", gap: 26, opacity: fadeAll}}>
          <div
            style={{
              opacity: line1Opacity,
              transform: `translateY(${interpolate(firstSpring, [0, 1], [20, 0])}px)`,
            }}
          >
            <TitleText color={COLORS.paper} italic size={62} weight={600}>
              From request to delivered.
            </TitleText>
          </div>
          <div style={{opacity: line2Opacity}}>
            <TitleText color={COLORS.frost} size={64} weight={700}>
              Four minutes.
            </TitleText>
          </div>
          <div style={{opacity: line3Opacity}}>
            <MonoText color={COLORS.primary} size={14}>
              Without a form. Without a search. Without a follow-up email.
            </MonoText>
          </div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={centeredStack}>
        <div style={{opacity: lockupOpacity}}>
          <BrandLockup />
        </div>
      </AbsoluteFill>
    </SceneSurface>
  );
};

const LiveItem: React.FC<{
  label: string;
  startFrame: number;
  sublabel: string;
}> = ({label, startFrame, sublabel}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = spring({
    fps,
    frame: frame - startFrame,
    config: {
      damping: 20,
      stiffness: 118,
    },
  });
  const opacity = interpolate(frame, [startFrame, startFrame + 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        opacity,
        transform: `translateX(${interpolate(reveal, [0, 1], [-40, 0])}px)`,
      }}
    >
      <TitleText color={COLORS.paper} size={32} weight={600}>
        {label}
      </TitleText>
      <BodyText color={COLORS.mist} size={20} width={560}>
        {sublabel}
      </BodyText>
    </div>
  );
};

const CardSequence: React.FC<{
  cards: readonly string[];
}> = ({cards}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={centeredStack}>
      {cards.map((text, index) => {
        const start = index * 120;
        const end = start + 120;
        const fadeIn = interpolate(frame, [start, start + 20], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const fadeOut = interpolate(frame, [end - 20, end], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const opacity = Math.min(fadeIn, fadeOut);

        return (
          <div
            key={text}
            style={{
              opacity,
              position: "absolute",
              textAlign: "center",
              width: 1020,
            }}
          >
            <TitleText color={index === cards.length - 1 ? COLORS.paper : COLORS.frost} italic size={index === cards.length - 1 ? 52 : 42} weight={600}>
              {text}
            </TitleText>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const ChatBubbleIcon: React.FC = () => {
  return (
    <svg fill="none" height="58" viewBox="0 0 64 64" width="58">
      <path
        d="M16 18.5C16 14.9101 18.9101 12 22.5 12H41.5C45.0899 12 48 14.9101 48 18.5V33.5C48 37.0899 45.0899 40 41.5 40H28.5L18 49V40.5C16.8954 40.5 16 39.6046 16 38.5V18.5Z"
        stroke={COLORS.success}
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
};

const DotsIcon: React.FC = () => {
  return (
    <div style={{display: "flex", gap: 12}}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          style={{
            background: COLORS.success,
            borderRadius: "50%",
            height: 14,
            width: 14,
          }}
        />
      ))}
    </div>
  );
};

const CheckIcon: React.FC = () => {
  return (
    <svg fill="none" height="58" viewBox="0 0 64 64" width="58">
      <circle cx="32" cy="32" r="21" stroke={COLORS.success} strokeWidth="3" />
      <path d="M22 32.5L28.5 39L42 25.5" stroke={COLORS.success} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
    </svg>
  );
};

const WhatItIsCut: React.FC<{
  icon: ReactNode;
  label: string;
  sublabel: string;
}> = ({icon, label, sublabel}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = spring({
    fps,
    frame,
    config: {
      damping: 18,
      stiffness: 120,
    },
  });

  return (
    <AbsoluteFill style={centeredStack}>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          opacity: sceneFade(frame, 170, 20),
          transform: `translateY(${interpolate(reveal, [0, 1], [16, 0])}px)`,
        }}
      >
        {icon}
        <TitleText color={COLORS.paper} size={40} weight={650}>
          {label}
        </TitleText>
        <MonoText color={COLORS.quiet} size={13}>
          {sublabel}
        </MonoText>
      </div>
    </AbsoluteFill>
  );
};

const UpdateIntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = spring({
    fps,
    frame,
    config: {
      damping: 16,
      stiffness: 110,
    },
  });

  return (
    <SceneSurface background={COLORS.primarySoft}>
      <AbsoluteFill style={centeredStack}>
        <SectionCard
          style={{
            alignItems: "center",
            borderRadius: 30,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            opacity: sceneFade(frame, 360, 24),
            padding: "46px 58px",
            transform: `scale(${interpolate(reveal, [0, 1], [0.94, 1])})`,
          }}
        >
          <TitleText color={COLORS.paper} size={52} weight={650}>
            Boreal — April 2026
          </TitleText>
          <BodyText color={COLORS.primary} size={24}>
            What we built. What&apos;s live. What&apos;s next.
          </BodyText>
        </SectionCard>
      </AbsoluteFill>
    </SceneSurface>
  );
};

const UpdateLiveScene: React.FC<SharedCompositionProps> = ({screenRecordingSrc}) => {
  const frame = useCurrentFrame();
  const messageOpacity = interpolate(frame, [1000, 1040], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneSurface background={COLORS.ink}>
      <AbsoluteFill
        style={{
          display: "grid",
          gap: 42,
          gridTemplateColumns: "1fr 1.15fr",
          padding: "110px 110px 100px",
        }}
      >
        <div style={{display: "flex", flexDirection: "column", gap: 34, justifyContent: "center"}}>
          <MonoText color={COLORS.primary} size={11} uppercase>
            Live in the alpha
          </MonoText>
          {liveItems.map((item, index) => (
            <LiveItem
              key={item.label}
              label={item.label}
              startFrame={index * 140}
              sublabel={item.sublabel}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
            justifyContent: "center",
          }}
        >
          <SectionCard
            style={{
              borderRadius: 30,
              height: 690,
              overflow: "hidden",
            }}
          >
            <BorealHeader eyebrow="Request workspace" />
            <div style={{height: "calc(100% - 63px)"}}>
              <ScreenCaptureSlot src={screenRecordingSrc} />
            </div>
          </SectionCard>
          <div style={{display: "flex", justifyContent: "flex-end"}}>
            <StatusPill background={withAlpha(COLORS.primarySoft, 0.9)} border={withAlpha(COLORS.success, 0.26)} color={COLORS.success}>
              <span style={{opacity: messageOpacity}}>This is the alpha. It&apos;s real. It runs.</span>
            </StatusPill>
          </div>
        </div>
      </AbsoluteFill>
    </SceneSurface>
  );
};

const UpdateMarketScene: React.FC = () => {
  return (
    <SceneSurface background={COLORS.ink}>
      <CardSequence cards={marketCards} />
    </SceneSurface>
  );
};

const UpdateRoadmapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const itemSpacing = 114;
  const visibleItems = roadmapItems.filter((_, index) => frame >= index * 120).length;
  const lineStartFrame = visibleItems <= 1 ? 0 : (visibleItems - 1) * 120;
  const lineHeight =
    visibleItems <= 1
      ? 0
      : interpolate(frame, [lineStartFrame, lineStartFrame + 30], [Math.max(0, (visibleItems - 2) * itemSpacing), (visibleItems - 1) * itemSpacing], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  return (
    <SceneSurface background={COLORS.surface}>
      <AbsoluteFill style={{padding: "130px 240px"}}>
        <div style={{display: "flex", flexDirection: "column", gap: 42}}>
          <MonoText color={COLORS.quiet} size={11} uppercase>
            What&apos;s next
          </MonoText>
          <div style={{display: "flex", position: "relative"}}>
            <div
              style={{
                background: withAlpha(COLORS.success, 0.3),
                height: lineHeight,
                left: 4,
                position: "absolute",
                top: 10,
                width: 1,
              }}
            />
            <div style={{display: "flex", flexDirection: "column", gap: itemSpacing}}>
              {roadmapItems.map((item, index) => {
                const start = index * 120;
                const opacity = interpolate(frame, [start, start + 24], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                const y = interpolate(frame, [start, start + 24], [20, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });

                return (
                  <div
                    key={item}
                    style={{
                      alignItems: "center",
                      display: "flex",
                      gap: 20,
                      opacity,
                      transform: `translateY(${y}px)`,
                    }}
                  >
                    <TimelineDot />
                    <MonoText color={COLORS.paper} size={18}>
                      {item}
                    </MonoText>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </SceneSurface>
  );
};

const UpdateOutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [360, 420], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneSurface background={COLORS.ink}>
      <AbsoluteFill style={{...centeredStack, opacity: fade}}>
        <BrandLockup />
      </AbsoluteFill>
    </SceneSurface>
  );
};

const LaunchHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const firstOpacity = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const secondOpacity = interpolate(frame, [200, 235], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneSurface background={COLORS.ink}>
      <AbsoluteFill style={centeredStack}>
        <div style={{alignItems: "center", display: "flex", flexDirection: "column", gap: 18, textAlign: "center"}}>
          <div style={{opacity: firstOpacity}}>
            <TitleText color={COLORS.paper} size={66} weight={650}>
              Your problem has an answer somewhere.
            </TitleText>
          </div>
          <div style={{opacity: secondOpacity}}>
            <TitleText color={COLORS.primary} italic size={66} weight={650}>
              Boreal finds it.
            </TitleText>
          </div>
        </div>
      </AbsoluteFill>
    </SceneSurface>
  );
};

const LaunchWhatItIsScene: React.FC = () => {
  const cuts = [
    {
      icon: <ChatBubbleIcon />,
      label: "Post a request",
      sublabel: "Plain language. No form.",
    },
    {
      icon: <DotsIcon />,
      label: "The network responds",
      sublabel: "Human, agent, or automated.",
    },
    {
      icon: <CheckIcon />,
      label: "Outcome delivered",
      sublabel: "Evidence attached. Settlement tracked.",
    },
  ] as const;

  return (
    <SceneSurface background={COLORS.primarySoft}>
      <Series>
        {cuts.map((cut) => (
          <Series.Sequence durationInFrames={170} key={cut.label}>
            <WhatItIsCut icon={cut.icon} label={cut.label} sublabel={cut.sublabel} />
          </Series.Sequence>
        ))}
      </Series>
    </SceneSurface>
  );
};

const LaunchWhoItsForScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <SceneSurface background={COLORS.ink}>
      <AbsoluteFill style={centeredStack}>
        {whoItsForLines.map((line, index) => {
          const start = index * 120;
          const end = start + 120;
          const fadeIn = interpolate(frame, [start, start + 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const fadeOut = interpolate(frame, [end - 15, end], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={line}
              style={{
                opacity: Math.min(fadeIn, fadeOut),
                position: "absolute",
                textAlign: "center",
                width: 900,
              }}
            >
              <TitleText color={COLORS.primary} size={40} weight={600}>
                {line}
              </TitleText>
            </div>
          );
        })}
        <div
          style={{
            opacity: interpolate(frame, [480, 510], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            position: "absolute",
            textAlign: "center",
            width: 900,
          }}
        >
          <TitleText color={COLORS.paper} size={52} weight={650}>
            Boreal is for you.
          </TitleText>
        </div>
      </AbsoluteFill>
    </SceneSurface>
  );
};

const LaunchCloseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = spring({
    fps,
    frame,
    config: {
      damping: 20,
      stiffness: 80,
    },
  });
  const background = mixHex(
    COLORS.ink,
    COLORS.primarySoft,
    interpolate(frame, [0, 40], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const fade = interpolate(frame, [510, 540], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneSurface background={background}>
      <AbsoluteFill style={{...centeredStack, opacity: fade}}>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            transform: `scale(${interpolate(reveal, [0, 1], [0.92, 1])})`,
          }}
        >
          <MonoText color={COLORS.paper} size={30} spacing="0.35em" uppercase>
            BOREAL
          </MonoText>
          <div
            style={{
              opacity: interpolate(frame, [90, 130], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <MonoText color={COLORS.quiet} size={16}>
              boreal.work
            </MonoText>
          </div>
          <div
            style={{
              opacity: interpolate(frame, [150, 190], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <TitleText color={COLORS.primary} italic size={22} weight={600}>
              Commerce, headed north.
            </TitleText>
          </div>
          <div
            style={{
              opacity: interpolate(frame, [240, 280], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <MonoText color={COLORS.success} size={12}>
              Public alpha. Live now.
            </MonoText>
          </div>
        </div>
      </AbsoluteFill>
    </SceneSurface>
  );
};

export const BorealDemo: React.FC<SharedCompositionProps> = ({ambientAudioSrc}) => {
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.ink}}>
      <AmbientBed durationInFrames={BOREAL_DEMO_DURATION} src={ambientAudioSrc} />
      <Series>
        <Series.Sequence durationInFrames={360}>
          <DemoSceneGap />
        </Series.Sequence>
        <Series.Sequence durationInFrames={690}>
          <DemoSceneRequest />
        </Series.Sequence>
        <Series.Sequence durationInFrames={510}>
          <DemoSceneMatch />
        </Series.Sequence>
        <Series.Sequence durationInFrames={540}>
          <DemoSceneDelivery />
        </Series.Sequence>
        <Series.Sequence durationInFrames={600}>
          <DemoSceneMeaning />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

export const BorealUpdate: React.FC<SharedCompositionProps> = ({
  ambientAudioSrc,
  screenRecordingSrc,
}) => {
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.ink}}>
      <AmbientBed durationInFrames={BOREAL_UPDATE_DURATION} src={ambientAudioSrc} />
      <Series>
        <Series.Sequence durationInFrames={360}>
          <UpdateIntroScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={1200}>
          <UpdateLiveScene screenRecordingSrc={screenRecordingSrc} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={720}>
          <UpdateMarketScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={900}>
          <UpdateRoadmapScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={420}>
          <UpdateOutroScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

export const BorealLaunch: React.FC<SharedCompositionProps> = ({ambientAudioSrc}) => {
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.ink}}>
      <AmbientBed durationInFrames={BOREAL_LAUNCH_DURATION} src={ambientAudioSrc} />
      <Series>
        <Series.Sequence durationInFrames={240}>
          <LaunchHookScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={510}>
          <LaunchWhatItIsScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={510}>
          <LaunchWhoItsForScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={540}>
          <LaunchCloseScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

export const BorealTruthful2026Compositions: React.FC = () => {
  return (
    <Folder name="Boreal-Truthful-2026">
      <Composition
        id="BorealDemo"
        component={BorealDemo}
        defaultProps={{ambientAudioSrc: null} satisfies SharedCompositionProps}
        durationInFrames={BOREAL_DEMO_DURATION}
        fps={FPS}
        height={HEIGHT}
        width={WIDTH}
      />
      <Composition
        id="BorealUpdate"
        component={BorealUpdate}
        defaultProps={{ambientAudioSrc: null, screenRecordingSrc: null} satisfies SharedCompositionProps}
        durationInFrames={BOREAL_UPDATE_DURATION}
        fps={FPS}
        height={HEIGHT}
        width={WIDTH}
      />
      <Composition
        id="BorealLaunch"
        component={BorealLaunch}
        defaultProps={{ambientAudioSrc: null} satisfies SharedCompositionProps}
        durationInFrames={BOREAL_LAUNCH_DURATION}
        fps={FPS}
        height={HEIGHT}
        width={WIDTH}
      />
      <Composition
        id="BorealShowcase60"
        component={BorealShowcase60}
        defaultProps={{ambientAudioSrc: BOREAL_SHOWCASE_DEFAULT_AUDIO} satisfies SharedCompositionProps}
        durationInFrames={BOREAL_SHOWCASE_DURATION}
        fps={FPS}
        height={HEIGHT}
        width={WIDTH}
      />
    </Folder>
  );
};
