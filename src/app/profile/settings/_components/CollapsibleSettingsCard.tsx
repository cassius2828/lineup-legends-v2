import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export default function CollapsibleSettingsCard({
  title,
  description,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-foreground/10 rounded-xl border p-5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between"
      >
        <div className="text-left">
          <h3 className="text-foreground font-medium">{title}</h3>
          <p className="text-foreground/50 text-sm">{description}</p>
        </div>
        <ChevronDown
          className={`text-foreground/40 h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
