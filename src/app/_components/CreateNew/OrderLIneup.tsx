import { type PlayerType } from "~/lib/types";
import { DroppablePositionSlot } from "../DroppablePositionSlot";

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;

// Position-keyed state type
type PositionSlots = {
  PG: PlayerType | null;
  SG: PlayerType | null;
  SF: PlayerType | null;
  PF: PlayerType | null;
  C: PlayerType | null;
};

const OrderLIneup = ({
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
}) => {
  return (
    <div className="flex flex-col items-center ml-8">
      {/* Selected Players with Position Labels - Horizontal */}
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

      {/* Confirm Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="bg-gold hover:bg-gold-light rounded-md px-6 py-2 text-sm font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Confirm Lineup"}
        </button>
        <button
          onClick={clearSelection}
          disabled={filledSlots === 0}
          className="bg-gold hover:bg-gold-light rounded-md px-6 py-2 text-sm font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
};
export default OrderLIneup;
