const CreateLineupHeader = ({
  remainingBudget,
  activePlayer,
}: {
  remainingBudget: number;
  activePlayer: boolean;
}) => {
  return (
    <header className="mb-4 flex flex-col items-center justify-center">
      <h1 className="text-foreground text-2xl font-bold tracking-wide uppercase">
        Build Your Starting 5
      </h1>
      <span
        className={`mt-1 text-3xl font-bold transition-colors duration-200 ${
          remainingBudget < 3
            ? "text-red-400"
            : remainingBudget < 6
              ? "text-gold"
              : "text-foreground"
        }`}
      >
        ${remainingBudget}
      </span>
      {activePlayer && (
        <span className="text-foreground/60 mt-1 animate-pulse text-sm">
          Drag to a position slot...
        </span>
      )}
    </header>
  );
};
export default CreateLineupHeader;
