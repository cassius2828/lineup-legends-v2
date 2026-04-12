"use client";

import type { LineupOutput } from "~/server/api/schemas/output";
import { Button, ButtonLink } from "../ui/Button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "~/components/ui/tooltip";

interface LineupCardOwnerActionsProps {
  lineup: LineupOutput;
  onToggleFeatured?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function LineupCardOwnerActions({
  lineup,
  onToggleFeatured,
  onDelete,
}: LineupCardOwnerActionsProps) {
  const lineupId = lineup._id?.toString() ?? "";
  const alreadyGambled = (lineup.timesGambled ?? 0) >= 1;

  return (
    <div className="mt-4 flex flex-wrap justify-end gap-2">
      <ButtonLink href={`/lineups/${lineupId}/edit`} color="white">
        Reorder
      </ButtonLink>
      {alreadyGambled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-block cursor-not-allowed">
              <Button disabled color="green">
                Gambled
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent sideOffset={6}>
            You can only gamble once per lineup
          </TooltipContent>
        </Tooltip>
      ) : (
        <ButtonLink href={`/lineups/${lineupId}/gamble`} color="green">
          Gamble
        </ButtonLink>
      )}
      {onToggleFeatured && (
        <Button handleClick={() => onToggleFeatured(lineupId)} color="gold">
          {lineup.featured ? "Unfeature" : "Feature"}
        </Button>
      )}
      {onDelete && (
        <Button handleClick={() => onDelete(lineupId)} color="red">
          Delete
        </Button>
      )}
    </div>
  );
}
