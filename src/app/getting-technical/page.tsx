"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Plus, Play, ChevronRight } from "lucide-react";
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
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <motion.div
          className="mb-12 text-center sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-stencil text-gradient-gold mb-3 text-3xl tracking-wide uppercase sm:text-5xl">
            Getting Technical
          </h1>
          <p className="text-foreground/60 mx-auto max-w-2xl text-sm sm:text-base">
            Deep dives into the features, architecture, and engineering
            decisions behind Lineup Legends. Select a topic to watch the
            breakdown and read the docs.
          </p>

          {isAdmin && (
            <motion.button
              onClick={() => setShowAddForm((p) => !p)}
              className="border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 mt-6 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors"
              whileTap={{ scale: 0.97 }}
            >
              <Plus className="h-4 w-4" />
              Add Standalone Video
            </motion.button>
          )}
        </motion.div>

        {/* Admin standalone video form */}
        {isAdmin && showAddForm && (
          <motion.form
            onSubmit={handleAdd}
            className="border-foreground/10 bg-foreground/5 mx-auto mb-12 max-w-lg rounded-xl border p-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="text-foreground/70 mb-2 block text-sm font-medium">
              YouTube URL
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                className="border-foreground/10 bg-foreground/5 text-foreground placeholder-foreground/30 focus:border-gold/40 flex-1 rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none"
              />
              <button
                type="submit"
                disabled={addVideo.isPending || !youtubeUrl.trim()}
                className="bg-gold hover:bg-gold-light rounded-lg px-5 py-2.5 text-sm font-semibold text-black transition-colors disabled:opacity-50"
              >
                {addVideo.isPending ? "Adding..." : "Add"}
              </button>
            </div>
            <p className="text-foreground/40 mt-2 text-xs">
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
                <h2 className="text-foreground text-lg font-bold tracking-wide sm:text-xl">
                  {cat.label}
                </h2>
                <span className="text-foreground/30 text-xs">
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
                      className="group border-foreground/10 bg-foreground/[0.03] hover:border-foreground/20 hover:bg-foreground/[0.06] relative flex h-full flex-col overflow-hidden rounded-xl border p-5 transition-colors"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: catIdx * 0.1 + i * 0.05,
                      }}
                    >
                      {/* Status badge */}
                      {topic.status === "coming-soon" && (
                        <span className="bg-foreground/10 text-foreground/40 absolute top-3 right-3 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase">
                          Coming Soon
                        </span>
                      )}
                      {topic.videoId && (
                        <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] font-medium text-red-400">
                          <Play className="h-2.5 w-2.5" fill="currentColor" />
                          Video
                        </span>
                      )}

                      {/* Icon */}
                      <span className="mb-3 text-2xl">{topic.icon}</span>

                      {/* Title */}
                      <h3 className="text-foreground group-hover:text-gold mb-1 text-sm font-bold transition-colors sm:text-base">
                        {topic.title}
                      </h3>

                      {/* Description */}
                      <p className="text-foreground/50 flex-1 text-xs leading-relaxed sm:text-sm">
                        {topic.description}
                      </p>

                      {/* Arrow hint */}
                      <div className="text-foreground/30 group-hover:text-gold/60 mt-3 flex items-center gap-1 text-xs transition-colors">
                        <span>View details</span>
                        <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {/* Category legend */}
        <div className="text-foreground/40 mt-16 flex flex-wrap items-center justify-center gap-6 text-xs">
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
