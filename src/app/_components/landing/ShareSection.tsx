import { cdnUrl } from "~/lib/cdn";

export function ShareSection() {
  return (
    <section className="relative min-h-[70vh] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-top bg-no-repeat"
        style={{
          backgroundImage: `url(${cdnUrl("kd-twitter-perl.png")})`,
        }}
      />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-l from-black/90 via-black/70 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[70vh] items-center justify-end px-4 py-24 sm:px-8 lg:px-16">
        <div className="max-w-xl text-right">
          <h2 className="font-stencil text-4xl uppercase tracking-wide text-white sm:text-5xl lg:text-6xl">
            Sharing to
          </h2>
          <h2 className="font-stencil text-4xl uppercase tracking-wide text-white sm:text-5xl lg:text-6xl">
            Social Media
          </h2>

          <p className="mt-8 text-lg leading-relaxed text-white/70">
            Showcase your fantasy basketball prowess by sharing your lineups on
            social media or via text messages. Engage your friends and
            followers, and maybe even recruit some new competitors to join
            Lineup Legends.
          </p>
        </div>
      </div>
    </section>
  );
}

