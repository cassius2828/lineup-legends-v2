"use client";

import Link from "next/link";
import { motion } from "framer-motion";

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
    <footer className="relative overflow-hidden bg-surface-950 px-4 py-16 sm:px-8 lg:px-16">
      {/* Subtle gold gradient at top */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      
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
            <p className="font-stencil text-lg uppercase leading-relaxed tracking-wide text-gold">
              Join Lineup Legends – create, share, and dominate with your
              ultimate fantasy basketball lineups. Your journey as a top
              fantasy GM starts here!
            </p>
          </motion.div>

          {/* Center - Contact Info */}
          <motion.div 
            className="text-center text-foreground/70"
            variants={itemVariants}
          >
            <p>Located in Northern California</p>
            <p className="mt-2">Cell: (707) 724-1815</p>
            <p className="mt-2">
              Email:{" "}
              <a
                href="mailto:cassius.reynolds.dev@gmail.com"
                className="text-gold transition-colors hover:text-gold-light"
              >
                cassius.reynolds.dev@gmail.com
              </a>
            </p>
            <Link
              href="/contact"
              className="mt-3 inline-block text-sm text-gold/80 transition-colors hover:text-gold-light"
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
            <p className="font-stencil mt-1 text-xl uppercase tracking-wide text-gradient-gold">
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
          <SocialLink href="https://instagram.com" label="Instagram">
            <InstagramIcon />
          </SocialLink>
          <SocialLink href="https://facebook.com" label="Facebook">
            <FacebookIcon />
          </SocialLink>
          <SocialLink href="https://x.com" label="X (Twitter)">
            <XIcon />
          </SocialLink>
          <SocialLink
            href="https://www.linkedin.com/in/cassius-reynolds/"
            label="LinkedIn"
          >
            <LinkedInIcon />
          </SocialLink>
          <SocialLink
            href="https://github.com/cassius2828"
            label="GitHub"
          >
            <GitHubIcon />
          </SocialLink>
        </motion.div>

        {/* Copyright */}
        <motion.div 
          className="mt-12 border-t border-foreground/10 pt-8 text-center text-sm text-foreground/40"
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
        className="group relative block text-foreground/60 transition-all duration-300 hover:text-gold"
      >
        <span className="absolute -inset-2 rounded-full bg-gold/0 transition-all duration-300 group-hover:bg-gold/10" />
        <span className="relative block transition-transform duration-300 group-hover:scale-110">
          {children}
        </span>
      </Link>
    </motion.div>
  );
}

function InstagramIcon() {
  return (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
