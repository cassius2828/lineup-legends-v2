"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { GoldCircleSpinnerLoader } from "~/app/_components/common/loaders";
import { AdminBackLink } from "../../_components/AdminBackLink";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { PlayerForm, type PlayerFormData } from "../../_components/PlayerForm";

export default function EditPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.playerId as string;

  const { data: player, isLoading } = api.player.getById.useQuery(
    { id: playerId },
    { enabled: !!playerId },
  );

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const updatePlayer = api.player.update.useMutation({
    onSuccess: () => {
      setSuccessMessage("Player updated successfully!");
      setTimeout(() => {
        router.push("/admin/players");
      }, 1500);
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  const handleSubmit = (data: PlayerFormData) => {
    setSuccessMessage("");
    setErrorMessage("");
    updatePlayer.mutate({ id: playerId, ...data });
  };

  const initialValues = useMemo(
    () =>
      player
        ? {
            firstName: player.firstName,
            lastName: player.lastName,
            value: player.value,
            imgUrl: player.imgUrl,
          }
        : undefined,
    [player],
  );

  if (isLoading) {
    return <GoldCircleSpinnerLoader />;
  }

  if (!player) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-foreground text-xl">Player not found</p>
          <Link
            href="/admin/players"
            className="text-gold mt-4 inline-block hover:underline"
          >
            Back to Players
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <AdminBackLink href="/admin/players">Back to Players</AdminBackLink>
      <AdminPageHeader
        title="Edit Player"
        description="Update player information"
      />

      <PlayerForm
        mode="edit"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isPending={updatePlayer.isPending}
        successMessage={successMessage}
        errorMessage={errorMessage}
        backHref="/admin/players"
      />
    </div>
  );
}
