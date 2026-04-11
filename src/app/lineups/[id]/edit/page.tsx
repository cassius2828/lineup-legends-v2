"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getId } from "~/lib/types";
import type { PlayerOutput } from "~/server/api/schemas/output";
import {
  POSITIONS_LOWER,
  POSITION_FULL_LABELS,
  type PositionLower,
} from "~/lib/constants";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { Button } from "~/app/_components/ui/Button";
import { PlayerImage } from "~/app/_components/PlayerImage";

interface SortablePositionCardProps {
  pos: PositionLower;
  index: number;
  player: PlayerOutput;
  onSwap: (pos1: PositionLower, pos2: PositionLower) => void;
}

function SortablePositionCard({
  pos,
  index,
  player,
  onSwap,
}: SortablePositionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pos, animateLayoutChanges: () => false });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-surface-800/80 flex items-center gap-4 rounded-xl p-4 ${
        isDragging ? "ring-gold/50 opacity-90 shadow-2xl ring-2" : ""
      }`}
    >
      {/* Drag handle - the entire row except buttons */}
      <div
        {...attributes}
        {...listeners}
        className="flex flex-1 cursor-grab items-center gap-4 active:cursor-grabbing"
      >
        <span className="text-foreground/40 w-8 text-center text-lg font-bold">
          {index + 1}
        </span>
        <div className="flex-1">
          <span className="text-foreground/50 text-xs font-bold uppercase">
            {POSITION_FULL_LABELS[pos]}
          </span>
          <div className="mt-1 flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-full">
              <PlayerImage
                imgUrl={player.imgUrl}
                alt={`${player.firstName} ${player.lastName}`}
                className="absolute inset-0 h-full w-full rounded-full object-cover"
              />
            </div>
            <div>
              <p className="text-foreground font-semibold">
                {player.firstName} {player.lastName}
              </p>
              <p className="text-foreground/50 text-sm">${player.value}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Swap buttons - clicks take precedence over drag */}
      <div className="flex gap-1">
        {index > 0 && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onSwap(pos, POSITIONS_LOWER[index - 1]!)}
            className="bg-foreground/10 text-foreground/60 hover:bg-foreground/20 hover:text-foreground rounded-lg p-2 transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
        )}
        {index < POSITIONS_LOWER.length - 1 && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onSwap(pos, POSITIONS_LOWER[index + 1]!)}
            className="bg-foreground/10 text-foreground/60 hover:bg-foreground/20 hover:text-foreground rounded-lg p-2 transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function EditLineupPage() {
  const params = useParams();
  const router = useRouter();
  const utils = api.useUtils();
  const lineupId = params.id as string;

  const { data: lineup, isLoading } = api.lineup.getLineupById.useQuery(
    {
      id: lineupId,
    },
    { enabled: !!lineupId },
  );

  // Players are stored in a fixed slot order: [pg, sg, sf, pf, c]
  const [positionsArray, setPositionsArray] = useState<PlayerOutput[]>([]);

  // Configure sensors with activation constraints to allow button clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (!lineup) return;
    // getLineupById populates players at runtime; API type is unpopulated ObjectId
    const players = [
      lineup.players.pg,
      lineup.players.sg,
      lineup.players.sf,
      lineup.players.pf,
      lineup.players.c,
    ];
    setPositionsArray(players);
  }, [lineup]);

  const reorderMutation = api.lineup.reorder.useMutation({
    onSuccess: () => {
      void utils.lineup.getLineupById.invalidate({ id: lineupId });
      void utils.lineup.getLineupsByCurrentUser.invalidate();
      router.push("/lineups");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleButtonSwap = (activeId: PositionLower, overId: PositionLower) => {
    const from = POSITIONS_LOWER.indexOf(activeId);
    const to = POSITIONS_LOWER.indexOf(overId);
    if (from < 0 || to < 0 || from === to) return;

    setPositionsArray((prev) => {
      const next = [...prev];
      const tmp = next[from];
      const over = next[to];
      if (tmp === undefined || over === undefined) return prev;
      next[from] = over;
      next[to] = tmp;
      return next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = POSITIONS_LOWER.indexOf(active.id as PositionLower);
    const to = POSITIONS_LOWER.indexOf(over.id as PositionLower);
    if (from < 0 || to < 0) return;

    setPositionsArray((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      if (moved === undefined) return prev;
      next.splice(to, 0, moved);
      return next;
    });
  };

  const handleSubmit = () => {
    if (positionsArray.length !== 5 || positionsArray.some((p) => !p)) return;

    const toPlayer = (p: PlayerOutput) => ({
      _id: getId(p) ?? "",
      firstName: p.firstName,
      lastName: p.lastName,
      imgUrl: p.imgUrl,
      value: p.value,
    });

    reorderMutation.mutate({
      lineupId,
      players: {
        pg: toPlayer(positionsArray[0]!),
        sg: toPlayer(positionsArray[1]!),
        sf: toPlayer(positionsArray[2]!),
        pf: toPlayer(positionsArray[3]!),
        c: toPlayer(positionsArray[4]!),
      },
    });
  };

  if (isLoading) {
    return (
      <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
        <div className="flex h-64 items-center justify-center">
          <div className="border-foreground/20 border-t-gold mx-auto h-12 w-12 animate-spin rounded-full border-4" />
        </div>
      </main>
    );
  }

  if (!lineup) {
    return (
      <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-foreground text-2xl font-bold">
            Lineup not found
          </h1>
          <Link href="/lineups" className="text-gold-300 mt-4 hover:underline">
            Back to My Lineups
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/lineups"
            className="text-foreground/60 hover:text-foreground/80 mb-2 inline-flex items-center gap-1 text-sm"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to My Lineups
          </Link>
          <h1 className="text-foreground text-3xl font-bold">Reorder Lineup</h1>
          <p className="text-foreground/60 mt-1">
            Drag to reorder or use arrows to swap players
          </p>
        </div>

        {/* Position Cards with Drag and Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={POSITIONS_LOWER.map((pos) => ({ id: pos }))}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {positionsArray?.map((player, index) => {
                if (!player || !POSITIONS_LOWER[index]) return null;

                return (
                  <SortablePositionCard
                    key={POSITIONS_LOWER[index]}
                    pos={POSITIONS_LOWER[index]}
                    index={index}
                    player={player}
                    onSwap={handleButtonSwap}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {/* Submit */}
        <div className="mt-8 flex gap-3">
          <Link
            href="/lineups"
            className="bg-foreground/10 text-foreground hover:bg-foreground/20 flex-1 rounded-lg py-3 text-center font-medium transition-colors"
          >
            Cancel
          </Link>
          <Button
            onClick={handleSubmit}
            color="gold"
            variant="solid"
            loading={reorderMutation.isPending}
            loadingText="Saving..."
            className="flex-1 py-3 font-semibold"
          >
            Save Order
          </Button>
        </div>
      </div>
    </main>
  );
}
