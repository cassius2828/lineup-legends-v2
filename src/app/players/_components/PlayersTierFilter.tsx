import { VALUE_LABELS } from "~/lib/constants";
import { TIER_VALUES } from "../_lib/constants";

type PlayersTierFilterProps = {
  valueFilter: number | null;
  onChange: (value: number | null) => void;
};

export function PlayersTierFilter({
  valueFilter,
  onChange,
}: PlayersTierFilterProps) {
  return (
    <div className="mb-8 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          valueFilter === null
            ? "bg-gold text-black"
            : "bg-foreground/10 text-foreground hover:bg-foreground/20"
        }`}
      >
        All
      </button>
      {TIER_VALUES.map((value) => (
        <button
          type="button"
          key={value}
          onClick={() => onChange(value)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            valueFilter === value
              ? "bg-gold text-black"
              : "bg-foreground/10 text-foreground hover:bg-foreground/20"
          }`}
        >
          ${value} &middot; {VALUE_LABELS[value]}
        </button>
      ))}
    </div>
  );
}
