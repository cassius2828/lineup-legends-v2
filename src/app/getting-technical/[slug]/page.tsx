"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Play,
  VideoOff,
  FileText,
  LayoutGrid,
} from "lucide-react";
import { getTopicBySlug, CATEGORIES } from "../_data/topics";
import { MarkdownContent } from "../_components/MarkdownContent";

export default function TopicDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const topic = getTopicBySlug(slug);
  const [playing, setPlaying] = useState(false);

  if (!topic) {
    return (
      <main className="from-surface-950 via-surface-800 to-surface-950 flex min-h-screen items-center justify-center bg-gradient-to-b">
        <div className="text-center">
          <h1 className="text-foreground mb-4 text-2xl font-bold">
            Topic Not Found
          </h1>
          <Link href="/getting-technical" className="text-gold hover:underline">
            ← Back to all topics
          </Link>
        </div>
      </main>
    );
  }

  const category = CATEGORIES.find((c) => c.key === topic.category);

  return (
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto px-4 py-10 sm:py-14">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href="/getting-technical"
            className="text-foreground/50 hover:text-foreground/80 mb-6 inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            All Topics
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-3 flex items-center gap-3">
            <span className="text-3xl">{topic.icon}</span>
            {category && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: category.color + "15",
                  color: category.color,
                }}
              >
                {category.label}
              </span>
            )}
            {topic.status === "coming-soon" && (
              <span className="bg-foreground/10 text-foreground/40 rounded-full px-2.5 py-0.5 text-xs font-medium">
                Coming Soon
              </span>
            )}
          </div>
          <h1 className="text-foreground mb-2 text-2xl font-bold sm:text-4xl">
            {topic.title}
          </h1>
          <p className="text-foreground/60 max-w-2xl text-sm sm:text-base">
            {topic.description}
          </p>
        </motion.div>

        {/* Video Section */}
        <motion.section
          className="mb-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {topic.videoId ? (
            <div className="border-foreground/10 overflow-hidden rounded-xl border">
              <div className="relative aspect-video w-full bg-black">
                {playing ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${topic.videoId}?autoplay=1&rel=0`}
                    title={topic.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                ) : (
                  <button
                    onClick={() => setPlaying(true)}
                    className="group absolute inset-0 flex items-center justify-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.ytimg.com/vi/${topic.videoId}/maxresdefault.jpg`}
                      alt={topic.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/20" />
                    <div className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg transition-transform group-hover:scale-110 sm:h-20 sm:w-20">
                      <Play
                        className="ml-1 h-7 w-7 text-white sm:h-8 sm:w-8"
                        fill="currentColor"
                      />
                    </div>
                  </button>
                )}
              </div>
              {/* YouTube link */}
              <div className="border-foreground/10 bg-foreground/[0.02] flex items-center justify-end border-t px-4 py-2">
                <a
                  href={`https://www.youtube.com/watch?v=${topic.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/40 text-xs transition-colors hover:text-red-400"
                >
                  Watch on YouTube ↗
                </a>
              </div>
            </div>
          ) : (
            <div className="border-foreground/10 bg-foreground/[0.02] flex aspect-video items-center justify-center rounded-xl border border-dashed">
              <div className="text-center">
                <div className="bg-foreground/5 mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full">
                  <VideoOff className="text-foreground/20 h-7 w-7" />
                </div>
                <p className="text-foreground/30 text-sm font-medium">
                  Video coming soon
                </p>
                <p className="text-foreground/20 mt-1 text-xs">
                  Add a YouTube video ID to the topics config
                </p>
              </div>
            </div>
          )}
        </motion.section>

        {/* Documentation Content */}
        <motion.section
          className="mx-auto max-w-3xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="mb-6 flex items-center gap-3">
            <FileText className="text-foreground/30 h-5 w-5" />
            <h2 className="text-foreground text-lg font-bold">Documentation</h2>
          </div>

          <div className="border-foreground/10 bg-foreground/[0.02] rounded-xl border p-6 sm:p-8">
            <MarkdownContent content={topic.content} />
          </div>
        </motion.section>

        {/* Navigation between topics */}
        <div className="mx-auto mt-12 flex max-w-3xl justify-center">
          <Link
            href="/getting-technical"
            className="border-foreground/10 text-foreground/50 hover:border-gold/30 hover:text-gold inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm transition-colors"
          >
            <LayoutGrid className="h-4 w-4" />
            Browse All Topics
          </Link>
        </div>
      </div>
    </main>
  );
}
