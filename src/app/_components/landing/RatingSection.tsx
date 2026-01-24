import { cdnUrl } from "~/lib/cdn";

export function RatingSection() {
  return (
    <section className="bg-black px-4 py-24 sm:px-8 lg:px-16">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row">
        {/* Left - Text */}
        <div className="flex-1 text-center lg:text-left">
          <h2 className="font-stencil text-4xl uppercase tracking-wide text-white sm:text-5xl lg:text-6xl">
            Upvoting and
          </h2>
          <h2 className="font-stencil text-4xl uppercase tracking-wide text-white sm:text-5xl lg:text-6xl">
            Rating
          </h2>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/70">
            Engage with the community by upvoting or downvoting lineups you
            see. Highlight the most popular and highest-rated lineups to help
            users discover top strategies and standout creations.
          </p>
        </div>

        {/* Right - Image */}
        <div className="flex-1">
          <img
            src={cdnUrl("wemby.png")}
            alt="Victor Wembanyama and Jabari Smith Jr."
            className="w-full rounded-lg"
          />
        </div>
      </div>
    </section>
  );
}

