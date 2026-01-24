import { cdnUrl } from "~/lib/cdn";

export function FeaturedSection() {
  return (
    <section className="relative min-h-[80vh] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${cdnUrl("olympic-paris-nba.jpeg")})`,
        }}
      />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-slate-900" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[80vh] flex-col items-center justify-center px-4 py-24 text-center sm:px-8 lg:px-16">
        <h2 className="font-stencil text-4xl uppercase tracking-wide text-white sm:text-5xl lg:text-7xl">
          Featured Lineups
        </h2>

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70">
          Showcase your fantasy basketball prowess by sharing your lineups on
          social media or via text messages. Engage your friends and followers,
          and maybe even recruit some new competitors to join Lineup Legends.
        </p>
      </div>
    </section>
  );
}

