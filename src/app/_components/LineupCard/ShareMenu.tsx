"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Share2,
  Copy,
  ExternalLink,
  Mail,
  Twitter,
  Facebook,
} from "lucide-react";
import { toast } from "sonner";

const shareMenuItemClassName =
  "text-foreground/60 hover:bg-foreground/5 hover:text-gold flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors";

function ShareMenuItem({
  onClick,
  icon: Icon,
  children,
}: {
  onClick: () => void;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={onClick}
      className={shareMenuItemClassName}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {children}
    </button>
  );
}

interface ShareMenuProps {
  lineupId: string;
}

export default function ShareMenu({ lineupId }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [supportsNativeShare, setSupportsNativeShare] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setSupportsNativeShare(!!navigator?.share);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const getUrl = useCallback(
    () => `${window.location.origin}/lineups/${lineupId}`,
    [lineupId],
  );

  const shareText = "Check out this lineup on Lineup Legends!";

  async function handleCopyLink() {
    const url = getUrl();
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
    setOpen(false);
  }

  async function handleNativeShare() {
    const url = getUrl();
    try {
      await navigator.share({ title: shareText, url });
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("Sharing failed");
      }
    }
    setOpen(false);
  }

  function handleTwitter() {
    const url = getUrl();
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setOpen(false);
  }

  function handleFacebook() {
    const url = getUrl();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setOpen(false);
  }

  function handleEmail() {
    const url = getUrl();
    window.location.href = `mailto:?subject=${encodeURIComponent("Check out this lineup!")}&body=${encodeURIComponent(`${shareText}\n\n${url}`)}`;
    setOpen(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="group text-foreground/40 hover:text-gold cursor-pointer transition-colors"
        aria-label="Share lineup"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Share2 className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Share options"
          className="border-foreground/10 bg-background absolute right-0 bottom-full z-50 mb-2 w-48 overflow-hidden rounded-lg border shadow-lg"
        >
          <ShareMenuItem onClick={handleCopyLink} icon={Copy}>
            Copy Link
          </ShareMenuItem>

          {supportsNativeShare && (
            <ShareMenuItem onClick={handleNativeShare} icon={ExternalLink}>
              Share&hellip;
            </ShareMenuItem>
          )}

          <div className="border-foreground/10 mx-3 border-t" />

          <ShareMenuItem onClick={handleTwitter} icon={Twitter}>
            Share on X
          </ShareMenuItem>

          <ShareMenuItem onClick={handleFacebook} icon={Facebook}>
            Share on Facebook
          </ShareMenuItem>

          <ShareMenuItem onClick={handleEmail} icon={Mail}>
            Send via Email
          </ShareMenuItem>
        </div>
      )}
    </div>
  );
}
