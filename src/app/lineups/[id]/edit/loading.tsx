import { GoldCircleSpinnerLoader } from "~/app/_components/common/loaders";

export default function Loading() {
  return (
    <main className="from-surface-950 via-surface-800 to-surface-950 flex min-h-screen items-center justify-center bg-gradient-to-b">
      <GoldCircleSpinnerLoader />
    </main>
  );
}
