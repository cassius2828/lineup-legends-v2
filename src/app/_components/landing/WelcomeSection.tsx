import { cdnUrl } from "~/lib/cdn";

export function WelcomeSection() {
  return (
    <section className="bg-slate-900 px-4 py-24 sm:px-8 lg:px-16">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row">
        {/* Left - Image */}
        <div className="flex-1">
          <picture>
            <source
              media="(max-width: 768px)"
              srcSet={cdnUrl("create-lineup-mobile.png")}
            />
            <img
              src={cdnUrl("create-lineup-screenshot.png")}
              alt="Lineup Builder Interface"
              className="w-full rounded-lg shadow-2xl shadow-black/50"
            />
          </picture>
        </div>

        {/* Right - Text */}
        <div className="flex-1 text-center lg:text-left">
          <h2 className="font-stencil text-4xl uppercase tracking-wide text-white sm:text-5xl lg:text-6xl">
            Welcome to
          </h2>
          <h2 className="font-stencil text-4xl uppercase tracking-wide text-white sm:text-5xl lg:text-6xl">
            Lineup
          </h2>
          <h2 className="font-stencil text-4xl uppercase tracking-wide text-white sm:text-5xl lg:text-6xl">
            Legends
          </h2>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/70">
            The ultimate fantasy basketball lineup creation and management
            platform. Start by creating your lineup within a set budget,
            choosing from a pool of past and present players. Each player in
            their value tier is randomly selected to ensure a fair and exciting
            experience. Strategically manage your budget and player selections
            to build the best possible team.
          </p>
        </div>
      </div>
    </section>
  );
}

