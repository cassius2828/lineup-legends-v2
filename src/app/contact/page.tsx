"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api } from "~/trpc/react";

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-800 to-surface-950">
      <motion.div
        className="container mx-auto px-4 py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header */}
        <motion.div className="mb-12 text-center" variants={sectionVariants}>
          <h1 className="font-stencil text-4xl uppercase tracking-wide text-gradient-gold sm:text-5xl">
            Contact Us
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-foreground/60">
            Request new players, share your feedback, or get in touch with the
            developer.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-8">
            <PlayerRequestSection />
            <ConnectSection />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <FeedbackSection />
          </div>
        </div>
      </motion.div>
    </main>
  );
}

// ─── Player Request Section ──────────────────────────────────────────────────

function PlayerRequestSection() {
  const { data: session } = useSession();
  const utils = api.useUtils();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suggestedValue, setSuggestedValue] = useState(3);

  const createRequest = api.requestedPlayer.create.useMutation({
    onSuccess: () => {
      toast.success("Player request submitted successfully!");
      setFirstName("");
      setLastName("");
      setSuggestedValue(3);
      void utils.requestedPlayer.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit player request");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please fill in both first and last name");
      return;
    }
    createRequest.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      suggestedValue,
    });
  };

  return (
    <motion.section
      className="rounded-xl border border-foreground/10 bg-foreground/5 p-6 backdrop-blur-sm"
      variants={sectionVariants}
    >
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20">
            <svg
              className="h-5 w-5 text-gold"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Request a Player
          </h2>
        </div>
        <p className="text-sm text-foreground/60">
          Can&apos;t find the player you&apos;re looking for? Submit a request
          and we&apos;ll work on adding them to the database.
        </p>
      </div>

      {!session ? (
        <div className="rounded-lg border border-gold/20 bg-gold/5 p-4 text-center">
          <p className="mb-3 text-sm text-foreground/70">
            You need to be signed in to request a player.
          </p>
          <Link
            href="/sign-in"
            className="inline-block rounded-lg bg-gold px-6 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold-light"
          >
            Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="reqFirstName"
                className="mb-2 block text-sm font-medium text-foreground/80"
              >
                First Name
              </label>
              <input
                type="text"
                id="reqFirstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="e.g. LeBron"
                className="w-full rounded-lg border border-foreground/20 bg-foreground/10 px-4 py-2 text-foreground placeholder-foreground/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <div>
              <label
                htmlFor="reqLastName"
                className="mb-2 block text-sm font-medium text-foreground/80"
              >
                Last Name
              </label>
              <input
                type="text"
                id="reqLastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="e.g. James"
                className="w-full rounded-lg border border-foreground/20 bg-foreground/10 px-4 py-2 text-foreground placeholder-foreground/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground/80">
              Suggested Value ($1-$5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSuggestedValue(v)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                    suggestedValue === v
                      ? "bg-gold text-black"
                      : "bg-foreground/10 text-foreground hover:bg-foreground/20"
                  }`}
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={createRequest.isPending}
            className="w-full rounded-lg bg-gold px-6 py-2.5 font-semibold text-black transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createRequest.isPending ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      )}
    </motion.section>
  );
}

// ─── Feedback Section ────────────────────────────────────────────────────────

function FeedbackSection() {
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

  return (
    <motion.section
      className="rounded-xl border border-foreground/10 bg-foreground/5 p-6 backdrop-blur-sm"
      variants={sectionVariants}
    >
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20">
            <svg
              className="h-5 w-5 text-gold"
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
          <h2 className="text-xl font-semibold text-foreground">App Feedback</h2>
        </div>
        <p className="text-sm text-foreground/60">
          Have suggestions, found a bug, or just want to share your thoughts?
          We&apos;d love to hear from you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="feedbackName"
              className="mb-2 block text-sm font-medium text-foreground/80"
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
              className="w-full rounded-lg border border-foreground/20 bg-foreground/10 px-4 py-2 text-foreground placeholder-foreground/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <div>
            <label
              htmlFor="feedbackEmail"
              className="mb-2 block text-sm font-medium text-foreground/80"
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
              className={`w-full rounded-lg border border-foreground/20 bg-foreground/10 px-4 py-2 text-foreground placeholder-foreground/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold ${sessionEmail ? "cursor-not-allowed opacity-60" : ""}`}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="feedbackSubject"
            className="mb-2 block text-sm font-medium text-foreground/80"
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
            className="w-full rounded-lg border border-foreground/20 bg-foreground/10 px-4 py-2 text-foreground placeholder-foreground/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>

        <div>
          <label
            htmlFor="feedbackMessage"
            className="mb-2 block text-sm font-medium text-foreground/80"
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
            className="w-full resize-none rounded-lg border border-foreground/20 bg-foreground/10 px-4 py-2 text-foreground placeholder-foreground/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <p className="mt-1 text-right text-xs text-foreground/40">
            {message.length}/2000
          </p>
        </div>

        <button
          type="submit"
          disabled={createFeedback.isPending}
          className="w-full rounded-lg bg-gold px-6 py-2.5 font-semibold text-black transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createFeedback.isPending ? "Sending..." : "Send Feedback"}
        </button>
      </form>
    </motion.section>
  );
}

// ─── Connect Section ─────────────────────────────────────────────────────────

function ConnectSection() {
  const links = [
    {
      href: "https://github.com/cassius2828",
      label: "GitHub",
      description: "Check out my projects and open-source work",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ),
    },
    {
      href: "https://www.linkedin.com/in/cassius-reynolds/",
      label: "LinkedIn",
      description: "Connect with me professionally",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      href: "mailto:cassius.reynolds.dev@gmail.com",
      label: "Email",
      description: "cassius.reynolds.dev@gmail.com",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <motion.section
      className="rounded-xl border border-foreground/10 bg-foreground/5 p-6 backdrop-blur-sm"
      variants={sectionVariants}
    >
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20">
            <svg
              className="h-5 w-5 text-gold"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Connect</h2>
        </div>
        <p className="text-sm text-foreground/60">
          Find me around the web or reach out directly.
        </p>
      </div>

      <div className="space-y-3">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            target={link.href.startsWith("mailto:") ? undefined : "_blank"}
            rel={
              link.href.startsWith("mailto:")
                ? undefined
                : "noopener noreferrer"
            }
            className="group flex items-center gap-4 rounded-lg border border-foreground/10 p-4 transition-all hover:border-gold/30 hover:bg-foreground/5"
          >
            <div className="text-foreground/60 transition-colors group-hover:text-gold">
              {link.icon}
            </div>
            <div>
              <p className="font-medium text-foreground group-hover:text-gold">
                {link.label}
              </p>
              <p className="text-sm text-foreground/50">{link.description}</p>
            </div>
            <svg
              className="ml-auto h-5 w-5 text-foreground/30 transition-colors group-hover:text-gold"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        ))}

        {/* Getting Technical Link */}
        <Link
          href="/getting-technical"
          className="group flex items-center gap-4 rounded-lg border border-gold/20 bg-gold/5 p-4 transition-all hover:border-gold/40 hover:bg-gold/10"
        >
          <div className="text-gold">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gold">Getting Technical</p>
            <p className="text-sm text-foreground/50">
              Explore the engineering behind Lineup Legends
            </p>
          </div>
          <svg
            className="ml-auto h-5 w-5 text-gold/50 transition-colors group-hover:text-gold"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </motion.section>
  );
}
