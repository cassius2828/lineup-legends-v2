import { toast } from "sonner";
import { usePlayerRequest } from "~/app/_hooks/usePlayerRequest";

export function usePlayerRequestSection() {
  return usePlayerRequest({
    onSuccess: () => toast.success("Player request submitted successfully!"),
    onError: (msg) => toast.error(msg),
  });
}
