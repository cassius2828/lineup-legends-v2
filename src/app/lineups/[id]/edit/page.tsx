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
import { getId, type PlayerType } from "~/lib/types";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { PlayerImage } from "~/app/_components/PlayerImage";

const POSITIONS = ["pg", "sg", "sf", "pf", "c"] as const;
const POSITION_LABELS = {
  pg: "Point Guard",
  sg: "Shooting Guard",
  sf: "Small Forward",
  pf: "Power Forward",
  c: "Center",
};

type Position = (typeof POSITIONS)[number];

interface SortablePositionCardProps {
  pos: Position;
  index: number;
  player: PlayerType;
  onSwap: (pos1: Position, pos2: Position) => void;
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
      className={`flex items-center gap-4 rounded-xl bg-surface-800/80 p-4 ${
        isDragging ? "opacity-90 shadow-2xl ring-2 ring-gold/50" : ""
      }`}
    >
      {/* Drag handle - the entire row except buttons */}
      <div
        {...attributes}
        {...listeners}
        className="flex flex-1 cursor-grab items-center gap-4 active:cursor-grabbing"
      >
        <span className="w-8 text-center text-lg font-bold text-foreground/40">
          {index + 1}
        </span>
        <div className="flex-1">
          <span className="text-xs font-bold text-foreground/50 uppercase">
            {POSITION_LABELS[pos]}
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
              <p className="font-semibold text-foreground">
                {player.firstName} {player.lastName}
              </p>
              <p className="text-sm text-foreground/50">${player.value}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Swap buttons - clicks take precedence over drag */}
      <div className="flex gap-1">
        {index > 0 && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onSwap(pos, POSITIONS[index - 1]!)}
            className="rounded-lg bg-foreground/10 p-2 text-foreground/60 transition-colors hover:bg-foreground/20 hover:text-foreground"
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
        {index < POSITIONS.length - 1 && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onSwap(pos, POSITIONS[index + 1]!)}
            className="rounded-lg bg-foreground/10 p-2 text-foreground/60 transition-colors hover:bg-foreground/20 hover:text-foreground"
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
  const [positionsArray, setPositionsArray] = useState<PlayerType[]>([]);

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
      // improve type later
    ] as unknown as PlayerType[];
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

  const handleButtonSwap = (activeId: Position, overId: Position) => {
    const from = POSITIONS.indexOf(activeId);
    const to = POSITIONS.indexOf(overId);
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

    const from = POSITIONS.indexOf(active.id as Position);
    const to = POSITIONS.indexOf(over.id as Position);
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

    const toPlayer = (p: PlayerType) => ({
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
      <main className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-800 to-surface-950">
        <div className="flex h-64 items-center justify-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-foreground/20 border-t-gold" />
        </div>
      </main>
    );
  }

  if (!lineup) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-800 to-surface-950">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Lineup not found</h1>
          <Link
            href="/lineups"
            className="mt-4 text-gold-300 hover:underline"
          >
            Back to My Lineups
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-800 to-surface-950">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/lineups"
            className="mb-2 inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground/80"
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
          <h1 className="text-3xl font-bold text-foreground">Reorder Lineup</h1>
          <p className="mt-1 text-foreground/60">
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
            items={POSITIONS.map((pos) => ({ id: pos }))}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {positionsArray?.map((player, index) => {
                if (!player || !POSITIONS[index]) return null;

                return (
                  <SortablePositionCard
                    key={POSITIONS[index]}
                    pos={POSITIONS[index]}
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
            className="flex-1 rounded-lg bg-foreground/10 py-3 text-center font-medium text-foreground transition-colors hover:bg-foreground/20"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={reorderMutation.isPending}
            className="flex-1 rounded-lg bg-gold py-3 font-semibold text-black transition-colors hover:bg-gold-light disabled:opacity-50"
          >
            {reorderMutation.isPending ? "Saving..." : "Save Order"}
          </button>
        </div>
      </div>
    </main>
  );
}
