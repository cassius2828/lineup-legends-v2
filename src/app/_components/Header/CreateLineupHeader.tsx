import { Loader2, RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "~/app/_components/common/ui/tooltip";

interface CreateLineupHeaderProps {
  remainingBudget: number;
  activePlayer: boolean;
  onRefresh: () => void;
  canRefresh: boolean;
  isRefreshing: boolean;
  isAuthenticated: boolean;
}

function getTooltipText(isAuthenticated: boolean, canRefresh: boolean): string {
  if (!isAuthenticated) return "Get a new selection of players";
  if (canRefresh) return "Get a new selection of players (1 refresh per day)";
  return "You've used your daily refresh. Resets at midnight ET.";
}

const CreateLineupHeader = ({
  remainingBudget,
  activePlayer,
  onRefresh,
  canRefresh,
  isRefreshing,
  isAuthenticated,
}: CreateLineupHeaderProps) => {
  const disabled = (isAuthenticated && !canRefresh) || isRefreshing;

  return (
    <header className="relative mb-20 flex flex-col items-center justify-center md:mb-16">
      <div className="flex items-center gap-2">
        <h1 className="text-foreground font-bold tracking-wide uppercase md:text-2xl">
          Build Your Starting 5
        </h1>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onRefresh}
              disabled={disabled}
              className="text-foreground/60 hover:text-foreground/80 disabled:text-foreground/25 rounded-md p-1 transition-colors disabled:cursor-not-allowed"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {getTooltipText(isAuthenticated, canRefresh)}
          </TooltipContent>
        </Tooltip>
      </div>
      <span
        className={`mt-1 font-bold transition-colors duration-200 md:text-3xl ${
          remainingBudget < 3
            ? "text-red-400"
            : remainingBudget < 6
              ? "text-gold"
              : "text-foreground"
        }`}
      >
        ${remainingBudget}
      </span>
      <p className="text-foreground/60 absolute top-16 mt-1 max-w-sm px-2 text-center text-sm leading-snug md:top-20">
        Drag a player onto a position, or click to fill the next open slot in
        order.
      </p>
      {activePlayer && (
        <span className="text-foreground/60 mt-1 animate-pulse text-sm">
          Drag to a position slot...
        </span>
      )}
    </header>
  );
};
export default CreateLineupHeader;
