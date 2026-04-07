const NoResults = () => {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <p className="text-lg text-foreground/60">No players found</p>
        <p className="mt-2 text-sm text-foreground/40">
          Try adjusting your search or filters
        </p>
      </div>
    </div>
  );
};
export default NoResults;
