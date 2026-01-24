import { cdnUrl } from "~/lib/cdn";

export function FriendsSection() {
  return (
    <section className="bg-black px-4 py-24 sm:px-8 lg:px-16">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row">
        {/* Left - Image */}
        <div className="flex-1">
          <img
            src={cdnUrl("magic-and-bird-friends.jpeg")}
            alt="Larry Bird and Magic Johnson shaking hands"
            className="w-full rounded-lg shadow-2xl shadow-black/50"
          />
        </div>

        {/* Right - Text */}
        <div className="flex-1 text-center lg:text-left">
          <h2 className="font-stencil text-4xl uppercase tracking-wide text-white sm:text-5xl lg:text-6xl">
            Add Friends
          </h2>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/70">
            Expand your network by adding friends on Lineup Legends. Follow
            their lineup updates, compete in friendly challenges, and stay
            connected through your shared passion for fantasy basketball.
          </p>
        </div>
      </div>
    </section>
  );
}

