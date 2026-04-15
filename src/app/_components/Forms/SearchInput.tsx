import { CloseIcon } from "~/app/_components/common/icons";

const SearchInput = ({
  placeholder,
  value,
  onChange,
  onClear,
}: {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** When set, shows a clear control when the field has text */
  onClear?: () => void;
}) => {
  const showClear = Boolean(onClear && value.length > 0);

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`focus:border-gold focus:ring-gold border-foreground/20 bg-foreground/10 text-foreground placeholder-foreground/50 w-full rounded-lg border py-3 focus:ring-1 focus:outline-none ${showClear ? "pr-11 pl-4" : "px-4"}`}
      />
      {showClear && (
        <button
          type="button"
          onClick={() => onClear?.()}
          className="text-foreground/50 hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-0.5 transition-colors"
          aria-label="Clear search"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
export default SearchInput;
