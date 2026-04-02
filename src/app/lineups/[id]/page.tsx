"use client";

import { ArrowLeft } from "lucide-react";
import { LineupCard } from "~/app/_components/LineupCard/LineupCard";
import type { LineupType } from "~/lib/types";
import { api } from "~/trpc/react";
import { useParams, useRouter } from "next/navigation";
import Loading from "./loading";
import CommentCard from "~/app/_components/Comment/CommentCard";
import Image from "next/image";
import { useSubmitComment } from "~/hooks/useSubmitComment";
import { useState } from "react";

const LineupCardPage = () => {
    const router = useRouter();
    const [text, setText] = useState("");
    const { data: session } = api.profile.getMe.useQuery(undefined, {
        retry: false,
    });
    const params = useParams();
    const rawId = params?.id;
    const lineupId =
        typeof rawId === "string" ? rawId : Array.isArray(rawId) ? (rawId[0] ?? "") : "";
    const { data: lineup, isLoading } = api.lineup.getLineupById.useQuery({
        id: lineupId,
    });
    const {
        data: commentData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = api.comment.getComments.useInfiniteQuery(
        { lineupId, limit: 10 },
        { getNextPageParam: (lastPage) => lastPage.cursor },
    );

    const { data: myVotes } = api.comment.getMyCommentVotes.useQuery(
        { lineupId },
        { enabled: !!lineupId && !!session },
    );

    const allComments = commentData?.pages.flatMap((p) => p.comments) ?? [];
    const { submit, isSubmitting } = useSubmitComment({
        lineupId,
        mode: "comment",
        commentId: undefined,
    });
    if (isLoading) return <Loading />;
    if (!lineup) return <div className="p-12 text-center text-foreground/50">Lineup not found</div>;
    return (
        <div className="mx-auto my-12 flex w-full max-w-3xl flex-col px-4 pt-12">
            <button
                type="button"
                onClick={() => router.back()}
                className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm text-foreground/40 transition-colors hover:text-foreground/70"
            >
                <ArrowLeft className="h-4 w-4" />
                Back
            </button>
            <LineupCard
                lineup={lineup as unknown as LineupType}
                showOwner={true}
                isOwner={false}
                currentUserId={session?.id ?? ""}
            />
            {/* Composer */}
            <div className="mt-4 rounded-xl border border-foreground/10 p-4">
                <div className="flex gap-3">
                    {session?.user?.image ? (
                        <Image
                            src={session.user.image}
                            alt={session.user.name ?? "You"}
                            width={36}
                            height={36}
                            className="h-9 w-9 shrink-0 rounded-full"
                        />
                    ) : (
                        <div className="h-9 w-9 shrink-0 rounded-full bg-foreground/10" />
                    )}
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={2}
                        maxLength={1000}
                        className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
                        placeholder="Post your reply"
                    />
                </div>
                <div className="mt-3 flex items-center justify-end">
                    <button
                        type="button"
                        onClick={() => {
                            submit(text);
                            setText("");
                        }}
                        disabled={!text.trim() || isSubmitting || !session}
                        className="rounded-full bg-gold px-5 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isSubmitting ? "Posting..." : "Reply"}
                    </button>
                </div>
            </div>
            {/* Comments list */}
            {allComments.length > 0 && (
                <div className="mt-2 px-1">
                    {allComments.map((comment) => {
                        const cid = comment._id?.toString() ?? "";
                        return (
                            <CommentCard
                                key={cid}
                                comment={comment as unknown as import("~/server/models").Comment}
                                lineupId={lineupId}
                                currentUserId={session?.id}
                                userVote={myVotes?.[cid] ?? null}
                            />
                        );
                    })}
                    {hasNextPage && (
                        <div className="flex justify-center py-4">
                            <button
                                className="text-sm text-foreground/40 transition-colors hover:text-foreground/70"
                                type="button"
                                disabled={isFetchingNextPage}
                                onClick={() => fetchNextPage()}
                            >
                                {isFetchingNextPage ? "Loading..." : "Show more replies"}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


export default LineupCardPage