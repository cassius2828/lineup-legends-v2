'use client'
import React from 'react'
import { LineupCard } from '~/app/_components/LineupCard/LineupCard'
import { api } from '~/trpc/react'
import { useParams } from 'next/navigation'
import Loading from './loading'

const LineupCardPage = () => {
    const { data: session } = api.profile.getMe.useQuery(undefined, {
        retry: false,
    });
    const params = useParams();
    const lineupId = params?.id ?? "";
    console.log(session, ' session')
    const { data: lineup, isLoading } = api.lineup.getLineupById.useQuery({
        id: lineupId,
    });
    if (isLoading) return <Loading />;
    return (
        <div className='flex w-1/2 max-w-3xl mx-auto my-12 pt-12'>


            <LineupCard

                lineup={lineup}
                showOwner={true}
                isOwner={false}
                currentUserId={session?.id ?? ""}
            />
        </div>
    )
}

export default LineupCardPage