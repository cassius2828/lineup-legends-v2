import type { AdminStatCard } from "../_lib/buildStatCards";

type AdminStatsGridProps = {
  cards: AdminStatCard[];
};

export function AdminStatsGrid({ cards }: AdminStatsGridProps) {
  return (
    <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`relative overflow-hidden rounded-xl border p-5 transition-colors ${
            card.highlight
              ? "border-amber-400/30 bg-amber-400/5"
              : "border-foreground/10 bg-foreground/3"
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-foreground/50 text-sm">{card.label}</p>
              <p className="text-foreground mt-1 text-3xl font-bold">
                {card.value.toLocaleString()}
              </p>
              {card.subtitle && (
                <p className="text-foreground/40 mt-1 text-xs">
                  {card.subtitle}
                </p>
              )}
            </div>
            <div className={`rounded-lg p-2.5 ${card.bgColor}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
