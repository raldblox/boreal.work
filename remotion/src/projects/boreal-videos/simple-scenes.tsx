import React from "react";
import {
  AbsoluteFill,
  Freeze,
  Img,
  interpolate,
  OffthreadVideo,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {FONTS, TOKENS} from "../../generations/home-chat-accurate-2026/theme";
import {HomeChatMockup} from "../../generations/home-chat-accurate-2026/compositions";

const warning = "#f59e0b";
const success = "#22c55e";
const blue = "#38bdf8";

const scenePadding = 60;
const cardBorder = "rgba(255,255,255,0.12)";
const cardShadow = "0 32px 120px rgba(0,0,0,0.48)";

const page = (name: string) => staticFile(`pdf/request-native-commerce/${name}`);
const notebookLmVideo = staticFile("video/PitchVideo/notebooklm.mp4");

const revealValue = (frame: number, fps: number, delay = 0, stiffness = 110) =>
  spring({
    fps,
    frame: frame - delay,
    config: {
      damping: 18,
      stiffness,
    },
  });

const SceneSurface: React.FC<{
  children: React.ReactNode;
  note: string;
  noteTone?: "demo" | "ok";
  showNote?: boolean;
}> = ({children, note, noteTone = "demo", showNote = false}) => {
  return (
    <AbsoluteFill
      style={{
        background: "#000000",
        color: TOKENS.foreground,
        fontFamily: FONTS.sans,
        overflow: "hidden",
      }}
    >
      {showNote ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            left: 0,
            pointerEvents: "none",
            position: "absolute",
            right: 0,
            top: 22,
            zIndex: 20,
          }}
        >
          <div
            style={{
              background: noteTone === "demo" ? `${warning}16` : `${TOKENS.accent}16`,
              border: `1px solid ${
                noteTone === "demo" ? `${warning}55` : `${TOKENS.accent}55`
              }`,
              color: noteTone === "demo" ? warning : TOKENS.accent,
              fontFamily: FONTS.mono,
              fontSize: 12,
              letterSpacing: "0.16em",
              padding: "10px 14px",
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            {note}
          </div>
        </div>
      ) : null}
      {children}
    </AbsoluteFill>
  );
};

const PageCard: React.FC<{
  alt: string;
  delay?: number;
  src: string;
  style?: React.CSSProperties;
}> = ({alt, delay = 0, src, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = revealValue(frame, fps, delay);
  const drift = interpolate(frame, [0, 240], [0, -12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, 240], [1.01, 1.045], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        background: "#ffffff",
        border: `1px solid ${cardBorder}`,
        borderRadius: 28,
        boxShadow: cardShadow,
        opacity: reveal,
        overflow: "hidden",
        transform: `translateY(${interpolate(reveal, [0, 1], [26, 0])}px) scale(${interpolate(
          reveal,
          [0, 1],
          [0.965, 1]
        )})`,
        ...style,
      }}
    >
      <Img
        alt={alt}
        src={src}
        style={{
          display: "block",
          height: "100%",
          objectFit: "cover",
          transform: `translateY(${drift}px) scale(${scale})`,
          transformOrigin: "center center",
          width: "100%",
        }}
      />
    </div>
  );
};

const NotebookVideoCard: React.FC<{
  delay?: number;
  src: string;
  startFrame: number;
  style?: React.CSSProperties;
}> = ({delay = 0, src, startFrame, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = revealValue(frame, fps, delay);
  const zoom = interpolate(frame, [0, 240], [1.01, 1.05], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        background: "#000000",
        border: `1px solid ${cardBorder}`,
        borderRadius: 28,
        boxShadow: cardShadow,
        opacity: reveal,
        overflow: "hidden",
        position: "relative",
        transform: `translateY(${interpolate(reveal, [0, 1], [26, 0])}px) scale(${interpolate(
          reveal,
          [0, 1],
          [0.965, 1]
        )})`,
        ...style,
      }}
    >
      <OffthreadVideo
        muted
        src={src}
        style={{
          display: "block",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
          width: "100%",
        }}
        trimBefore={startFrame}
      />
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.06) 36%, rgba(0,0,0,0.42) 100%)",
          inset: 0,
          pointerEvents: "none",
          position: "absolute",
        }}
      />
    </div>
  );
};

