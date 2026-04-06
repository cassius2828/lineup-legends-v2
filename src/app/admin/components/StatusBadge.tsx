const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: {
    label: "New",
    className: "bg-amber-400/15 text-amber-400",
  },
  read: {
    label: "Read",
    className: "bg-blue-400/15 text-blue-400",
  },
  resolved: {
    label: "Resolved",
    className: "bg-gold-300/15 text-gold-300",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const { label, className } = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-foreground/10 text-foreground/60",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
