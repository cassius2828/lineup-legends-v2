"use client";

interface DuplicateMatch {
  firstName: string;
  lastName: string;
  value?: number;
  imgUrl?: string;
  source: "pool" | "requested";
  matchPercent: number;
}

function getMatchColor(percent: number) {
  if (percent >= 90)
    return {
      border: "border-red-500/60",
      text: "text-red-400",
      bg: "bg-red-500/10",
    };
  if (percent >= 75)
    return {
      border: "border-yellow-500/60",
      text: "text-yellow-400",
      bg: "bg-yellow-500/10",
    };
  return {
    border: "border-green-500/60",
    text: "text-green-400",
    bg: "bg-green-500/10",
  };
}

export function DuplicateHints({
  duplicates,
}: {
  duplicates: DuplicateMatch[];
}) {
  if (duplicates.length === 0) return null;

  return (
    <div className="border-foreground/10 bg-foreground/3 rounded-lg border p-3">
      <p className="text-foreground/50 mb-2 text-xs font-medium tracking-wider uppercase">
        Potential matches found
      </p>
      <div className="space-y-2">
        {duplicates.slice(0, 5).map((d, i) => {
          const colors = getMatchColor(d.matchPercent);
          return (
            <div
              key={`${d.firstName}-${d.lastName}-${d.source}-${i}`}
              className={`flex items-center justify-between rounded-md border px-3 py-2 ${colors.border} ${colors.bg}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-foreground text-sm font-medium">
                  {d.firstName} {d.lastName}
                </span>
                <span className="bg-foreground/10 text-foreground/50 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase">
                  In Pool
                </span>
                {d.value && (
                  <span className="text-foreground/40 text-xs">${d.value}</span>
                )}
              </div>
              <span className={`text-sm font-semibold ${colors.text}`}>
                {d.matchPercent}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
