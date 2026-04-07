"use client";

import type { LineupOutput } from "~/server/api/schemas/output";
import { Button, ButtonLink } from "../ui/Button";

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

  return (
    <div className="mt-4 flex flex-wrap justify-end gap-2">
      <ButtonLink href={`/lineups/${lineupId}/edit`} color="white">
        Reorder
      </ButtonLink>
      <ButtonLink href={`/lineups/${lineupId}/gamble`} color="green">
        Gamble
      </ButtonLink>
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
