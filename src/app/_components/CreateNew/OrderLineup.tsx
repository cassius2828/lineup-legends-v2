import type { PlayerOutput } from "~/server/api/schemas/output";
import { POSITIONS, type PositionSlots } from "~/lib/constants";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "~/components/ui/tooltip";
import { Button } from "../ui/Button";
import { DroppablePositionSlot } from "../DroppablePositionSlot";

export default function OrderLineup({
  positionSlots,
  handleRemovePlayer,
  activePlayer,
  handleSubmit,
  canSubmit,
  isSubmitting,
  clearSelection,
  filledSlots,
  isAuthenticated = true,
}: {
  positionSlots: PositionSlots;
  handleRemovePlayer: (player: PlayerOutput) => void;
  activePlayer: PlayerOutput | null;
  handleSubmit: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  clearSelection: () => void;
  filledSlots: number;
  isAuthenticated?: boolean;
}) {
  const isDisabled = !canSubmit || isSubmitting || !isAuthenticated;

  const confirmButton = (
    <Button
      handleClick={handleSubmit}
      disabled={isDisabled}
      color="gold"
      variant="solid"
    >
      {isSubmitting ? "Creating..." : "Confirm Lineup"}
    </Button>
  );

  return (
    <div className="bg-surface-950/95 sticky bottom-0 z-40 ml-0 flex flex-col items-center rounded-md p-2 py-3 backdrop-blur-sm lg:static lg:ml-8 lg:bg-transparent lg:py-0 lg:backdrop-blur-none">
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
        {!isAuthenticated ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="inline-block">
                {confirmButton}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              You must be signed in to an account to save a lineup
            </TooltipContent>
          </Tooltip>
        ) : (
          confirmButton
        )}
        <Button
          handleClick={clearSelection}
          disabled={filledSlots === 0}
          color="gold"
          variant="solid"
        >
          Clear Selection
        </Button>
      </div>
    </div>
  );
}
