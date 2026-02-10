"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
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
import { api } from "~/trpc/react";
import { type PlayerType } from "~/lib/types";

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
      className={`flex items-center gap-4 rounded-xl bg-slate-800/80 p-4 ${
        isDragging ? "opacity-90 shadow-2xl ring-2 ring-emerald-500/50" : ""
      }`}
    >
      {/* Drag handle - the entire row except buttons */}
      <div
        {...attributes}
        {...listeners}
        className="flex flex-1 cursor-grab items-center gap-4 active:cursor-grabbing"
      >
        <span className="w-8 text-center text-lg font-bold text-white/40">
          {index + 1}
        </span>
        <div className="flex-1">
          <span className="text-xs font-bold text-white/50 uppercase">
            {POSITION_LABELS[pos]}
          </span>
          <div className="mt-1 flex items-center gap-3">
            <img
              src={player.imgUrl}
              alt={`${player.firstName} ${player.lastName}`}
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-white">
                {player.firstName} {player.lastName}
              </p>
              <p className="text-sm text-white/50">${player.value}</p>
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
            className="rounded-lg bg-white/10 p-2 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
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
            className="rounded-lg bg-white/10 p-2 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
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
  const lineupId = params.id as string;

  const { data: lineup, isLoading } = api.lineup.getLineupById.useQuery({
    id: lineupId,
  });

  // Track the current order of positions (for drag reordering)
  const [positionsArray, setPositionsArray] = useState([
    lineup?.players.pg,
    lineup?.players.sg,
    lineup?.players.sf,
    lineup?.players.pf,
    lineup?.players.c,
  ]);
  console.log(positionsArray, ' <-- positionsArray')
  const [positions, setPositions] = useState<
    Record<(typeof POSITIONS)[number], PlayerType | null>
  >({
    pg: lineup?.players.pg,
    sg: lineup?.players.sg,
    sf: lineup?.players.sf,
    pf: lineup?.players.pf,
    c: lineup?.players.c,
  });

  console.log(positions, " <-- positions");
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
    if (lineup) {
      setPositions({
        pg: lineup.players.pg,
        sg: lineup.players.sg,
        sf: lineup.players.sf,
        pf: lineup.players.pf,
        c: lineup.players.c,
      });
      setPositionsArray([
       {...lineup.players.pg},
        {...lineup.players.sg},
        {...lineup.players.sf},
        {...lineup.players.pf},
        {...lineup.players.c},
      ]);
    }
    console.log(positionsArray, ' <-- positionsArray')

  }, [lineup]);

  const reorderMutation = api.lineup.reorder.useMutation({
    onSuccess: () => {
      router.push("/lineups");
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleButtonSwap = (activeId: Position, overId: Position) => {
    // Swap in positions record
    setPositions((prev) => ({
      ...prev,
      [activeId]: prev[overId],
      [overId]: prev[activeId],
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // console.log(handleButtonSwap(active.id as Position, over.id as Position));
      // setPositionsArray((prev) => {
        // active id is position
        // find the over index

      // });
      console.log(active, " <-- active");
      console.log(over, " <-- over");
    }
  };

  const handleSubmit = () => {
    if (
      !positions.pg ||
      !positions.sg ||
      !positions.sf ||
      !positions.pf ||
      !positions.c
    ) {
      return;
    }

    reorderMutation.mutate({
      lineupId,
      players: {
        pg: positions.pg,
        sg: positions.sg,
        sf: positions.sf,
        pf: positions.pf,
        c: positions.c,
      },
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="flex h-64 items-center justify-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-emerald-500" />
        </div>
      </main>
    );
  }

  if (!lineup) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-white">Lineup not found</h1>
          <Link
            href="/lineups"
            className="mt-4 text-emerald-400 hover:underline"
          >
            Back to My Lineups
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/lineups"
            className="mb-2 inline-flex items-center gap-1 text-sm text-white/60 hover:text-white/80"
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
          <h1 className="text-3xl font-bold text-white">Reorder Lineup</h1>
          <p className="mt-1 text-white/60">
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
            items={POSITIONS}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {positionsArray?.map((player, index) => {
              
                if (!player) return null;

                return (
                  <SortablePositionCard
                    key={POSITIONS[index]}
                    pos={POSITIONS[index]}
                    index={index}
                    player={positions[POSITIONS[index]]}
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
            className="flex-1 rounded-lg bg-white/10 py-3 text-center font-medium text-white transition-colors hover:bg-white/20"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={reorderMutation.isPending}
            className="flex-1 rounded-lg bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {reorderMutation.isPending ? "Saving..." : "Save Order"}
          </button>
        </div>
      </div>
    </main>
  );
}
