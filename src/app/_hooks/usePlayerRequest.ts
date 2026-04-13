import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";

type UsePlayerRequestOptions = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

export function usePlayerRequest(options?: UsePlayerRequestOptions) {
  const utils = api.useUtils();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suggestedValue, setSuggestedValue] = useState(3);
  const [note, setNote] = useState("");

  const [debouncedFirst, setDebouncedFirst] = useState("");
  const [debouncedLast, setDebouncedLast] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (firstName.trim().length >= 2 && lastName.trim().length >= 2) {
      timerRef.current = setTimeout(() => {
        setDebouncedFirst(firstName.trim());
        setDebouncedLast(lastName.trim());
      }, 2000);
    } else {
      setDebouncedFirst("");
      setDebouncedLast("");
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [firstName, lastName]);

  const { data: duplicates } = api.requestedPlayer.searchDuplicates.useQuery(
    { firstName: debouncedFirst, lastName: debouncedLast },
    { enabled: debouncedFirst.length >= 2 && debouncedLast.length >= 2 },
  );

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setSuggestedValue(3);
    setNote("");
  };

  const createRequest = api.requestedPlayer.create.useMutation({
    onSuccess: () => {
      resetForm();
      void utils.requestedPlayer.getAll.invalidate();
      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error.message || "Failed to submit player request");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      options?.onError?.("Please fill in both first and last name");
      return;
    }
    createRequest.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      suggestedValue,
      note: note.trim() || undefined,
    });
  };

  return {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    suggestedValue,
    setSuggestedValue,
    note,
    setNote,
    duplicates,
    createRequest,
    handleSubmit,
  };
}
