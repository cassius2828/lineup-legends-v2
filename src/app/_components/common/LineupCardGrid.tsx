const LineupCardGrid = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">{children}</div>
  );
};
export default LineupCardGrid;
