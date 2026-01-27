import Link from "next/link";
import { auth } from "~/server/auth";
import {
  HeroSection,
  WelcomeSection,
  RatingSection,
  CommentingSection,
  FriendsSection,
  GambleSection,
  ShareSection,
  FeaturedSection,
  Footer,
} from "./_components/landing";
import Nav from "./_components/Nav";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <Nav />

      {/* Landing Page Sections */}
      <HeroSection isAuthenticated={!!session} />
      <WelcomeSection />
      <RatingSection />
      <CommentingSection />
      <FriendsSection />
      <GambleSection />
      <ShareSection />
      <FeaturedSection />
      <Footer />
    </main>
  );
}
