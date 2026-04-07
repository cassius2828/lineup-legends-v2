const SearchInput = ({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="focus:border-gold focus:ring-gold w-full rounded-lg border border-foreground/20 bg-foreground/10 px-4 py-3 text-foreground placeholder-foreground/50 focus:ring-1 focus:outline-none"
    />
  );
};
export default SearchInput;
