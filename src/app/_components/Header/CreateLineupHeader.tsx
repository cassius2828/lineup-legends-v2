const CreateLineupHeader = ({
  remainingBudget,
  activePlayer,
}: {
  remainingBudget: number;
  activePlayer: boolean;
}) => {
  return (
    <header className="mb-4 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold tracking-wide text-white uppercase">
        Build Your Starting 5
      </h1>
      <span
        className={`mt-1 text-3xl font-bold transition-colors duration-200 ${
          remainingBudget < 3
            ? "text-red-400"
            : remainingBudget < 6
              ? "text-gold"
              : "text-white"
        }`}
      >
        ${remainingBudget}
      </span>
      {activePlayer && (
        <span className="mt-1 animate-pulse text-sm text-white/60">
          Drag to a position slot...
        </span>
      )}
    </header>
  );
};
export default CreateLineupHeader;
