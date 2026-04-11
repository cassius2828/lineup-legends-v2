import type { ViewMode } from "./ViewToggle";

const LineupCardGrid = ({
  children,
  view = "list",
}: {
  children: React.ReactNode;
  view?: ViewMode;
}) => {
  if (view === "grid") {
    return (
      <div className="grid grid-cols-4 gap-3 lg:grid-cols-6">{children}</div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">{children}</div>
  );
};
export default LineupCardGrid;
