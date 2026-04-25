import {execFile as execFileCallback} from "node:child_process";
import {mkdir, readFile, rm, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {ALL_VARIANTS, getSceneVoiceoverFile} from "../src/data/video-variants.ts";

const DEFAULT_COMPOSITION_ID = "HackathonUpdate60Sec";
const DEFAULT_MODEL = "gpt-4o-mini-tts";
const DEFAULT_FALLBACK_MODEL = "tts-1-hd";
const DEFAULT_VOICE = "alloy";
const DEFAULT_SPEED = 1.06;
const DEFAULT_INSTRUCTIONS =
  "Narrate this like a concise technical product demo for a Solana hackathon update. Calm, clear, confident, slightly brisk, and precise. Avoid hype and long dramatic pauses.";

type SpeechAttempt = {
  body: Record<string, number | string>;
  label: string;
};

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const remotionRoot = path.resolve(scriptDirectory, "..");
const repositoryRoot = path.resolve(remotionRoot, "..");
const nextAppEnvFile = path.join(repositoryRoot, "next-app", ".env.local");
const publicRoot = path.join(remotionRoot, "public");
const generatedManifestFile = path.join(remotionRoot, "src", "data", "generated-voiceover.ts");
const execFile = promisify(execFileCallback);

type GeneratedSceneVoiceover = {
  audioDurationInSeconds: number;
  playbackRate: number;
  relativePath: string;
  sceneId: string;
};

const parseEnvFile = async (filePath: string) => {
  const fileContents = await readFile(filePath, "utf8");
  const entries = fileContents.split(/\r?\n/);
  const env: Record<string, string> = {};

  for (const entry of entries) {
    const trimmedEntry = entry.trim();
    if (!trimmedEntry || trimmedEntry.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedEntry.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedEntry.slice(0, separatorIndex).trim();
    const rawValue = trimmedEntry.slice(separatorIndex + 1).trim();
    env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }

  return env;
};

const getApiKey = async () => {
  const fileEnv = await parseEnvFile(nextAppEnvFile);
  return process.env.OPENAI_KEY ?? process.env.OPENAI_API_KEY ?? fileEnv.OPENAI_KEY ?? fileEnv.OPENAI_API_KEY;
};

const getVariant = (compositionId: string) => {
  const variant = ALL_VARIANTS.find((candidate) => candidate.compositionId === compositionId);

  if (!variant) {
    throw new Error(`Unknown composition "${compositionId}".`);
  }

  if (variant.voiceoverMode !== "scene") {
    throw new Error(`Composition "${compositionId}" is not configured for scene-level voiceover.`);
  }

  return variant;
};

const buildAttempts = () => {
  const requestedModel = process.env.OPENAI_TTS_MODEL ?? DEFAULT_MODEL;
  const requestedVoice = process.env.OPENAI_TTS_VOICE ?? DEFAULT_VOICE;
  const requestedSpeed = Number(process.env.OPENAI_TTS_SPEED ?? DEFAULT_SPEED);
  const requestedInstructions = process.env.OPENAI_TTS_INSTRUCTIONS ?? DEFAULT_INSTRUCTIONS;
  const safeSpeed = Number.isFinite(requestedSpeed) ? requestedSpeed : DEFAULT_SPEED;

  const attempts: SpeechAttempt[] = [
    {
      label: `${requestedModel} + instructions`,
      body: {
        format: "mp3",
        input: "",
        instructions: requestedInstructions,
        model: requestedModel,
        speed: safeSpeed,
        voice: requestedVoice,
      },
    },
    {
      label: `${requestedModel} basic`,
      body: {
        format: "mp3",
        input: "",
        model: requestedModel,
        speed: safeSpeed,
        voice: requestedVoice,
      },
    },
  ];

  if (requestedModel !== DEFAULT_FALLBACK_MODEL || requestedVoice !== DEFAULT_VOICE) {
    attempts.push({
      label: `${DEFAULT_FALLBACK_MODEL} fallback`,
      body: {
        input: "",
        model: DEFAULT_FALLBACK_MODEL,
        response_format: "mp3",
        speed: safeSpeed,
        voice: DEFAULT_VOICE,
      },
    });
  }

  return attempts;
};

const parseErrorPayload = async (response: Response) => {
  const text = await response.text();

  try {
    const json = JSON.parse(text) as {
      error?: {
        message?: string;
      };
    };
    return json.error?.message ?? text;
  } catch {
    return text;
  }
};

const getAudioDurationInSeconds = async (filePath: string) => {
  const {stdout} = await execFile("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);

  return Number(stdout.trim());
};

const writeGeneratedManifest = async (
  compositionId: string,
  scenes: GeneratedSceneVoiceover[],
) => {
  const fileContents = `export const GENERATED_VOICEOVER_MANIFEST = ${JSON.stringify(
    {
      [compositionId]: scenes,
    },
    null,
    2,
  )} as const;\n`;

  await writeFile(generatedManifestFile, fileContents);
};

const generateSpeech = async (apiKey: string, input: string) => {
  const attempts = buildAttempts();
  let lastError = "Unknown OpenAI speech error.";

  for (const attempt of attempts) {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...attempt.body,
        input,
      }),
    });

    if (response.ok) {
      return Buffer.from(await response.arrayBuffer());
    }

    lastError = await parseErrorPayload(response);
    console.warn(`[voiceover] ${attempt.label} failed: ${lastError}`);
  }

  throw new Error(lastError);
};

const run = async () => {
  const compositionId = process.argv[2] ?? DEFAULT_COMPOSITION_ID;
  const variant = getVariant(compositionId);
  const apiKey = await getApiKey();

  if (!apiKey) {
    throw new Error(`Missing OpenAI API key. Expected OPENAI_KEY or OPENAI_API_KEY in ${nextAppEnvFile}.`);
  }

  const outputDirectory = path.join(publicRoot, "voiceover", compositionId);
  await rm(outputDirectory, {force: true, recursive: true});
  await mkdir(outputDirectory, {recursive: true});

  console.log(`[voiceover] Generating scene narration for ${compositionId}`);
  const manifestScenes: GeneratedSceneVoiceover[] = [];

  for (const [sceneIndex, scene] of variant.scenes.entries()) {
    const narration = scene.beats.map((beat) => beat.voiceover.trim()).join(" ");
    const relativeOutputPath = getSceneVoiceoverFile(compositionId, sceneIndex, scene.id);
    const absoluteOutputPath = path.join(publicRoot, relativeOutputPath);

    await mkdir(path.dirname(absoluteOutputPath), {recursive: true});
    const audioBuffer = await generateSpeech(apiKey, narration);
    await writeFile(absoluteOutputPath, audioBuffer);

    const audioDurationInSeconds = await getAudioDurationInSeconds(absoluteOutputPath);
    const playbackRate = Number(
      Math.max(1, audioDurationInSeconds / scene.durationInSeconds).toFixed(2),
    );
    manifestScenes.push({
      audioDurationInSeconds,
      playbackRate,
      relativePath: relativeOutputPath,
      sceneId: scene.id,
    });

    console.log(`[voiceover] Wrote ${relativeOutputPath}`);
  }

  await writeGeneratedManifest(compositionId, manifestScenes);
  console.log(`[voiceover] Done.`);
};

run().catch((error) => {
  console.error("[voiceover] Generation failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