const HomeChatSnapshotCard: React.FC<{
  delay?: number;
  frameToDisplay: number;
  scale?: number;
  style?: React.CSSProperties;
  translateX?: number;
  translateY?: number;
}> = ({
  delay = 0,
  frameToDisplay,
  scale = 1,
  style,
  translateX = 0,
  translateY = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = revealValue(frame, fps, delay);

  return (
    <div
      style={{
        background: "#000000",
        border: `1px solid ${cardBorder}`,
        borderRadius: 28,
        boxShadow: cardShadow,
        opacity: reveal,
        overflow: "hidden",
        position: "relative",
        transform: `translateY(${interpolate(reveal, [0, 1], [26, 0])}px) scale(${interpolate(
          reveal,
          [0, 1],
          [0.965, 1]
        )})`,
        ...style,
      }}
    >
      <div
        style={{
          height: "100%",
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
          transformOrigin: "center center",
          width: "100%",
        }}
      >
        <Freeze frame={frameToDisplay}>
          <HomeChatMockup />
        </Freeze>
      </div>
    </div>
  );
};

const ChipRow: React.FC<{
  chips: Array<{accent?: string; text: string}>;
  delay?: number;
}> = ({chips, delay = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = revealValue(frame, fps, delay);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        opacity: reveal,
        transform: `translateY(${interpolate(reveal, [0, 1], [18, 0])}px)`,
      }}
    >
      {chips.map((chip) => {
        const accent = chip.accent ?? TOKENS.accent;
        return (
          <div
            key={chip.text}
            style={{
              background: `${accent}1f`,
              border: `1px solid ${accent}55`,
              color: accent,
              fontFamily: FONTS.mono,
              fontSize: 12,
              letterSpacing: "0.14em",
              padding: "11px 13px",
              textTransform: "uppercase",
            }}
          >
            {chip.text}
          </div>
        );
      })}
    </div>
  );
};

const SplitStage: React.FC<{
  children: React.ReactNode;
  rightWidth?: string;
}> = ({children, rightWidth = "0.34fr"}) => {
  return (
    <div
      style={{
        display: "grid",
        gap: 24,
        gridTemplateColumns: `0.66fr ${rightWidth}`,
        height: "100%",
        padding: `${scenePadding + 28}px ${scenePadding}px ${scenePadding}px`,
      }}
    >
      {children}
    </div>
  );
};

const FullStage: React.FC<{children: React.ReactNode}> = ({children}) => {
  return (
    <div
      style={{
        height: "100%",
        padding: `${scenePadding + 28}px ${scenePadding}px ${scenePadding}px`,
      }}
    >
      {children}
    </div>
  );
};

export const ProblemHookScene: React.FC<{showNote?: boolean}> = ({showNote = false}) => {
  return (
    <SceneSurface note="Animated scene OK" noteTone="ok" showNote={showNote}>
      <FullStage>
        <div
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "0.72fr 0.28fr",
            height: "100%",
          }}
        >
          <NotebookVideoCard
            src={notebookLmVideo}
            startFrame={0}
            style={{height: 800}}
          />
          <div style={{display: "flex", flexDirection: "column", gap: 18}}>
            <PageCard
              alt="The lifecycle of work is split across tools"
              delay={8}
              src={page("page-03.png")}
              style={{height: 500}}
            />
            <PageCard
              alt="The internet has tools for search, chat, labor, and payments but still no clean layer for fulfillment"
              delay={16}
              src={page("page-04.png")}
              style={{height: 282}}
            />
          </div>
        </div>
        <div style={{marginTop: 18}}>
          <ChipRow
            chips={[
              {accent: warning, text: "intent dies in chat"},
              {accent: warning, text: "buried in software"},
              {accent: warning, text: "split across tools"},
            ]}
            delay={20}
          />
        </div>
      </FullStage>
    </SceneSurface>
  );
};

export const FreeIntakeScene: React.FC<{showNote?: boolean}> = ({showNote = false}) => {
  return (
    <SceneSurface note="Actual Boreal render" showNote={showNote}>
      <SplitStage>
        <HomeChatSnapshotCard
          frameToDisplay={60}
          scale={1.08}
          style={{height: 760}}
          translateY={20}
        />
        <div style={{display: "flex", flexDirection: "column", gap: 18}}>
          <PageCard
            alt="Boreal turns a request into a funded work thread"
            delay={10}
            src={page("page-05.png")}
            style={{height: 520}}
          />
          <ChipRow
            chips={[
              {text: "human or agent request"},
              {accent: success, text: "tracked request"},
              {accent: blue, text: "funded thread"},
            ]}
            delay={18}
          />
        </div>
      </SplitStage>
    </SceneSurface>
  );
};

export const RouteLockScene: React.FC<{showNote?: boolean}> = ({showNote = false}) => {
  return (
    <SceneSurface note="Actual Boreal render" showNote={showNote}>
      <SplitStage>
        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateRows: "1fr 1fr",
            height: 760,
          }}
        >
          <HomeChatSnapshotCard
            frameToDisplay={300}
            scale={1.1}
            style={{height: 371}}
            translateY={40}
          />
          <HomeChatSnapshotCard
            delay={8}
            frameToDisplay={420}
            scale={1.08}
            style={{height: 371}}
            translateY={-30}
          />
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: 18}}>
          <PageCard
            alt="The future is a better system for routing requests to the best possible supply"
            delay={10}
            src={page("page-07.png")}
            style={{height: 520}}
          />
          <ChipRow
            chips={[
              {text: "take best match"},
              {accent: success, text: "approve quote"},
              {accent: blue, text: "invite to team"},
              {accent: warning, text: "open to market"},
            ]}
            delay={18}
          />
        </div>
      </SplitStage>
    </SceneSurface>
  );
};

