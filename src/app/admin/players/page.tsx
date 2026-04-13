"use client";

import Fuse from "fuse.js";
import { useState } from "react";
import SearchInput from "~/app/_components/Forms/SearchInput";
import { GoldCircleSpinnerLoader } from "~/app/_components/common/loaders";
import { api } from "~/trpc/react";
import { CantFindPlayerSection } from "./components/CantFindPlayerSection";
import DefaultPlayersOnInitialRender from "./components/DefaultPlayersOnInitialRender";
import Header from "./components/Header";
import NoResults from "./components/NoResults";
import ResultsCount from "./components/ResultsCount";
import SearchResults from "./components/SearchResults";
import ValueFilter from "./components/ValueFilter";

export default function AdminPlayersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [valueFilter, setValueFilter] = useState<number | null>(null);

  const { data: allPlayersData, isLoading: isAllPlayersLoading } =
    api.player.getAll.useQuery();

  const fuse = allPlayersData
    ? new Fuse(allPlayersData, {
        keys: ["firstName", "lastName"],
        threshold: 0.3,
      })
    : null;

  const filteredPlayers = valueFilter
    ? fuse?.search(searchQuery)?.filter((p) => p.item.value === valueFilter)
    : fuse?.search(searchQuery);

  const isInitialRender =
    fuse?.search(searchQuery)?.length === 0 && searchQuery.length === 0;

  const ifNoResults =
    !isAllPlayersLoading &&
    fuse?.search(searchQuery)?.length === 0 &&
    searchQuery.length > 0;

  return (
    <div>
      <Header />

      <div className="mb-8 flex flex-wrap gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by player name..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
          />
        </div>

        <ValueFilter
          valueFilter={valueFilter}
          setValueFilter={setValueFilter}
        />
      </div>

      <ResultsCount
        isAllPlayersLoading={isAllPlayersLoading}
        isInitialRender={isInitialRender}
        filteredPlayers={filteredPlayers ?? []}
      />

      {isAllPlayersLoading ? (
        <GoldCircleSpinnerLoader />
      ) : (
        <SearchResults filteredPlayers={filteredPlayers ?? []} />
      )}
      {isInitialRender && (
        <DefaultPlayersOnInitialRender allPlayersData={allPlayersData ?? []} />
      )}

      {ifNoResults && <NoResults />}

      <CantFindPlayerSection />
    </div>
  );
}
