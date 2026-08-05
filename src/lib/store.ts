import { promises as fs } from "fs";
import path from "path";
import type { Stage } from "./stages";

export type ColumnMapping = {
  internalField: string;
  clientColumnName: string;
  confidence: "auto-detected" | "user-confirmed" | "unmapped";
};

export type FounderProfile = {
  sessionId: string;
  industry: string | null;
  industryConfidence: number | null;
  rawDescription: string | null;
  differentiator: string | null;
  sourcingModel: string | null;
  currentChannel: string | null;
  currentTools: string | null;
  wantsToConnectData: boolean | null;
  selectedCrm: string | null;
  recommendedAgents: string[] | null;
  columnMappings: ColumnMapping[] | null;
  stage: Stage;
  createdAt: string;
  updatedAt: string;
};

const DATA_DIR = process.env.DATA_DIR
  ? process.env.DATA_DIR
  : process.env.VERCEL
    ? path.join("/tmp", "data")
    : path.join(process.cwd(), "data");
const PROFILES_DIR = path.join(DATA_DIR, "profiles");

async function ensureDirs() {
  await fs.mkdir(PROFILES_DIR, { recursive: true });
}

function profilePath(sessionId: string) {
  return path.join(PROFILES_DIR, `${sessionId}.json`);
}

export async function loadProfile(sessionId: string): Promise<FounderProfile | null> {
  await ensureDirs();
  try {
    const raw = await fs.readFile(profilePath(sessionId), "utf-8");
    return JSON.parse(raw) as FounderProfile;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: FounderProfile) {
  await ensureDirs();
  profile.updatedAt = new Date().toISOString();
  await fs.writeFile(profilePath(profile.sessionId), JSON.stringify(profile, null, 2));
}

export async function createProfile(sessionId: string): Promise<FounderProfile> {
  const profile: FounderProfile = {
    sessionId,
    industry: null,
    industryConfidence: null,
    rawDescription: null,
    differentiator: null,
    sourcingModel: null,
    currentChannel: null,
    currentTools: null,
    wantsToConnectData: null,
    selectedCrm: null,
    recommendedAgents: null,
    columnMappings: null,
    stage: "opening",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveProfile(profile);
  return profile;
}

export async function updateProfile(
  sessionId: string,
  updates: Partial<FounderProfile>
): Promise<FounderProfile> {
  const existing = await loadProfile(sessionId);
  if (!existing) {
    throw new Error(`Profile not found: ${sessionId}`);
  }
  const updated = { ...existing, ...updates, sessionId };
  await saveProfile(updated);
  return updated;
}
