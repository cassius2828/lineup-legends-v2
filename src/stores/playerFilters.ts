import { create } from "zustand";

interface PlayerFiltersState {
  valueFilter: number | null;
  searchQuery: string;
  expanded: boolean;
  currentPage: number;
  setValueFilter: (value: number | null) => void;
  setSearchQuery: (query: string) => void;
  setExpanded: (expanded: boolean) => void;
  setCurrentPage: (page: number) => void;
}

export const usePlayerFiltersStore = create<PlayerFiltersState>((set) => ({
  valueFilter: null,
  searchQuery: "",
  expanded: false,
  currentPage: 1,
  setValueFilter: (valueFilter) => set({ valueFilter, currentPage: 1 }),
  setSearchQuery: (searchQuery) => set({ searchQuery, currentPage: 1 }),
  setExpanded: (expanded) => set({ expanded, currentPage: 1 }),
  setCurrentPage: (currentPage) => set({ currentPage }),
}));
