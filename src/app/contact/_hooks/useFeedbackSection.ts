import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "~/trpc/react";

export function useFeedbackSection() {
  const { data: session } = useSession();
  const sessionEmail = session?.user?.email;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const createFeedback = api.feedback.create.useMutation({
    onSuccess: () => {
      toast.success("Thank you for your feedback!");
      setName("");
      if (!sessionEmail) setEmail("");
      setSubject("");
      setMessage("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit feedback");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createFeedback.mutate({
      name: name.trim(),
      ...(sessionEmail ? {} : { email: email.trim() }),
      subject: subject.trim(),
      message: message.trim(),
    });
  };

  return {
    sessionEmail,
    name,
    setName,
    email,
    setEmail,
    subject,
    setSubject,
    message,
    setMessage,
    createFeedback,
    handleSubmit,
  };
}
