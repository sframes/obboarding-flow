export const STAGES = [
  "opening",
  "mirror",
  "differentiate",
  "pitch",
  "discovery",
  "connect",
  "column_mapping",
  "complete",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  opening: "Getting Started",
  mirror: "Mirror",
  differentiate: "Differentiate",
  pitch: "Agent Pitch",
  discovery: "Discovery",
  connect: "Connect",
  column_mapping: "Column Mapping",
  complete: "Complete",
};

export function isValidStage(s: string): s is Stage {
  return (STAGES as readonly string[]).includes(s);
}
