import { cdnUrl } from "~/lib/cdn";

export function CommentingSection() {
  return (
    <section className="relative min-h-[70vh] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${cdnUrl("inside-the-nba.jpg")})`,
        }}
      />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[70vh] items-center px-4 py-24 sm:px-8 lg:px-16">
        <div className="max-w-xl">
          <h2 className="font-stencil text-4xl uppercase tracking-wide text-white sm:text-5xl lg:text-6xl">
            Commenting on
          </h2>
          <h2 className="font-stencil text-4xl uppercase tracking-wide text-white sm:text-5xl lg:text-6xl">
            Posts
          </h2>

          <p className="mt-8 text-lg leading-relaxed text-white/70">
            Foster discussions and provide feedback by leaving comments on your
            friends' and other users' lineups. Share tips, praise great picks,
            or suggest improvements to help everyone build better lineups.
          </p>
        </div>
      </div>
    </section>
  );
}

