"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { AdminBackLink } from "../_components/AdminBackLink";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import { PlayerForm, type PlayerFormData } from "../_components/PlayerForm";

export default function AddPlayerPage() {
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const createPlayer = api.player.create.useMutation({
    onSuccess: (player) => {
      setSuccessMessage(
        `Player "${player.firstName} ${player.lastName}" created successfully!`,
      );
      setTimeout(() => {
        router.push("/admin/players");
      }, 2000);
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  const handleSubmit = (data: PlayerFormData) => {
    setSuccessMessage("");
    setErrorMessage("");
    createPlayer.mutate(data);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <AdminBackLink href="/admin/players">Back to Players</AdminBackLink>
      <AdminPageHeader
        title="Add New Player"
        description="Add a new player to the database"
      />

      <PlayerForm
        mode="add"
        onSubmit={handleSubmit}
        isPending={createPlayer.isPending}
        successMessage={successMessage}
        errorMessage={errorMessage}
        backHref="/admin/players"
      />
    </div>
  );
}
