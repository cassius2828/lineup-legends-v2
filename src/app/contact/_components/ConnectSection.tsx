"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Link2, Mail, Settings } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "~/app/_components/common/icons";
import { sectionVariants } from "../_lib/motionVariants";

const LINKS = [
  {
    href: "https://github.com/cassius2828",
    label: "GitHub",
    description: "Check out my projects and open-source work",
    icon: <GitHubIcon className="h-6 w-6" />,
  },
  {
    href: "https://www.linkedin.com/in/cassius-reynolds/",
    label: "LinkedIn",
    description: "Connect with me professionally",
    icon: <LinkedInIcon className="h-6 w-6" />,
  },
  {
    href: "mailto:cassius.reynolds.dev@gmail.com",
    label: "Email",
    description: "cassius.reynolds.dev@gmail.com",
    icon: <Mail className="h-6 w-6" />,
  },
] as const;

export function ConnectSection() {
  return (
    <motion.section
      className="border-foreground/10 bg-foreground/5 rounded-xl border p-6 backdrop-blur-sm"
      variants={sectionVariants}
    >
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <div className="bg-gold/20 flex h-10 w-10 items-center justify-center rounded-lg">
            <Link2 className="text-gold h-5 w-5" />
          </div>
          <h2 className="text-foreground text-xl font-semibold">Connect</h2>
        </div>
        <p className="text-foreground/60 text-sm">
          Find me around the web or reach out directly.
        </p>
      </div>

      <div className="space-y-3">
        {LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            target={link.href.startsWith("mailto:") ? undefined : "_blank"}
            rel={
              link.href.startsWith("mailto:")
                ? undefined
                : "noopener noreferrer"
            }
            className="group border-foreground/10 hover:border-gold/30 hover:bg-foreground/5 flex items-center gap-4 rounded-lg border p-4 transition-all"
          >
            <div className="text-foreground/60 group-hover:text-gold transition-colors">
              {link.icon}
            </div>
            <div>
              <p className="text-foreground group-hover:text-gold font-medium">
                {link.label}
              </p>
              <p className="text-foreground/50 text-sm">{link.description}</p>
            </div>
            <ChevronRight className="text-foreground/30 group-hover:text-gold ml-auto h-5 w-5 transition-colors" />
          </Link>
        ))}

        <Link
          href="/getting-technical"
          className="group border-gold/20 bg-gold/5 hover:border-gold/40 hover:bg-gold/10 flex items-center gap-4 rounded-lg border p-4 transition-all"
        >
          <div className="text-gold">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <p className="text-gold font-medium">Getting Technical</p>
            <p className="text-foreground/50 text-sm">
              Explore the engineering behind Lineup Legends
            </p>
          </div>
          <ChevronRight className="text-gold/50 group-hover:text-gold ml-auto h-5 w-5 transition-colors" />
        </Link>
      </div>
    </motion.section>
  );
}
