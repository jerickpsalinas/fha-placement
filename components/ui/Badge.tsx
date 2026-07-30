import type { PlacementLevel } from "@/lib/placement/norms";

const LEVEL_STYLES: Record<PlacementLevel, string> = {
  intervention: "bg-intervention-bg text-intervention",
  on_level: "bg-onlevel-bg text-onlevel",
  advanced: "bg-advanced-bg text-advanced",
  whole_group: "bg-wholegroup-bg text-wholegroup",
};

const LEVEL_LABELS: Record<PlacementLevel, string> = {
  intervention: "Intervention",
  on_level: "On-Level",
  advanced: "Advanced",
  whole_group: "Whole-Group",
};

export function LevelBadge({ level }: { level: PlacementLevel }) {
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${LEVEL_STYLES[level]}`}>
      {LEVEL_LABELS[level]}
    </span>
  );
}

const PILL_COLORS = {
  blue: "bg-onlevel-bg text-onlevel",
  purple: "bg-[#F1E9FB] text-[#5B3E96]",
  green: "bg-advanced-bg text-advanced",
  gold: "bg-wholegroup-bg text-wholegroup",
} as const;

export function Badge({ children, color = "blue" }: { children: React.ReactNode; color?: keyof typeof PILL_COLORS }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PILL_COLORS[color]}`}>{children}</span>
  );
}
