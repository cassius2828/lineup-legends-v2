import { auth } from "~/server/auth";
import {
  CommentingSection,
  FeaturedSection,
  FriendsSection,
  GambleSection,
  HeroSection,
  RatingSection,
  ShareSection,
  WelcomeSection,
} from "./_components/landing";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-slate-900">
      <HeroSection isAuthenticated={!!session} />
      <WelcomeSection />
      <RatingSection />
      <CommentingSection />
      <FriendsSection />
      <GambleSection />
      <ShareSection />
      <FeaturedSection />
    </main>
  );
}
