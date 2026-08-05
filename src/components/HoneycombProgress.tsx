import { STAGES, type Stage } from "@/lib/stages";

const STAGE_INDEX: Record<Stage, number> = {
  opening: 0,
  mirror: 1,
  differentiate: 2,
  pitch: 3,
  discovery: 4,
  connect: 5,
  column_mapping: 6,
  complete: 7,
};

export default function HoneycombProgress({ stage }: { stage: Stage }) {
  const currentIdx = STAGE_INDEX[stage];
  const cells = STAGES;

  return (
    <div className="flex items-center gap-1.5">
      {cells.map((s, i) => {
        const isComplete = i < currentIdx || stage === "complete";
        const isCurrent = i === currentIdx && stage !== "complete";
        const isPending = i > currentIdx;

        return (
          <div
            key={s}
            className="relative flex items-center justify-center transition-all duration-500"
            title={s}
          >
            <svg
              width="28"
              height="32"
              viewBox="0 0 28 32"
              className={`transition-all duration-500 ${
                isPending ? "opacity-40" : "opacity-100"
              }`}
            >
              <polygon
                points="14,1 27,8 27,24 14,31 1,24 1,8"
                fill={isComplete ? "#F4C10F" : isCurrent ? "#FEF6D8" : "none"}
                stroke={isComplete ? "#F4C10F" : isCurrent ? "#F4C10F" : "#D8D5CE"}
                strokeWidth="1.5"
                className={isCurrent ? "animate-pulse-honey" : ""}
              />
              {isComplete && (
                <text
                  x="14"
                  y="20"
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fill="#111111"
                  fontWeight="600"
                >
                  {i + 1}
                </text>
              )}
              {isCurrent && (
                <text
                  x="14"
                  y="20"
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fill="#B98600"
                  fontWeight="600"
                >
                  {i + 1}
                </text>
              )}
              {isPending && (
                <text
                  x="14"
                  y="20"
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fill="#9A9A9A"
                  fontWeight="400"
                >
                  {i + 1}
                </text>
              )}
            </svg>
          </div>
        );
      })}
    </div>
  );
}