export const PaymentRequiredScene: React.FC<{showNote?: boolean}> = ({showNote = false}) => {
  return (
    <SceneSurface note="Better with live funded-request capture" showNote={showNote}>
      <FullStage>
        <div
          style={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: "0.68fr 0.32fr",
            height: "100%",
          }}
        >
          <PageCard
            alt="The 402 execution boundary prevents expensive work from dying in chat"
            src={page("page-08.png")}
            style={{height: 800}}
          />
          <div style={{display: "flex", flexDirection: "column", gap: 18, justifyContent: "flex-end"}}>
            <ChipRow
              chips={[
                {accent: warning, text: "quote visible"},
                {accent: TOKENS.accent, text: "seller visible"},
                {accent: success, text: "same request resumes"},
              ]}
            />
            <PageCard
              alt="One tracked thread from intent to delivery"
              delay={12}
              src={page("page-06.png")}
              style={{height: 300}}
            />
          </div>
        </div>
      </FullStage>
    </SceneSurface>
  );
};

export const SolanaVerificationScene: React.FC<{showNote?: boolean}> = ({showNote = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = revealValue(frame, fps, 0);

  return (
    <SceneSurface note="Better with live verification capture" showNote={showNote}>
      <FullStage>
        <div
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "0.68fr 0.32fr",
            height: "100%",
          }}
        >
          <NotebookVideoCard
            src={notebookLmVideo}
            startFrame={3720}
            style={{height: 800}}
          />
          <div style={{display: "flex", flexDirection: "column", gap: 18}}>
            <PageCard
              alt="402 boundary and Solana mainnet verification"
              delay={8}
              src={page("page-08.png")}
              style={{height: 540}}
            />
            <ChipRow
              chips={[
                {accent: success, text: "solana mainnet verification"},
                {accent: success, text: "approval stays in loop"},
                {accent: TOKENS.accent, text: "no rematch"},
              ]}
              delay={12}
            />
          </div>
        </div>
      </FullStage>
    </SceneSurface>
  );
};

export const ExecutionThreadScene: React.FC<{showNote?: boolean}> = ({showNote = false}) => {
  return (
    <SceneSurface note="Actual Boreal render" showNote={showNote}>
      <FullStage>
        <div
          style={{
            display: "grid",
            gap: 22,
            gridTemplateColumns: "0.64fr 0.36fr",
            height: "100%",
          }}
        >
          <HomeChatSnapshotCard
            frameToDisplay={540}
            scale={1.08}
            style={{height: 760}}
            translateY={26}
          />
          <div style={{display: "flex", flexDirection: "column", gap: 18}}>
            <PageCard
              alt="A live work surface where demand and supply actually meet"
              delay={8}
              src={page("page-09.png")}
              style={{height: 520}}
            />
            <ChipRow
              chips={[
                {accent: TOKENS.accent, text: "progress"},
                {accent: success, text: "evidence"},
                {accent: blue, text: "delivery"},
                {accent: warning, text: "review"},
              ]}
              delay={14}
            />
          </div>
        </div>
      </FullStage>
    </SceneSurface>
  );
};

export const ProofRoomScene: React.FC<{showNote?: boolean}> = ({showNote = false}) => {
  return (
    <SceneSurface note="Better with live team-room capture" showNote={showNote}>
      <SplitStage rightWidth="0.36fr">
        <PageCard
          alt="A request-native layer built for external agents to find work and get paid"
          src={page("page-10.png")}
          style={{height: 760}}
        />
        <div style={{display: "flex", flexDirection: "column", gap: 18}}>
          <PageCard
            alt="Every completed request creates stronger signals around fit and trust"
            delay={10}
            src={page("page-11.png")}
            style={{height: 520}}
          />
          <ChipRow
            chips={[
              {text: "10+ specialized agents"},
              {accent: TOKENS.accent, text: "preset teams"},
              {accent: success, text: "AgentCash lane"},
              {accent: blue, text: "reputation compounds"},
            ]}
            delay={18}
          />
        </div>
      </SplitStage>
    </SceneSurface>
  );
};

export const ClosingCategoryScene: React.FC<{showNote?: boolean}> = ({showNote = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const first = revealValue(frame, fps, 0);
  const second = revealValue(frame, fps, 38);

  return (
    <SceneSurface note="Animated scene OK" noteTone="ok" showNote={showNote}>
      <FullStage>
        <AbsoluteFill
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "center",
            padding: `${scenePadding + 24}px ${scenePadding}px ${scenePadding}px`,
          }}
        >
          <PageCard
            alt="Boreal versus the legacy stack"
            src={page("page-12.png")}
            style={{
              height: 760,
              opacity: first * (1 - second),
              position: "absolute",
              width: 1360,
            }}
          />
          <PageCard
            alt="Real outcomes, actually finished"
            delay={36}
            src={page("page-13.png")}
            style={{
              height: 760,
              opacity: second,
              position: "absolute",
              width: 1360,
            }}
          />
        </AbsoluteFill>
      </FullStage>
    </SceneSurface>
  );
};
