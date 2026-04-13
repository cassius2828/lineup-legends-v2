import type { ReactNode } from "react";
import { Button } from "~/app/_components/common/ui/Button";

type LineupSortBarProps = {
  options: readonly { value: string; label: string }[];
  sort: string;
  onSortChange: (sort: string) => void;
  trailing?: ReactNode;
};

export function LineupSortBar({
  options,
  sort,
  onSortChange,
  trailing,
}: LineupSortBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          onClick={() => onSortChange(option.value)}
          color={sort === option.value ? "gold" : "white"}
          variant={sort === option.value ? "solid" : "subtle"}
        >
          {option.label}
        </Button>
      ))}
      {trailing}
    </div>
  );
}
