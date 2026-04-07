"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { getTopicsByCategory, CATEGORIES } from "./_data/topics";

export default function GettingTechnicalPage() {
  const { data: session } = useSession();
  const isAdmin = !!session?.user?.admin;
  const utils = api.useUtils();

  const [showAddForm, setShowAddForm] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const addVideo = api.video.create.useMutation({
    onSuccess: (data) => {
      toast.success(`"${data.title}" added`);
      setYoutubeUrl("");
      setShowAddForm(false);
      void utils.video.getAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;
    addVideo.mutate({ url: youtubeUrl.trim() });
  };

  const categorized = getTopicsByCategory();

  return (
    <main className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-800 to-surface-950">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <motion.div
          className="mb-12 text-center sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-stencil mb-3 text-3xl uppercase tracking-wide text-gradient-gold sm:text-5xl">
            Getting Technical
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-foreground/60 sm:text-base">
            Deep dives into the features, architecture, and engineering
            decisions behind Lineup Legends. Select a topic to watch the
            breakdown and read the docs.
          </p>

          {isAdmin && (
            <motion.button
              onClick={() => setShowAddForm((p) => !p)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-5 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-gold/20"
              whileTap={{ scale: 0.97 }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Standalone Video
            </motion.button>
          )}
        </motion.div>

        {/* Admin standalone video form */}
        {isAdmin && showAddForm && (
          <motion.form
            onSubmit={handleAdd}
            className="mx-auto mb-12 max-w-lg rounded-xl border border-foreground/10 bg-foreground/5 p-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="mb-2 block text-sm font-medium text-foreground/70">
              YouTube URL
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                className="flex-1 rounded-lg border border-foreground/10 bg-foreground/5 px-3 py-2.5 text-sm text-foreground placeholder-foreground/30 outline-none transition-colors focus:border-gold/40"
              />
              <button
                type="submit"
                disabled={addVideo.isPending || !youtubeUrl.trim()}
                className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold-light disabled:opacity-50"
              >
                {addVideo.isPending ? "Adding..." : "Add"}
              </button>
            </div>
            <p className="mt-2 text-xs text-foreground/40">
              Adds a standalone video (not tied to a topic). For topic videos,
              edit the topics config directly.
            </p>
          </motion.form>
        )}

        {/* Topic Grid by Category */}
        <div className="space-y-12 sm:space-y-16">
          {categorized.map((cat, catIdx) => (
            <motion.section
              key={cat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: catIdx * 0.1 }}
            >
              {/* Category header */}
              <div className="mb-6 flex items-center gap-3">
                <div
                  className="h-1 w-8 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <h2 className="text-lg font-bold tracking-wide text-foreground sm:text-xl">
                  {cat.label}
                </h2>
                <span className="text-xs text-foreground/30">
                  {cat.topics.length} topic{cat.topics.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Topic cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cat.topics.map((topic, i) => (
                  <Link
                    key={topic.slug}
                    href={`/getting-technical/${topic.slug}`}
                  >
                    <motion.div
                      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.03] p-5 transition-colors hover:border-foreground/20 hover:bg-foreground/[0.06]"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: catIdx * 0.1 + i * 0.05 }}
                    >
                      {/* Status badge */}
                      {topic.status === "coming-soon" && (
                        <span className="absolute top-3 right-3 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground/40">
                          Coming Soon
                        </span>
                      )}
                      {topic.videoId && (
                        <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] font-medium text-red-400">
                          <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          Video
                        </span>
                      )}

                      {/* Icon */}
                      <span className="mb-3 text-2xl">{topic.icon}</span>

                      {/* Title */}
                      <h3 className="mb-1 text-sm font-bold text-foreground transition-colors group-hover:text-gold sm:text-base">
                        {topic.title}
                      </h3>

                      {/* Description */}
                      <p className="flex-1 text-xs leading-relaxed text-foreground/50 sm:text-sm">
                        {topic.description}
                      </p>

                      {/* Arrow hint */}
                      <div className="mt-3 flex items-center gap-1 text-xs text-foreground/30 transition-colors group-hover:text-gold/60">
                        <span>View details</span>
                        <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {/* Category legend */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-xs text-foreground/40">
          {CATEGORIES.map((cat) => (
            <div key={cat.key} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span>{cat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
