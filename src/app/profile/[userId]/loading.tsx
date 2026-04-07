import GoldCircleSpinnerLoader from "~/app/_components/loaders/GoldCircleSpinnerLoader";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-surface-950 via-surface-800 to-surface-950">
      <GoldCircleSpinnerLoader />
    </main>
  );
}
