import { getPaginationRange } from "~/lib/pagination";

type PlayersPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function PlayersPagination({
  currentPage,
  totalPages,
  onPageChange,
}: PlayersPaginationProps) {
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="text-foreground hover:bg-foreground/10 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-30"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {getPaginationRange(currentPage, totalPages).map((page, i) =>
        page === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="text-foreground/40 px-2 text-sm"
          >
            &hellip;
          </span>
        ) : (
          <button
            type="button"
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`min-w-[36px] rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              currentPage === page
                ? "bg-gold text-black"
                : "text-foreground hover:bg-foreground/10"
            }`}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="text-foreground hover:bg-foreground/10 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-30"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}
