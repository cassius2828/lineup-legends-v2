const NoResults = () => {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <p className="text-foreground/60 text-lg">No players found</p>
        <p className="text-foreground/40 mt-2 text-sm">
          Try adjusting your search or filters
        </p>
      </div>
    </div>
  );
};
export default NoResults;
