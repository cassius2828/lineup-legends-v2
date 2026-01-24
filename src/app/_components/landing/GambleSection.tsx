import { cdnUrl } from "~/lib/cdn";

export function GambleSection() {
  return (
    <section className="bg-slate-900 px-4 py-24 sm:px-8 lg:px-16">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row">
        {/* Left - Text */}
        <div className="flex-1 text-center lg:text-left">
          <h2 className="font-stencil text-4xl uppercase tracking-wide text-white sm:text-5xl lg:text-6xl">
            Gamble for a
          </h2>
          <h2 className="font-stencil text-4xl uppercase tracking-wide text-white sm:text-5xl lg:text-6xl">
            Player
          </h2>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/70">
            Take a chance to enhance your lineup by gambling for a new player.
            You could get a player one level higher or risk getting a
            lower-level player. Value 1 players can only be gambled for fellow
            value 1 players, adding an extra layer of strategy. You may only
            gamble 3 times per lineup.
          </p>
        </div>

        {/* Right - Image */}
        <div className="flex-1">
          <img
            src={cdnUrl("jordan-cigar.jpg")}
            alt="Michael Jordan celebrating with a cigar"
            className="w-full rounded-lg shadow-2xl shadow-black/50"
          />
        </div>
      </div>
    </section>
  );
}

