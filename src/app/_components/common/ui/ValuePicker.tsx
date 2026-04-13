const VALUES = [1, 2, 3, 4, 5] as const;

const SIZE_CLASSES = {
  sm: "flex-1 rounded-lg py-2 text-sm font-medium",
  md: "flex-1 rounded-lg py-3 text-sm font-medium",
  square:
    "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold",
} as const;

type ValuePickerProps = {
  value: number;
  onChange: (v: number) => void;
  size?: keyof typeof SIZE_CLASSES;
};

export function ValuePicker({
  value,
  onChange,
  size = "md",
}: ValuePickerProps) {
  return (
    <div className="flex gap-2">
      {VALUES.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`transition-all ${SIZE_CLASSES[size]} ${
            value === v
              ? "bg-gold text-black"
              : "bg-foreground/10 text-foreground hover:bg-foreground/20"
          }`}
        >
          ${v}
        </button>
      ))}
    </div>
  );
}
