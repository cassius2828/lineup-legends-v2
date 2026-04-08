"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Share2,
  Copy,
  ExternalLink,
  Mail,
  MessageSquare,
  Twitter,
  Facebook,
} from "lucide-react";
import { toast } from "sonner";

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

  function handleSms() {
    const url = getUrl();
    window.location.href = `sms:?body=${encodeURIComponent(`${shareText} ${url}`)}`;
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
          <button
            role="menuitem"
            type="button"
            onClick={handleCopyLink}
            className="text-foreground/60 hover:bg-foreground/5 hover:text-gold flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors"
          >
            <Copy className="h-4 w-4 shrink-0" />
            Copy Link
          </button>

          {supportsNativeShare && (
            <button
              role="menuitem"
              type="button"
              onClick={handleNativeShare}
              className="text-foreground/60 hover:bg-foreground/5 hover:text-gold flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              Share&hellip;
            </button>
          )}

          <div className="border-foreground/10 mx-3 border-t" />

          <button
            role="menuitem"
            type="button"
            onClick={handleTwitter}
            className="text-foreground/60 hover:bg-foreground/5 hover:text-gold flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors"
          >
            <Twitter className="h-4 w-4 shrink-0" />
            Share on X
          </button>

          <button
            role="menuitem"
            type="button"
            onClick={handleFacebook}
            className="text-foreground/60 hover:bg-foreground/5 hover:text-gold flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors"
          >
            <Facebook className="h-4 w-4 shrink-0" />
            Share on Facebook
          </button>

          <div className="border-foreground/10 mx-3 border-t" />

          <button
            role="menuitem"
            type="button"
            onClick={handleSms}
            className="text-foreground/60 hover:bg-foreground/5 hover:text-gold flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors"
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            Send via SMS
          </button>

          <button
            role="menuitem"
            type="button"
            onClick={handleEmail}
            className="text-foreground/60 hover:bg-foreground/5 hover:text-gold flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors"
          >
            <Mail className="h-4 w-4 shrink-0" />
            Send via Email
          </button>
        </div>
      )}
    </div>
  );
}
