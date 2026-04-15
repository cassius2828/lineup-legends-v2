"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Coffee } from "lucide-react";
import { LinkedInIcon, GitHubIcon } from "~/app/_components/common/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/app/_components/common/ui/tooltip";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const socialVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.3,
    },
  },
};

const socialItemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function Footer() {
  return (
    <footer className="bg-surface-950 relative overflow-hidden px-4 py-16 sm:px-8 lg:px-16">
      {/* Subtle gold gradient at top */}
      <div className="via-gold/30 absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent to-transparent" />

      <motion.div
        className="mx-auto max-w-7xl"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        <div className="flex flex-col items-center justify-between gap-12 lg:flex-row lg:items-start">
          {/* Left - CTA Text */}
          <motion.div
            className="max-w-sm text-center lg:text-left"
            variants={itemVariants}
          >
            <p className="font-stencil text-gold text-lg leading-relaxed tracking-wide uppercase">
              Join Lineup Legends – create, share, and dominate with your
              ultimate fantasy basketball lineups. Your journey as a top fantasy
              GM starts here!
            </p>
          </motion.div>

          {/* Center - Contact Info */}
          <motion.div
            className="text-foreground/70 text-center"
            variants={itemVariants}
          >
            <p>Located in Northern California</p>
            <p className="mt-2">Cell: (707) 724-1815</p>
            <p className="mt-2">
              Email:{" "}
              <a
                href="mailto:cassius.reynolds.dev@gmail.com"
                className="text-gold hover:text-gold-light transition-colors"
              >
                cassius.reynolds.dev@gmail.com
              </a>
            </p>
            <Link
              href="/contact"
              className="text-gold/80 hover:text-gold-light mt-3 inline-block text-sm transition-colors"
            >
              Contact Us &rarr;
            </Link>
          </motion.div>

          {/* Right - Developer Credit */}
          <motion.div
            className="text-center lg:text-right"
            variants={itemVariants}
          >
            <p className="text-foreground/50">Developed by</p>
            <p className="font-stencil text-gradient-gold mt-1 text-xl tracking-wide uppercase">
              Cassius Reynolds
            </p>
          </motion.div>
        </div>

        {/* Social Icons */}
        <motion.div
          className="mt-12 flex items-center justify-center gap-6"
          variants={socialVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <SocialLink
            href="https://www.linkedin.com/in/cassius-reynolds/"
            label="LinkedIn"
          >
            <LinkedInIcon className="h-6 w-6" />
          </SocialLink>
          <SocialLink href="https://github.com/cassius2828" label="GitHub">
            <GitHubIcon className="h-6 w-6" />
          </SocialLink>
          <motion.div variants={socialItemVariants}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="https://buy.stripe.com/fZu5kwaPN5ML48L1Hw2Ry01"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Buy me a coffee"
                  className="group text-foreground/60 hover:text-gold relative block transition-all duration-300"
                >
                  <span className="bg-gold/0 group-hover:bg-gold/10 absolute -inset-2 rounded-full transition-all duration-300" />
                  <span className="relative block transition-transform duration-300 group-hover:scale-110">
                    <Coffee className="h-6 w-6" strokeWidth={2} aria-hidden />
                  </span>
                </Link>
              </TooltipTrigger>
              <TooltipContent
                sideOffset={6}
                className="max-w-[min(18rem,calc(100vw-2rem))] px-3 py-2 text-left"
              >
                <p className="text-background leading-snug font-semibold">
                  Buy me a coffee
                </p>
                <p className="text-background/90 mt-1.5 text-xs leading-relaxed">
                  If you chip in, thank you from the bottom of my heart—it
                  genuinely means the world and helps keep Lineup Legends alive.
                </p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        </motion.div>

        {/* Legal Links */}
        <motion.div
          className="border-foreground/10 mt-12 flex justify-center gap-6 border-t pt-8 pb-4"
          variants={itemVariants}
        >
          <Link
            href="/terms"
            className="text-foreground/50 hover:text-gold text-sm transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="text-foreground/50 hover:text-gold text-sm transition-colors"
          >
            Privacy Policy
          </Link>
        </motion.div>

        {/* Copyright */}
        <motion.div
          className="text-foreground/40 text-center text-sm"
          variants={itemVariants}
        >
          © {new Date().getFullYear()} Lineup Legends. All rights reserved.
        </motion.div>
      </motion.div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div variants={socialItemVariants}>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="group text-foreground/60 hover:text-gold relative block transition-all duration-300"
      >
        <span className="bg-gold/0 group-hover:bg-gold/10 absolute -inset-2 rounded-full transition-all duration-300" />
        <span className="relative block transition-transform duration-300 group-hover:scale-110">
          {children}
        </span>
      </Link>
    </motion.div>
  );
}
