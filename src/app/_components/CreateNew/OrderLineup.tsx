import { type PlayerType } from "~/lib/types";
import { DroppablePositionSlot } from "../DroppablePositionSlot";

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;

type PositionSlots = {
  PG: PlayerType | null;
  SG: PlayerType | null;
  SF: PlayerType | null;
  PF: PlayerType | null;
  C: PlayerType | null;
};

export default function OrderLineup({
  positionSlots,
  handleRemovePlayer,
  activePlayer,
  handleSubmit,
  canSubmit,
  isSubmitting,
  clearSelection,
  filledSlots,
}: {
  positionSlots: PositionSlots;
  handleRemovePlayer: (player: PlayerType) => void;
  activePlayer: PlayerType | null;
  handleSubmit: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  clearSelection: () => void;
  filledSlots: number;
}) {
  return (
    <div className="ml-8 flex flex-col items-center">
      <div className="mb-4 flex justify-center gap-2">
        {POSITIONS.map((position) => (
          <DroppablePositionSlot
            key={position}
            position={position}
            player={positionSlots[position]}
            onRemove={handleRemovePlayer}
            isAnyDragging={activePlayer !== null}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="rounded-md bg-gold px-6 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Confirm Lineup"}
        </button>
        <button
          type="button"
          onClick={clearSelection}
          disabled={filledSlots === 0}
          className="rounded-md bg-gold px-6 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
}
