"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { LineupCard } from "../LineupCard/LineupCard";

interface ParentComment {
    _id: string;
    text: string;
    user: {
        name?: string;
        username?: string;
        image?: string | null;
        profileImg?: string | null;
    };
    createdAt: string | Date;
}

interface LineupContext {
    lineupId: string;
    ownerName: string;
    ownerImage?: string | null;
    totalValue: number;
}

type CommentModalProps = {
    open: boolean;
    onClose: () => void;
    lineupId: string;
} & (
        | { mode: "comment"; lineup: LineupContext; parentComment?: never }
        | { mode: "reply"; parentComment: ParentComment; lineup?: never }
    );

export default function CommentModal({
    open,
    onClose,
    lineupId,
    mode,
    ...rest
}: CommentModalProps) {
    const { data: session } = useSession();
    const [text, setText] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const utils = api.useUtils();
    const { data: lineup } = api.lineup.getLineupById.useQuery({ id: lineupId }, { enabled: !!lineupId });
    const addComment = api.comment.addComment.useMutation({
        onSuccess: () => {
            toast.success("Comment posted");
            void utils.comment.getComments.invalidate({ lineupId });
            setText("");
            onClose();
        },
        onError: (err) => toast.error(err.message),
    });

    const addReply = api.comment.addThreadReply.useMutation({
        onSuccess: () => {
            toast.success("Reply posted");
            void utils.comment.getComments.invalidate({ lineupId });
            setText("");
            onClose();
        },
        onError: (err) => toast.error(err.message),
    });

    const isSubmitting = addComment.isPending || addReply.isPending;

    useEffect(() => {
        if (open) {
            setTimeout(() => textareaRef.current?.focus(), 50);
        } else {
            setText("");
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    if (!open) return null;

    const handleSubmit = () => {
        const trimmed = text.trim();
        if (!trimmed) return;

        if (mode === "comment") {
            addComment.mutate({ lineupId, text: trimmed });
        } else {
            const parentComment = (rest as { parentComment: ParentComment }).parentComment;
            addReply.mutate({
                lineupId,
                commentId: parentComment._id,
                text: trimmed,
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const userImage = session?.user?.image;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[3vh] backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="mx-4 w-full  rounded-2xl bg-surface-800 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1 text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-medium text-foreground/40">
                        {mode === "comment" ? "Comment" : "Reply"}
                    </span>
                    <div className="w-6" />
                </div>

                {/* Parent context */}
                <div className="border-b border-foreground/10 px-5 py-4">
                    {mode === "comment" ? (
                        <LineupCard lineup={lineup} />
                    ) : (
                        <ParentCommentPreview
                            comment={(rest as { parentComment: ParentComment }).parentComment}
                        />
                    )}
                </div>

                {/* Reply input */}
                <div className="px-5 py-4">
                    <div className="flex gap-3">
                        {userImage ? (
                            <Image
                                src={userImage}
                                alt="You"
                                width={36}
                                height={36}
                                className="h-9 w-9 shrink-0 rounded-full"
                            />
                        ) : (
                            <div className="h-9 w-9 shrink-0 rounded-full bg-foreground/10" />
                        )}
                        <div className="flex-1">
                            <textarea
                                ref={textareaRef}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Post your reply"
                                maxLength={1000}
                                rows={3}
                                className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-foreground/10 px-5 py-3">
                    <span className="text-xs text-foreground/30">
                        {text.length}/1000
                    </span>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!text.trim() || isSubmitting || !session}
                        className="rounded-full bg-gold px-5 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isSubmitting ? "Posting..." : "Reply"}
                    </button>
                </div>
            </div>
        </div>
    );
}



function ParentCommentPreview({ comment }: { comment: ParentComment }) {
    const displayName =
        comment.user.name ?? comment.user.username ?? "Anonymous";
    const avatar = comment.user.image ?? comment.user.profileImg;

    return (
        <div className="flex gap-3">
            {avatar ? (
                <Image
                    src={avatar}
                    alt={displayName}
                    width={36}
                    height={36}
                    className="h-9 w-9 shrink-0 rounded-full"
                />
            ) : (
                <div className="h-9 w-9 shrink-0 rounded-full bg-foreground/10" />
            )}
            <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="mt-0.5 text-sm text-foreground/60">{comment.text}</p>
            </div>
        </div>
    );
}
