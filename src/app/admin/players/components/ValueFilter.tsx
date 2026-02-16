const ValueFilter = ({
  valueFilter,
  setValueFilter,
}: {
  valueFilter: number | null;
  setValueFilter: (value: number | null) => void;
}) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => setValueFilter(null)}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          valueFilter === null
            ? "bg-gold text-black"
            : "bg-foreground/10 text-foreground hover:bg-foreground/20"
        }`}
      >
        All
      </button>
      {[5, 4, 3, 2, 1].map((value) => (
        <button
          key={value}
          onClick={() => setValueFilter(value)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            valueFilter === value
              ? "bg-gold text-black"
              : "bg-foreground/10 text-foreground hover:bg-foreground/20"
          }`}
        >
          ${value}
        </button>
      ))}
    </div>
  );
};
export default ValueFilter;
