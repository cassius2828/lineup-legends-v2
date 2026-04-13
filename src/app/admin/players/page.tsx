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
  // local state
  const [searchQuery, setSearchQuery] = useState("");
  const [valueFilter, setValueFilter] = useState<number | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestFirstName, setRequestFirstName] = useState("");
  const [requestLastName, setRequestLastName] = useState("");
  const [requestValue, setRequestValue] = useState(3);
  const [requestNote, setRequestNote] = useState("");
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState("");
  // trpc data fetching and mutation hooks
  const { data: allPlayersData, isLoading: isAllPlayersLoading } =
    api.player.getAll.useQuery();

  const utils = api.useUtils();

  const createRequest = api.requestedPlayer.create.useMutation({
    onSuccess: () => {
      setRequestSuccess(true);
      setRequestFirstName("");
      setRequestLastName("");
      setRequestValue(3);
      setRequestNote("");
      void utils.requestedPlayer.getAll.invalidate();
      setTimeout(() => {
        setRequestSuccess(false);
        setShowRequestForm(false);
      }, 2000);
    },
    onError: (error) => {
      setRequestError(error.message);
    },
  });

  // fuse search hook
  const fuse = allPlayersData
    ? new Fuse(allPlayersData, {
        keys: ["firstName", "lastName"],
        threshold: 0.3,
      })
    : null;
  // handle request submit
  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError("");
    createRequest.mutate({
      firstName: requestFirstName,
      lastName: requestLastName,
      suggestedValue: requestValue,
      note: requestNote.trim() || undefined,
    });
  };

  // Filter by value if selected
  const filteredPlayers = valueFilter
    ? fuse?.search(searchQuery)?.filter((p) => p.item.value === valueFilter)
    : fuse?.search(searchQuery);

  // conditionals
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

      <CantFindPlayerSection
        showRequestForm={showRequestForm}
        setShowRequestForm={setShowRequestForm}
        requestSuccess={requestSuccess}
        requestError={requestError}
        requestFirstName={requestFirstName}
        setRequestFirstName={setRequestFirstName}
        requestLastName={requestLastName}
        setRequestLastName={setRequestLastName}
        requestValue={requestValue}
        setRequestValue={setRequestValue}
        requestNote={requestNote}
        setRequestNote={setRequestNote}
        createRequest={createRequest}
        handleRequestSubmit={handleRequestSubmit}
        setRequestError={setRequestError}
      />
    </div>
  );
}
