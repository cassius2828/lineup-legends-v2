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
            {/* post your reply here */}
            <div className="px-5 py-4">
                <hr className="border-foreground/10 mb-5" />

                <div className="flex gap-3 items-end">
                    <Image src={session?.user?.image ?? ""} alt={session?.user?.name ?? ""} width={32} height={32} />

                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}

                        className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
                        placeholder="Post your reply"
                    />
                </div>
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
                <div>
                    image icon, gif icon
                </div>
                <br />
                <hr className="border-foreground/10" />
            </div>
            {/* Comments list */}
            {allComments.length > 0 && (
                <div className="border-b border-foreground/10 px-5 py-4">
                    {allComments.map((comment) => (
                        <CommentCard key={comment._id?.toString()} comment={comment as unknown as import("~/server/models").Comment} />
                    ))}
                    {commentData?.pages[commentData.pages.length - 1]?.hasMore && (
                        <div className="flex justify-center">
                            <button
                                className="mt-4 text-sm text-foreground/40 hover:text-foreground/70"
                                type="button"
                                disabled={isFetchingNextPage}
                                onClick={() => fetchNextPage()}
                            >
                                {isFetchingNextPage ? "Loading..." : "Load more comments"}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


export default LineupCardPage