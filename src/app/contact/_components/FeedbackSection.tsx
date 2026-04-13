"use client";

import { motion } from "framer-motion";
import { Button } from "~/app/_components/common/ui/Button";
import { sectionVariants } from "../_lib/motionVariants";
import { useFeedbackSection } from "../_hooks/useFeedbackSection";

export function FeedbackSection() {
  const {
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
  } = useFeedbackSection();

  return (
    <motion.section
      className="border-foreground/10 bg-foreground/5 rounded-xl border p-6 backdrop-blur-sm"
      variants={sectionVariants}
    >
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <div className="bg-gold/20 flex h-10 w-10 items-center justify-center rounded-lg">
            <svg
              className="text-gold h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <h2 className="text-foreground text-xl font-semibold">
            App Feedback
          </h2>
        </div>
        <p className="text-foreground/60 text-sm">
          Have suggestions, found a bug, or just want to share your thoughts?
          We&apos;d love to hear from you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="feedbackName"
              className="text-foreground/80 mb-2 block text-sm font-medium"
            >
              Name
            </label>
            <input
              type="text"
              id="feedbackName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
              className="border-foreground/20 bg-foreground/10 text-foreground placeholder-foreground/50 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="feedbackEmail"
              className="text-foreground/80 mb-2 block text-sm font-medium"
            >
              Email
            </label>
            <input
              type="email"
              id="feedbackEmail"
              value={sessionEmail ?? email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={!!sessionEmail}
              required
              placeholder="your@email.com"
              className={`border-foreground/20 bg-foreground/10 text-foreground placeholder-foreground/50 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none ${sessionEmail ? "cursor-not-allowed opacity-60" : ""}`}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="feedbackSubject"
            className="text-foreground/80 mb-2 block text-sm font-medium"
          >
            Subject
          </label>
          <input
            type="text"
            id="feedbackSubject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="What's this about?"
            className="border-foreground/20 bg-foreground/10 text-foreground placeholder-foreground/50 focus:border-gold focus:ring-gold w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="feedbackMessage"
            className="text-foreground/80 mb-2 block text-sm font-medium"
          >
            Message
          </label>
          <textarea
            id="feedbackMessage"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={5}
            maxLength={2000}
            placeholder="Tell us what's on your mind..."
            className="border-foreground/20 bg-foreground/10 text-foreground placeholder-foreground/50 focus:border-gold focus:ring-gold w-full resize-none rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none"
          />
          <p className="text-foreground/40 mt-1 text-right text-xs">
            {message.length}/2000
          </p>
        </div>

        <Button
          type="submit"
          color="gold"
          variant="solid"
          loading={createFeedback.isPending}
          loadingText="Sending..."
          className="w-full px-6 py-2.5 font-semibold"
        >
          Send Feedback
        </Button>
      </form>
    </motion.section>
  );
}
