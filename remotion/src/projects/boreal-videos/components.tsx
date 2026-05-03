import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {FONTS, TOKENS} from "../../generations/home-chat-accurate-2026/theme";

const shellBorder = "rgba(255, 255, 255, 0.1)";
const panel = "rgba(255, 255, 255, 0.04)";
const softPanel = "rgba(255, 255, 255, 0.03)";
const divider = "rgba(255, 255, 255, 0.08)";
const warning = "#f59e0b";
const success = "#22c55e";
const scenePadding = 72;

const revealValue = (frame: number, fps: number, delay = 0) =>
  spring({
    fps,
    frame: frame - delay,
    config: {
      damping: 18,
      stiffness: 110,
    },
  });

const WindowShell: React.FC<{
  accent: string;
  children: React.ReactNode;
  title: string;
}> = ({accent, children, title}) => {
  return (
    <div
      style={{
        background: "rgba(7, 17, 21, 0.94)",
        border: `1px solid ${shellBorder}`,
        boxShadow: `0 28px 80px rgba(0, 0, 0, 0.36)`,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          borderBottom: `1px solid ${divider}`,
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
            color: TOKENS.mutedForeground,
            fontFamily: FONTS.mono,
            fontSize: 13,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
        <div
          style={{
            background: accent,
            borderRadius: 999,
            boxShadow: `0 0 22px ${accent}55`,
            height: 8,
            width: 8,
          }}
        />
      </div>
      {children}
    </div>
  );
};

const StatusChip: React.FC<{accent: string; label: string}> = ({accent, label}) => {
  return (
    <div
      style={{
        background: `${accent}20`,
        border: `1px solid ${accent}55`,
        color: accent,
        fontFamily: FONTS.mono,
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

const SurfaceCard: React.FC<{
  children: React.ReactNode;
  title: string;
}> = ({children, title}) => {
  return (
    <div
      style={{
        background: panel,
        border: `1px solid ${shellBorder}`,
        padding: 18,
      }}
    >
      <div
        style={{
          color: TOKENS.mutedForeground,
          fontFamily: FONTS.mono,
          fontSize: 12,
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

const DataRow: React.FC<{label: string; value: string}> = ({label, value}) => {
  return (
    <div
      style={{
        borderTop: `1px solid ${divider}`,
        display: "grid",
        gap: 12,
        gridTemplateColumns: "132px 1fr",
        padding: "12px 0",
      }}
    >
      <div
        style={{
          color: TOKENS.mutedForeground,
          fontFamily: FONTS.mono,
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: TOKENS.foreground,
          fontFamily: FONTS.sans,
          fontSize: 17,
          letterSpacing: "-0.01em",
          lineHeight: 1.45,
        }}
      >
        {value}
      </div>
    </div>
  );
};

const StageRail: React.FC<{
  accent: string;
  activeIndex: number;
}> = ({accent, activeIndex}) => {
  const labels = ["Request", "Route locked", "Payment", "Execute"];

  return (
    <div
      style={{
        alignItems: "center",
        display: "grid",
        gap: 0,
        gridTemplateColumns: "auto 1fr auto 1fr auto 1fr auto",
      }}
    >
      {labels.map((label, index) => {
        const done = index < activeIndex;
        const current = index === activeIndex;
        return (
          <React.Fragment key={label}>
            <div style={{alignItems: "center", display: "flex", flexDirection: "column", gap: 10}}>
              <div
                style={{
                  alignItems: "center",
                  background: done ? accent : current ? `${accent}22` : "transparent",
                  border: `2px solid ${done || current ? accent : "rgba(255,255,255,0.18)"}`,
                  borderRadius: 999,
                  display: "flex",
                  height: 22,
                  justifyContent: "center",
                  width: 22,
                }}
              >
                {current && !done ? (
                  <div
                    style={{
                      background: accent,
                      borderRadius: 999,
                      height: 8,
                      width: 8,
                    }}
                  />
                ) : null}
              </div>
              <div
                style={{
                  color: done || current ? TOKENS.foreground : TOKENS.mutedForeground,
                  fontFamily: FONTS.mono,
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </div>
            </div>
            {index < labels.length - 1 ? (
              <div
                style={{
                  background: index < activeIndex ? accent : "rgba(255,255,255,0.12)",
                  height: 2,
                  marginBottom: 20,
                  width: "100%",
                }}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Bubble: React.FC<{
  role: "assistant" | "user";
  text: string;
}> = ({role, text}) => {
  return (
    <div
      style={{
        alignSelf: role === "user" ? "flex-end" : "flex-start",
        background: role === "user" ? `${TOKENS.accent}22` : softPanel,
        border: `1px solid ${role === "user" ? `${TOKENS.accent}44` : shellBorder}`,
        maxWidth: role === "user" ? "82%" : "92%",
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          color: TOKENS.mutedForeground,
          fontFamily: FONTS.mono,
          fontSize: 12,
          letterSpacing: "0.16em",
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        {role}
      </div>
      <div
        style={{
          color: TOKENS.foreground,
          fontSize: 18,
          lineHeight: 1.52,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const SellerBlockCard: React.FC = () => {
  return (
    <SurfaceCard title="Seller block">
      <div
        style={{
          color: TOKENS.foreground,
          fontFamily: FONTS.heading,
          fontSize: 28,
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        Boreal specialist team
      </div>
      <div
        style={{
          color: TOKENS.mutedForeground,
          fontSize: 16,
          lineHeight: 1.5,
          marginTop: 12,
        }}
      >
        Startup Pressure Test leads. MVP Architect follows on the same request after funding is verified.
      </div>
      <div style={{marginTop: 14}}>
        <DataRow label="Network" value="Solana mainnet" />
        <DataRow label="Seller" value="boreal.specialists" />
        <DataRow label="Pay to" value="CxkLjW31HqX4...FRWD4yS" />
        <DataRow label="Starts after" value="Verified funding on this exact request thread" />
      </div>
    </SurfaceCard>
  );
};

const QuoteLockState: React.FC = () => {
  return (
    <SurfaceCard title="Quote lock">
      <div
        style={{
          background: `${warning}14`,
          border: `1px solid ${warning}44`,
          color: warning,
          display: "inline-flex",
          fontFamily: FONTS.mono,
          fontSize: 12,
          letterSpacing: "0.16em",
          padding: "8px 10px",
          textTransform: "uppercase",
        }}
      >
        payment required
      </div>
      <div style={{marginTop: 14}}>
        <DataRow label="Quote" value="USD 45 fixed / 0.25 SOL" />
        <DataRow label="Request" value="req_jx7eqtdndza8w7a6" />
        <DataRow label="Quote token" value="qt_lock_402_mvp_pressure" />
        <DataRow label="Route" value="startup-pressure-test + mvp-architect" />
        <DataRow label="Policy" value="No rematch after payment. This request resumes in place." />
      </div>
    </SurfaceCard>
  );
};

const FundingActionCard: React.FC = () => {
  return (
    <SurfaceCard title="Funding action">
      <div
        style={{
          color: TOKENS.foreground,
          fontFamily: FONTS.heading,
          fontSize: 30,
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        Funding starts execution.
      </div>
      <div
        style={{
          color: TOKENS.mutedForeground,
          fontSize: 16,
          lineHeight: 1.5,
          marginTop: 12,
        }}
      >
        The owner signs once, Boreal verifies the transaction on Solana mainnet, and the same request continues.
      </div>
      <div
        style={{
          alignItems: "center",
          background: warning,
          color: "#101010",
          display: "inline-flex",
          fontFamily: FONTS.mono,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.12em",
          marginTop: 18,
          padding: "14px 18px",
          textTransform: "uppercase",
        }}
      >
        sign to fund on Solana
      </div>
    </SurfaceCard>
  );
};

const SignedReceiptCard: React.FC = () => {
  return (
    <SurfaceCard title="Signed receipt">
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 10,
        }}
      >
        <div
          style={{
            background: `${success}22`,
            border: `1px solid ${success}55`,
            borderRadius: 999,
            color: success,
            fontFamily: FONTS.mono,
            fontSize: 12,
            letterSpacing: "0.16em",
            padding: "8px 10px",
            textTransform: "uppercase",
          }}
        >
          mainnet verified
        </div>
      </div>
      <div style={{marginTop: 14}}>
        <DataRow label="Signer" value="wallet:7pG3...mT1x" />
        <DataRow label="Network" value="solana:mainnet" />
        <DataRow label="Reference" value="BRL-REQ-402-jx7eqtdn" />
        <DataRow label="Tx" value="5gZ2T...7qNfS9uL2Jp4H" />
        <DataRow label="Seller pay-to" value="CxkLjW31HqX4...FRWD4yS" />
      </div>
    </SurfaceCard>
  );
};

const ResumeStateTransition: React.FC = () => {
  const steps = [
    "Owner signs payment authorization",
    "Boreal verifies Solana mainnet transaction",
    "Exact request resumes with no rematch",
  ];

  return (
    <SurfaceCard title="Resume path">
      <div style={{display: "flex", flexDirection: "column", gap: 12}}>
        {steps.map((step, index) => (
          <div
            key={step}
            style={{
              alignItems: "center",
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${shellBorder}`,
              display: "grid",
              gap: 12,
              gridTemplateColumns: "28px 1fr",
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                alignItems: "center",
                background: index < 2 ? `${success}22` : `${TOKENS.accent}22`,
                border: `1px solid ${index < 2 ? `${success}55` : `${TOKENS.accent}55`}`,
                color: index < 2 ? success : TOKENS.accent,
                display: "flex",
                fontFamily: FONTS.mono,
                fontSize: 12,
                height: 28,
                justifyContent: "center",
                width: 28,
              }}
            >
              {index + 1}
            </div>
            <div
              style={{
                color: TOKENS.foreground,
                fontSize: 17,
                lineHeight: 1.45,
              }}
            >
              {step}
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop: 16}}>
        <DataRow label="Before" value="req_jx7eqtdndza8w7a6" />
        <DataRow label="After" value="req_jx7eqtdndza8w7a6" />
        <DataRow label="Next turn" value="Startup Pressure Test executes, then MVP Architect continues" />
      </div>
    </SurfaceCard>
  );
};

const AskCard: React.FC<{
  delay: number;
  frame: number;
  lane: string;
  status?: "disappearing" | "unrouted";
  text: string;
}> = ({delay, frame, lane, status = "disappearing", text}) => {
  const {fps} = useVideoConfig();
  const reveal = revealValue(frame, fps, delay);
  const drift = interpolate(Math.max(0, frame - delay), [0, 120], [0, 44], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fade = interpolate(Math.max(0, frame - delay), [60, 130], [1, 0.28], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        background: status === "unrouted" ? `${warning}10` : panel,
        border: `1px solid ${status === "unrouted" ? `${warning}40` : shellBorder}`,
        opacity: reveal * fade,
        padding: 16,
        transform: `translateY(${drift}px)`,
      }}
    >
      <div
        style={{
          color: TOKENS.mutedForeground,
          fontFamily: FONTS.mono,
          fontSize: 11,
          letterSpacing: "0.14em",
          marginBottom: 10,
          textTransform: "uppercase",
        }}
      >
        {lane}
      </div>
      <div
        style={{
          color: TOKENS.foreground,
          fontSize: 18,
          lineHeight: 1.45,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const ProblemHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const leftReveal = revealValue(frame, fps, 0);
  const rightReveal = revealValue(frame, fps, 8);
  const sinkReveal = revealValue(frame, fps, 24);

  return (
    <AbsoluteFill
      style={{
        color: TOKENS.foreground,
        fontFamily: FONTS.sans,
        padding: scenePadding,
      }}
    >
      <WindowShell accent={warning} title="demand before Boreal">
        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "0.44fr 0.56fr",
            minHeight: 820,
            padding: 22,
          }}
        >
          <div
            style={{
              alignSelf: "center",
              opacity: leftReveal,
              transform: `translateY(${interpolate(leftReveal, [0, 1], [18, 0])}px)`,
            }}
          >
            <div
              style={{
                color: warning,
                fontFamily: FONTS.mono,
                fontSize: 13,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              high-value demand
            </div>
            <div
              style={{
                fontFamily: FONTS.heading,
                fontSize: 72,
                letterSpacing: "-0.06em",
                lineHeight: 0.92,
                marginTop: 18,
                maxWidth: 620,
              }}
            >
              Real asks keep disappearing before the work starts.
            </div>
            <div
              style={{
                color: TOKENS.mutedForeground,
                fontSize: 24,
                lineHeight: 1.5,
                marginTop: 18,
                maxWidth: 560,
              }}
            >
              Chat, software, and workflows collect the demand signal, but they still do not turn it into tracked funded execution.
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              opacity: rightReveal,
              transform: `translateY(${interpolate(rightReveal, [0, 1], [18, 0])}px)`,
            }}
          >
            <SurfaceCard title="chat">
              <div style={{display: "flex", flexDirection: "column", gap: 12}}>
                <AskCard delay={0} frame={frame} lane="chat" text="Need this done by Friday." />
                <AskCard delay={8} frame={frame} lane="chat" text="Can someone pressure test this startup?" />
                <AskCard delay={16} frame={frame} lane="chat" status="unrouted" text="Still unresolved." />
              </div>
            </SurfaceCard>

            <SurfaceCard title="software">
              <div style={{display: "flex", flexDirection: "column", gap: 12}}>
                <AskCard delay={6} frame={frame} lane="software" text="Scope the smallest MVP and route the work." />
                <AskCard delay={14} frame={frame} lane="software" text="Verify payout state before execution." />
                <AskCard delay={22} frame={frame} lane="software" status="unrouted" text="Hidden in dashboards." />
              </div>
            </SurfaceCard>

            <SurfaceCard title="workflows">
              <div style={{display: "flex", flexDirection: "column", gap: 12}}>
                <AskCard delay={12} frame={frame} lane="workflow" text="Find the right specialist team." />
                <AskCard delay={20} frame={frame} lane="workflow" text="Keep delivery attached to the request." />
                <AskCard delay={28} frame={frame} lane="workflow" status="unrouted" text="Work never actually starts." />
              </div>
            </SurfaceCard>
          </div>
        </div>

        <div
          style={{
            borderTop: `1px solid ${divider}`,
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            opacity: sinkReveal,
            padding: 18,
            transform: `translateY(${interpolate(sinkReveal, [0, 1], [14, 0])}px)`,
          }}
        >
          <SurfaceCard title="what gets lost">
            <div style={{color: TOKENS.foreground, fontSize: 18, lineHeight: 1.45}}>
              Outcome intent turns into logs, fragments, and stale drafts.
            </div>
          </SurfaceCard>
          <SurfaceCard title="what is missing">
            <div style={{color: TOKENS.foreground, fontSize: 18, lineHeight: 1.45}}>
              A visible route from ask to approval, funding, and execution.
            </div>
          </SurfaceCard>
          <SurfaceCard title="what Boreal fixes">
            <div style={{color: TOKENS.foreground, fontSize: 18, lineHeight: 1.45}}>
              The request stays alive until it becomes real funded work.
            </div>
          </SurfaceCard>
        </div>
      </WindowShell>
    </AbsoluteFill>
  );
};

export const FreeIntakeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const leftReveal = revealValue(frame, fps, 0);
  const rightReveal = revealValue(frame, fps, 10);
  const bottomReveal = revealValue(frame, fps, 24);

  return (
    <AbsoluteFill
      style={{
        color: TOKENS.foreground,
        fontFamily: FONTS.sans,
        padding: scenePadding,
      }}
    >
      <WindowShell accent={TOKENS.accent} title="boreal.work / free intake">
        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "0.42fr 0.58fr",
            minHeight: 820,
            padding: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              justifyContent: "center",
              opacity: leftReveal,
              transform: `translateY(${interpolate(leftReveal, [0, 1], [18, 0])}px)`,
            }}
          >
            <div
              style={{
                color: TOKENS.accent,
                fontFamily: FONTS.mono,
                fontSize: 13,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              request-native work and payment layer
            </div>
            <div
              style={{
                fontFamily: FONTS.heading,
                fontSize: 64,
                letterSpacing: "-0.06em",
                lineHeight: 0.92,
                maxWidth: 560,
              }}
            >
              Start in natural language. Boreal Agent routes for free.
            </div>
            <div
              style={{
                color: TOKENS.mutedForeground,
                fontSize: 22,
                lineHeight: 1.52,
                maxWidth: 520,
              }}
            >
              The first step is not a checkout and not a ticket form. Boreal Agent handles intake, clarification, and routing before any paid route begins.
            </div>
            <div style={{display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr"}}>
              <SurfaceCard title="free now">
                <div style={{color: TOKENS.foreground, fontSize: 18, lineHeight: 1.45}}>
                  Intake, clarification, route finding
                </div>
              </SurfaceCard>
              <SurfaceCard title="paid later">
                <div style={{color: TOKENS.foreground, fontSize: 18, lineHeight: 1.45}}>
                  Specialists start after the funded request boundary
                </div>
              </SurfaceCard>
            </div>
          </div>

          <div
            style={{
              background: panel,
              border: `1px solid ${shellBorder}`,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              opacity: rightReveal,
              overflow: "hidden",
              transform: `translateY(${interpolate(rightReveal, [0, 1], [18, 0])}px)`,
            }}
          >
            <div
              style={{
                borderBottom: `1px solid ${divider}`,
                padding: "20px 22px 18px",
              }}
            >
              <div style={{alignItems: "center", display: "flex", justifyContent: "space-between"}}>
                <div>
                  <div
                    style={{
                      fontFamily: FONTS.heading,
                      fontSize: 30,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    Boreal Agent mounted by default
                  </div>
                  <div style={{color: TOKENS.mutedForeground, fontSize: 16, marginTop: 8}}>
                    Intake first. Route next. Funded execution only when the work is real.
                  </div>
                </div>
                <StatusChip accent={TOKENS.accent} label="free orchestration" />
              </div>
            </div>
            <div style={{display: "flex", flex: 1, flexDirection: "column", gap: 14, padding: 22}}>
              <Bubble
                role="user"
                text="Pressure test this startup idea, design the smallest MVP, and tell me who should do the work."
              />
              <Bubble
                role="assistant"
                text="I can clarify the scope, route the right specialists, and open one tracked request once the work is ready."
              />
              <SurfaceCard title="composer state">
                <div
                  style={{
                    alignItems: "center",
                    background: softPanel,
                    border: `1px solid ${shellBorder}`,
                    borderRadius: 20,
                    display: "flex",
                    justifyContent: "space-between",
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      background: `${TOKENS.accent}22`,
                      border: `1px solid ${TOKENS.accent}44`,
                      color: TOKENS.accent,
                      fontFamily: FONTS.mono,
                      fontSize: 12,
                      letterSpacing: "0.16em",
                      padding: "10px 12px",
                      textTransform: "uppercase",
                    }}
                  >
                    Boreal Agent
                  </div>
                  <div
                    style={{
                      background: `${success}22`,
                      border: `1px solid ${success}44`,
                      color: success,
                      fontFamily: FONTS.mono,
                      fontSize: 12,
                      letterSpacing: "0.16em",
                      padding: "10px 12px",
                      textTransform: "uppercase",
                    }}
                  >
                    route-ready
                  </div>
                </div>
              </SurfaceCard>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: `1px solid ${divider}`,
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            opacity: bottomReveal,
            padding: 18,
            transform: `translateY(${interpolate(bottomReveal, [0, 1], [14, 0])}px)`,
          }}
        >
          <SurfaceCard title="step 1">
            <div style={{color: TOKENS.foreground, fontSize: 18, lineHeight: 1.45}}>
              Ask naturally
            </div>
          </SurfaceCard>
          <SurfaceCard title="step 2">
            <div style={{color: TOKENS.foreground, fontSize: 18, lineHeight: 1.45}}>
              Boreal Agent structures and routes for free
            </div>
          </SurfaceCard>
          <SurfaceCard title="step 3">
            <div style={{color: TOKENS.foreground, fontSize: 18, lineHeight: 1.45}}>
              Open one tracked request when execution becomes real
            </div>
          </SurfaceCard>
        </div>
      </WindowShell>
    </AbsoluteFill>
  );
};

export const RouteLockScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const leftReveal = revealValue(frame, fps, 0);
  const rightTopReveal = revealValue(frame, fps, 12);
  const rightBottomReveal = revealValue(frame, fps, 22);

  return (
    <AbsoluteFill
      style={{
        color: TOKENS.foreground,
        fontFamily: FONTS.sans,
        padding: scenePadding,
      }}
    >
      <WindowShell accent={TOKENS.accent} title="boreal.work / route locked">
        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "0.6fr 0.4fr",
            minHeight: 820,
            padding: 22,
          }}
        >
          <div
            style={{
              background: panel,
              border: `1px solid ${shellBorder}`,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              opacity: leftReveal,
              overflow: "hidden",
              transform: `translateY(${interpolate(leftReveal, [0, 1], [18, 0])}px)`,
            }}
          >
            <div
              style={{
                borderBottom: `1px solid ${divider}`,
                padding: "20px 22px 18px",
              }}
            >
              <div style={{alignItems: "center", display: "flex", justifyContent: "space-between"}}>
                <div>
                  <div
                    style={{
                      fontFamily: FONTS.heading,
                      fontSize: 30,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    Tracked request created and route locked
                  </div>
                  <div style={{color: TOKENS.mutedForeground, fontSize: 16, marginTop: 8}}>
                    One request. One visible route. Same thread continues after funding.
                  </div>
                </div>
                <StatusChip accent={TOKENS.accent} label="route locked" />
              </div>
              <div style={{marginTop: 18}}>
                <StageRail accent={TOKENS.accent} activeIndex={1} />
              </div>
            </div>
            <div style={{display: "flex", flex: 1, flexDirection: "column", gap: 14, padding: 22}}>
              <Bubble
                role="assistant"
                text="The ask is now one tracked request. Best route found and locked before payment."
              />
              <SurfaceCard title="request shell">
                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "1fr 1fr",
                  }}
                >
                  <div
                    style={{
                      background: softPanel,
                      border: `1px solid ${shellBorder}`,
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        color: TOKENS.mutedForeground,
                        fontFamily: FONTS.mono,
                        fontSize: 11,
                        letterSpacing: "0.14em",
                        marginBottom: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      request
                    </div>
                    <div style={{fontSize: 18, lineHeight: 1.45}}>
                      Pressure test this startup and design the smallest MVP
                    </div>
                  </div>
                  <div
                    style={{
                      background: softPanel,
                      border: `1px solid ${shellBorder}`,
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        color: TOKENS.mutedForeground,
                        fontFamily: FONTS.mono,
                        fontSize: 11,
                        letterSpacing: "0.14em",
                        marginBottom: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      status
                    </div>
                    <div style={{fontSize: 18, lineHeight: 1.45}}>
                      Route preview ready. Waiting for funding boundary.
                    </div>
                  </div>
                </div>
              </SurfaceCard>
              <Bubble
                role="assistant"
                text="Startup Pressure Test leads first. MVP Architect follows on the same request after funding is confirmed."
              />
            </div>
          </div>

          <div style={{display: "flex", flexDirection: "column", gap: 16}}>
            <div
              style={{
                opacity: rightTopReveal,
                transform: `translateY(${interpolate(rightTopReveal, [0, 1], [18, 0])}px)`,
              }}
            >
              <SurfaceCard title="matched route">
                <div
                  style={{
                    color: TOKENS.foreground,
                    fontFamily: FONTS.heading,
                    fontSize: 28,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                  }}
                >
                  Startup Pressure Test
                </div>
                <div style={{color: TOKENS.mutedForeground, fontSize: 16, lineHeight: 1.5, marginTop: 10}}>
                  First pass on the risks, weak assumptions, and go-to-market pressure points.
                </div>
                <div style={{marginTop: 14}}>
                  <DataRow label="Role" value="lead specialist" />
                  <DataRow label="Follow-up" value="MVP Architect" />
                  <DataRow label="Why it won" value="Best fit for startup pressure + MVP scoping on one request" />
                </div>
              </SurfaceCard>
            </div>

            <div
              style={{
                opacity: rightBottomReveal,
                transform: `translateY(${interpolate(rightBottomReveal, [0, 1], [18, 0])}px)`,
              }}
            >
              <SurfaceCard title="route behavior">
                <div style={{display: "flex", flexDirection: "column", gap: 12}}>
                  <div
                    style={{
                      background: softPanel,
                      border: `1px solid ${shellBorder}`,
                      padding: 14,
                    }}
                  >
                    <div style={{color: TOKENS.foreground, fontSize: 18, lineHeight: 1.45}}>
                      The user does not pick raw providers or tools first.
                    </div>
                  </div>
                  <div
                    style={{
                      background: softPanel,
                      border: `1px solid ${shellBorder}`,
                      padding: 14,
                    }}
                  >
                    <div style={{color: TOKENS.foreground, fontSize: 18, lineHeight: 1.45}}>
                      Boreal locks the best route it can support on one request thread.
                    </div>
                  </div>
                  <div
                    style={{
                      background: softPanel,
                      border: `1px solid ${shellBorder}`,
                      padding: 14,
                    }}
                  >
                    <div style={{color: TOKENS.foreground, fontSize: 18, lineHeight: 1.45}}>
                      Funding starts the exact route shown here.
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            </div>
          </div>
        </div>
      </WindowShell>
    </AbsoluteFill>
  );
};

export const PaymentRequiredScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const leftReveal = revealValue(frame, fps, 0);
  const rightTopReveal = revealValue(frame, fps, 10);
  const rightMidReveal = revealValue(frame, fps, 18);
  const rightBottomReveal = revealValue(frame, fps, 26);

  return (
    <AbsoluteFill
      style={{
        color: TOKENS.foreground,
        fontFamily: FONTS.sans,
        padding: scenePadding,
      }}
    >
      <WindowShell accent={warning} title="boreal.work / funded request">
        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "0.6fr 0.4fr",
            minHeight: 820,
            padding: 22,
          }}
        >
          <div
            style={{
              background: panel,
              border: `1px solid ${shellBorder}`,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              opacity: leftReveal,
              overflow: "hidden",
              transform: `translateY(${interpolate(leftReveal, [0, 1], [18, 0])}px)`,
            }}
          >
            <div
              style={{
                borderBottom: `1px solid ${divider}`,
                padding: "20px 22px 18px",
              }}
            >
              <div style={{alignItems: "center", display: "flex", justifyContent: "space-between"}}>
                <div>
                  <div
                    style={{
                      fontFamily: FONTS.heading,
                      fontSize: 30,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    Pressure test this startup and scope the smallest MVP
                  </div>
                  <div style={{color: TOKENS.mutedForeground, fontSize: 16, marginTop: 8}}>
                    One tracked request. Locked specialist route. Waiting for funding.
                  </div>
                </div>
                <StatusChip accent={warning} label="payment required" />
              </div>
              <div style={{marginTop: 18}}>
                <StageRail accent={warning} activeIndex={2} />
              </div>
            </div>
            <div style={{display: "flex", flex: 1, flexDirection: "column", gap: 14, padding: 22}}>
              <Bubble
                role="user"
                text="Pressure test this startup idea, design the smallest MVP, and tell me who should do the work."
              />
              <Bubble
                role="assistant"
                text="Best route found. Startup Pressure Test can frame the risks first, then MVP Architect can scope the smallest build on the same request."
              />
              <SurfaceCard title="Route lock">
                <div
                  style={{
                    color: TOKENS.foreground,
                    fontFamily: FONTS.heading,
                    fontSize: 26,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                  }}
                >
                  Route locked before payment
                </div>
                <div
                  style={{
                    color: TOKENS.mutedForeground,
                    fontSize: 16,
                    lineHeight: 1.5,
                    marginTop: 12,
                  }}
                >
                  The route, quote, and request token are already fixed. Funding this request starts the exact work shown here.
                </div>
                <div style={{marginTop: 14}}>
                  <DataRow label="Lead" value="Startup Pressure Test" />
                  <DataRow label="Follow-through" value="MVP Architect" />
                  <DataRow label="Behavior" value="No rematch. No second checkout. Same thread continues." />
                </div>
              </SurfaceCard>
            </div>
          </div>

          <div style={{display: "flex", flexDirection: "column", gap: 16}}>
            <div
              style={{
                opacity: rightTopReveal,
                transform: `translateY(${interpolate(rightTopReveal, [0, 1], [18, 0])}px)`,
              }}
            >
              <SellerBlockCard />
            </div>
            <div
              style={{
                opacity: rightMidReveal,
                transform: `translateY(${interpolate(rightMidReveal, [0, 1], [18, 0])}px)`,
              }}
            >
              <QuoteLockState />
            </div>
            <div
              style={{
                opacity: rightBottomReveal,
                transform: `translateY(${interpolate(rightBottomReveal, [0, 1], [18, 0])}px)`,
              }}
            >
              <FundingActionCard />
            </div>
          </div>
        </div>
      </WindowShell>
    </AbsoluteFill>
  );
};

export const SolanaVerificationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const leftReveal = revealValue(frame, fps, 0);
  const rightTopReveal = revealValue(frame, fps, 10);
  const rightBottomReveal = revealValue(frame, fps, 20);

  return (
    <AbsoluteFill
      style={{
        color: TOKENS.foreground,
        fontFamily: FONTS.sans,
        padding: scenePadding,
      }}
    >
      <WindowShell accent={TOKENS.accent} title="boreal.work / solana verification">
        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "0.58fr 0.42fr",
            minHeight: 820,
            padding: 22,
          }}
        >
          <div
            style={{
              background: panel,
              border: `1px solid ${shellBorder}`,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              opacity: leftReveal,
              overflow: "hidden",
              transform: `translateY(${interpolate(leftReveal, [0, 1], [18, 0])}px)`,
            }}
          >
            <div
              style={{
                borderBottom: `1px solid ${divider}`,
                padding: "20px 22px 18px",
              }}
            >
              <div style={{alignItems: "center", display: "flex", justifyContent: "space-between"}}>
                <div>
                  <div
                    style={{
                      fontFamily: FONTS.heading,
                      fontSize: 30,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    Same request resumed after verified payment
                  </div>
                  <div style={{color: TOKENS.mutedForeground, fontSize: 16, marginTop: 8}}>
                    Solana mainnet verified. Exact route resumed. No rematch.
                  </div>
                </div>
                <StatusChip accent={TOKENS.accent} label="executing" />
              </div>
              <div style={{marginTop: 18}}>
                <StageRail accent={TOKENS.accent} activeIndex={3} />
              </div>
            </div>
            <div style={{display: "flex", flex: 1, flexDirection: "column", gap: 14, padding: 22}}>
              <Bubble
                role="assistant"
                text="Payment verified on Solana mainnet. Resuming the exact locked route on this request now."
              />
              <SurfaceCard title="Execution continuity">
                <div
                  style={{
                    color: TOKENS.foreground,
                    fontFamily: FONTS.heading,
                    fontSize: 26,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                  }}
                >
                  Request continuity is visible
                </div>
                <div
                  style={{
                    color: TOKENS.mutedForeground,
                    fontSize: 16,
                    lineHeight: 1.5,
                    marginTop: 12,
                  }}
                >
                  Funding does not open a second workflow. It flips this request from waiting to active execution.
                </div>
                <div style={{marginTop: 14}}>
                  <DataRow label="Request token" value="req_jx7eqtdndza8w7a6" />
                  <DataRow label="Active route" value="startup-pressure-test + mvp-architect" />
                  <DataRow label="Next action" value="Pressure test runs first. MVP scope follows in-thread." />
                </div>
              </SurfaceCard>
              <Bubble
                role="assistant"
                text="Startup Pressure Test is now drafting the first pressure memo. MVP Architect follows on the same thread once the first execution step lands."
              />
            </div>
          </div>

          <div style={{display: "flex", flexDirection: "column", gap: 16}}>
            <div
              style={{
                opacity: rightTopReveal,
                transform: `translateY(${interpolate(rightTopReveal, [0, 1], [18, 0])}px)`,
              }}
            >
              <SignedReceiptCard />
            </div>
            <div
              style={{
                opacity: rightBottomReveal,
                transform: `translateY(${interpolate(rightBottomReveal, [0, 1], [18, 0])}px)`,
              }}
            >
              <ResumeStateTransition />
            </div>
          </div>
        </div>
      </WindowShell>
    </AbsoluteFill>
  );
};

const DeliveryArtifactCard: React.FC = () => {
  const artifacts = [
    {
      label: "Pressure memo",
      meta: "startup-pressure-memo.md",
    },
    {
      label: "MVP scope",
      meta: "smallest-mvp-outline.md",
    },
    {
      label: "Review state",
      meta: "owner review ready",
    },
  ];

  return (
    <SurfaceCard title="Delivery attached">
      <div style={{display: "flex", flexDirection: "column", gap: 12}}>
        {artifacts.map((artifact) => (
          <div
            key={artifact.label}
            style={{
              alignItems: "center",
              background: softPanel,
              border: `1px solid ${shellBorder}`,
              display: "grid",
              gap: 14,
              gridTemplateColumns: "1fr auto",
              padding: "14px 16px",
            }}
          >
            <div>
              <div
                style={{
                  color: TOKENS.foreground,
                  fontSize: 18,
                  lineHeight: 1.4,
                }}
              >
                {artifact.label}
              </div>
              <div
                style={{
                  color: TOKENS.mutedForeground,
                  fontFamily: FONTS.mono,
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  marginTop: 6,
                  textTransform: "uppercase",
                }}
              >
                {artifact.meta}
              </div>
            </div>
            <div
              style={{
                background: `${success}22`,
                border: `1px solid ${success}44`,
                color: success,
                fontFamily: FONTS.mono,
                fontSize: 11,
                letterSpacing: "0.14em",
                padding: "8px 10px",
                textTransform: "uppercase",
              }}
            >
              attached
            </div>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
};

const ReviewLoopCard: React.FC = () => {
  return (
    <SurfaceCard title="Same thread, same proof">
      <div style={{display: "flex", flexDirection: "column", gap: 12}}>
        {[
          "Messages stay on the request",
          "Evidence posts back into the thread",
          "Artifacts land on the same work surface",
          "Review happens without leaving the request",
        ].map((line) => (
          <div
            key={line}
            style={{
              alignItems: "center",
              display: "grid",
              gap: 12,
              gridTemplateColumns: "12px 1fr",
            }}
          >
            <div
              style={{
                background: TOKENS.accent,
                borderRadius: 999,
                height: 8,
                marginLeft: 2,
                width: 8,
              }}
            />
            <div
              style={{
                color: TOKENS.foreground,
                fontSize: 17,
                lineHeight: 1.45,
              }}
            >
              {line}
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop: 16}}>
        <DataRow label="Request" value="req_jx7eqtdndza8w7a6" />
        <DataRow label="Status" value="executing -> delivered -> review" />
        <DataRow label="Owner action" value="Review the attached work, not a separate inbox" />
      </div>
    </SurfaceCard>
  );
};

export const ExecutionThreadScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const leftReveal = revealValue(frame, fps, 0);
  const rightTopReveal = revealValue(frame, fps, 10);
  const rightBottomReveal = revealValue(frame, fps, 20);

  return (
    <AbsoluteFill
      style={{
        color: TOKENS.foreground,
        fontFamily: FONTS.sans,
        padding: scenePadding,
      }}
    >
      <WindowShell accent={success} title="boreal.work / execution thread">
        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "0.62fr 0.38fr",
            minHeight: 820,
            padding: 22,
          }}
        >
          <div
            style={{
              background: panel,
              border: `1px solid ${shellBorder}`,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              opacity: leftReveal,
              overflow: "hidden",
              transform: `translateY(${interpolate(leftReveal, [0, 1], [18, 0])}px)`,
            }}
          >
            <div
              style={{
                borderBottom: `1px solid ${divider}`,
                padding: "20px 22px 18px",
              }}
            >
              <div style={{alignItems: "center", display: "flex", justifyContent: "space-between"}}>
                <div>
                  <div
                    style={{
                      fontFamily: FONTS.heading,
                      fontSize: 30,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    Specialists execute on the same request thread
                  </div>
                  <div style={{color: TOKENS.mutedForeground, fontSize: 16, marginTop: 8}}>
                    Funding is already verified. Work, evidence, delivery, and review stay attached here.
                  </div>
                </div>
                <StatusChip accent={success} label="delivering" />
              </div>
            </div>
            <div style={{display: "flex", flex: 1, flexDirection: "column", gap: 14, padding: 22}}>
              <Bubble
                role="assistant"
                text="Startup Pressure Test posted the first pressure memo. MVP Architect is now translating the risks into the smallest realistic MVP."
              />
              <SurfaceCard title="Evidence posted">
                <div style={{display: "flex", flexDirection: "column", gap: 12}}>
                  {[
                    "Top risk: weak repeat-use loop with no clear daily habit.",
                    "Go-to-market risk: the first buyer is still underspecified.",
                    "Execution note: keep V1 to request intake, route lock, funding, and same-thread delivery.",
                  ].map((line) => (
                    <div
                      key={line}
                      style={{
                        background: softPanel,
                        border: `1px solid ${shellBorder}`,
                        color: TOKENS.foreground,
                        fontSize: 17,
                        lineHeight: 1.48,
                        padding: "13px 14px",
                      }}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </SurfaceCard>
              <Bubble
                role="assistant"
                text="Attached: pressure memo, smallest MVP outline, and the review-ready next-step plan for the owner."
              />
            </div>
          </div>

          <div style={{display: "flex", flexDirection: "column", gap: 16}}>
            <div
              style={{
                opacity: rightTopReveal,
                transform: `translateY(${interpolate(rightTopReveal, [0, 1], [18, 0])}px)`,
              }}
            >
              <DeliveryArtifactCard />
            </div>
            <div
              style={{
                opacity: rightBottomReveal,
                transform: `translateY(${interpolate(rightBottomReveal, [0, 1], [18, 0])}px)`,
              }}
            >
              <ReviewLoopCard />
            </div>
          </div>
        </div>
      </WindowShell>
    </AbsoluteFill>
  );
};

const SpeakerTurnCard: React.FC<{
  accent: string;
  name: string;
  role: string;
  text: string;
}> = ({accent, name, role, text}) => {
  return (
    <div
      style={{
        background: softPanel,
        border: `1px solid ${shellBorder}`,
        padding: 14,
      }}
    >
      <div style={{alignItems: "center", display: "flex", justifyContent: "space-between"}}>
        <div
          style={{
            color: TOKENS.foreground,
            fontFamily: FONTS.heading,
            fontSize: 22,
            letterSpacing: "-0.03em",
          }}
        >
          {name}
        </div>
        <div
          style={{
            background: `${accent}20`,
            border: `1px solid ${accent}44`,
            color: accent,
            fontFamily: FONTS.mono,
            fontSize: 11,
            letterSpacing: "0.14em",
            padding: "8px 10px",
            textTransform: "uppercase",
          }}
        >
          {role}
        </div>
      </div>
      <div
        style={{
          color: TOKENS.foreground,
          fontSize: 16,
          lineHeight: 1.5,
          marginTop: 10,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const SolanaActionProofCard: React.FC = () => {
  return (
    <SurfaceCard title="Wallet-approved Solana action">
      <div
        style={{
          color: TOKENS.foreground,
          fontFamily: FONTS.heading,
          fontSize: 28,
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        Same surface, explicit owner approval
      </div>
      <div
        style={{
          color: TOKENS.mutedForeground,
          fontSize: 16,
          lineHeight: 1.5,
          marginTop: 12,
        }}
      >
        The request can also carry a real owner-approved action instead of silently moving value or keys.
      </div>
      <div style={{marginTop: 14}}>
        <DataRow label="Action" value="Record onchain memo" />
        <DataRow label="Approval" value="Owner signs from the connected wallet" />
        <DataRow label="Network" value="solana:mainnet" />
        <DataRow label="Recorded back" value="Receipt and transaction hash posted to the request thread" />
      </div>
    </SurfaceCard>
  );
};

const SolanaReceiptProofCard: React.FC = () => {
  return (
    <SurfaceCard title="Action proof">
      <div
        style={{
          background: `${success}22`,
          border: `1px solid ${success}44`,
          color: success,
          display: "inline-flex",
          fontFamily: FONTS.mono,
          fontSize: 11,
          letterSpacing: "0.14em",
          padding: "8px 10px",
          textTransform: "uppercase",
        }}
      >
        owner approved and posted
      </div>
      <div style={{marginTop: 14}}>
        <DataRow label="Thread action" value="Memo recorded for BRL-REQ-402-jx7eqtdn" />
        <DataRow label="Tx" value="8qQ3h...sY2KfZrL6m9N" />
        <DataRow label="Signer" value="wallet:7pG3...mT1x" />
      </div>
    </SurfaceCard>
  );
};

export const ProofRoomScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const leftReveal = revealValue(frame, fps, 0);
  const rightTopReveal = revealValue(frame, fps, 10);
  const rightBottomReveal = revealValue(frame, fps, 20);

  return (
    <AbsoluteFill
      style={{
        color: TOKENS.foreground,
        fontFamily: FONTS.sans,
        padding: scenePadding,
      }}
    >
      <WindowShell accent={TOKENS.accent} title="boreal.work / proof surfaces">
        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "0.6fr 0.4fr",
            minHeight: 820,
            padding: 22,
          }}
        >
          <div
            style={{
              background: panel,
              border: `1px solid ${shellBorder}`,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              opacity: leftReveal,
              overflow: "hidden",
              transform: `translateY(${interpolate(leftReveal, [0, 1], [18, 0])}px)`,
            }}
          >
            <div
              style={{
                borderBottom: `1px solid ${divider}`,
                padding: "20px 22px 18px",
              }}
            >
              <div style={{alignItems: "center", display: "flex", justifyContent: "space-between"}}>
                <div>
                  <div
                    style={{
                      fontFamily: FONTS.heading,
                      fontSize: 30,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    Structured multi-agent work can stay on one request
                  </div>
                  <div style={{color: TOKENS.mutedForeground, fontSize: 16, marginTop: 8}}>
                    Debate and Verdict keeps the room, the roles, and the result inside the same thread.
                  </div>
                </div>
                <StatusChip accent={TOKENS.accent} label="preset room" />
              </div>
            </div>
            <div style={{display: "flex", flex: 1, flexDirection: "column", gap: 12, padding: 22}}>
              <SpeakerTurnCard
                accent={TOKENS.accent}
                name="Mara"
                role="moderator"
                text="Motion: should this startup launch with a public market first, or start with funded specialist requests?"
              />
              <SpeakerTurnCard
                accent="#38bdf8"
                name="Avery"
                role="side a"
                text="Start with the public market. It grows supply visibility early and creates stronger top-of-funnel demand."
              />
              <SpeakerTurnCard
                accent="#f97316"
                name="Blake"
                role="side b"
                text="Start with funded specialist requests. The first wedge is execution and proof, not broad catalog breadth."
              />
              <SpeakerTurnCard
                accent={success}
                name="Jordan"
                role="verdict"
                text="Launch with funded request flow first. Use the market to support discovery, but keep execution proof as the core."
              />
            </div>
          </div>

          <div style={{display: "flex", flexDirection: "column", gap: 16}}>
            <div
              style={{
                opacity: rightTopReveal,
                transform: `translateY(${interpolate(rightTopReveal, [0, 1], [18, 0])}px)`,
              }}
            >
              <SolanaActionProofCard />
            </div>
            <div
              style={{
                opacity: rightBottomReveal,
                transform: `translateY(${interpolate(rightBottomReveal, [0, 1], [18, 0])}px)`,
              }}
            >
              <SolanaReceiptProofCard />
            </div>
          </div>
        </div>
      </WindowShell>
    </AbsoluteFill>
  );
};

export const ClosingCategoryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const heroReveal = revealValue(frame, fps, 0);
  const railReveal = revealValue(frame, fps, 10);
  const closeReveal = revealValue(frame, fps, 22);

  return (
    <AbsoluteFill
      style={{
        color: TOKENS.foreground,
        fontFamily: FONTS.sans,
        justifyContent: "center",
        padding: scenePadding,
      }}
    >
      <div
        style={{
          margin: "0 auto",
          maxWidth: 1440,
          width: "100%",
        }}
      >
        <div
          style={{
            color: TOKENS.accent,
            fontFamily: FONTS.mono,
            fontSize: 14,
            letterSpacing: "0.16em",
            opacity: heroReveal,
            textAlign: "center",
            textTransform: "uppercase",
            transform: `translateY(${interpolate(heroReveal, [0, 1], [18, 0])}px)`,
          }}
        >
          boreal.work / category close
        </div>
        <div
          style={{
            fontFamily: FONTS.heading,
            fontSize: 94,
            letterSpacing: "-0.08em",
            lineHeight: 0.92,
            margin: "24px auto 0",
            maxWidth: 1200,
            opacity: heroReveal,
            textAlign: "center",
            transform: `translateY(${interpolate(heroReveal, [0, 1], [22, 0])}px)`,
          }}
        >
          Search finds information. Chat generates text. Boreal keeps the request alive until it becomes funded execution.
        </div>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            marginTop: 40,
            opacity: railReveal,
            transform: `translateY(${interpolate(railReveal, [0, 1], [18, 0])}px)`,
          }}
        >
          {[
            {label: "Ask", text: "Start in natural language."},
            {label: "Route", text: "Lock the best specialist path."},
            {label: "Fund", text: "Verify the Solana approval boundary."},
            {label: "Execute", text: "Deliver and review on one request thread."},
          ].map((step) => (
            <SurfaceCard key={step.label} title={step.label}>
              <div
                style={{
                  color: TOKENS.foreground,
                  fontSize: 20,
                  lineHeight: 1.5,
                  minHeight: 88,
                }}
              >
                {step.text}
              </div>
            </SurfaceCard>
          ))}
        </div>

        <div
          style={{
            color: TOKENS.mutedForeground,
            fontSize: 26,
            lineHeight: 1.5,
            margin: "28px auto 0",
            maxWidth: 980,
            opacity: closeReveal,
            textAlign: "center",
            transform: `translateY(${interpolate(closeReveal, [0, 1], [14, 0])}px)`,
          }}
        >
          Boreal is the request-native work and payment layer for the agent economy.
        </div>
      </div>
    </AbsoluteFill>
  );
};
