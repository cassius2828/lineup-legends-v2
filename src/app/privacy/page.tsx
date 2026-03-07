import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Lineup Legends",
  description: "Privacy Policy for Lineup Legends fantasy basketball platform",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-800 to-surface-950">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-stencil text-4xl uppercase tracking-wide text-gradient-gold sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          Last updated: March 6, 2025
        </p>

        <div className="mt-12 space-y-10 text-foreground/80">
          <section>
            <h2 className="font-stencil mb-3 text-xl uppercase tracking-wide text-gold">
              Information We Collect
            </h2>
            <p>
              We collect information you provide directly when using Lineup Legends:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Account information (email, name, profile data) when you sign up via Google OAuth or email/password</li>
              <li>Profile and banner images you upload</li>
              <li>Lineups you create, ratings you give, and other in-app activity</li>
              <li>Feedback and support requests you submit</li>
            </ul>
            <p className="mt-3">
              We also automatically collect certain technical information, such as your IP address, browser type, and device information, when you access the Service.
            </p>
          </section>

          <section>
            <h2 className="font-stencil mb-3 text-xl uppercase tracking-wide text-gold">
              How We Use Information
            </h2>
            <p>
              We use the information we collect to:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Provide, maintain, and improve the Service</li>
              <li>Authenticate your identity and manage your account</li>
              <li>Display your profile, lineups, and content to other users as intended by the Service</li>
              <li>Respond to your feedback and support requests</li>
              <li>Monitor and analyze usage patterns to improve the user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="font-stencil mb-3 text-xl uppercase tracking-wide text-gold">
              Information Sharing
            </h2>
            <p>
              We do not sell your personal information. We may share information with third-party service providers who assist us in operating the Service (e.g., hosting, authentication). These providers are contractually obligated to protect your data and use it only for the purposes we specify. We may also disclose information if required by law or to protect our rights and safety.
            </p>
          </section>

          <section>
            <h2 className="font-stencil mb-3 text-xl uppercase tracking-wide text-gold">
              Data Security
            </h2>
            <p>
              We implement reasonable security measures to protect your information from unauthorized access, alteration, or destruction. However, no method of transmission over the internet or electronic storage is completely secure. We cannot guarantee absolute security of your data.
            </p>
          </section>

          <section>
            <h2 className="font-stencil mb-3 text-xl uppercase tracking-wide text-gold">
              Cookies
            </h2>
            <p>
              We use cookies and similar technologies to maintain your session, remember your preferences, and understand how you use the Service. Essential cookies are required for the Service to function. You can configure your browser to refuse cookies, though some features may not work properly without them.
            </p>
          </section>

          <section>
            <h2 className="font-stencil mb-3 text-xl uppercase tracking-wide text-gold">
              Third-Party Services
            </h2>
            <p>
              The Service integrates with the following third-party services, each of which has its own privacy practices:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li><strong>Google OAuth:</strong> Used for sign-in. Google&apos;s privacy policy applies to data shared with Google during authentication.</li>
              <li><strong>AWS S3:</strong> Used to store profile and banner images you upload. Data is stored in secure cloud infrastructure.</li>
              <li><strong>CloudFront CDN:</strong> Used to deliver images and static assets efficiently. Content may be cached at edge locations.</li>
            </ul>
            <p className="mt-3">
              We encourage you to review the privacy policies of these services.
            </p>
          </section>

          <section>
            <h2 className="font-stencil mb-3 text-xl uppercase tracking-wide text-gold">
              Children&apos;s Privacy
            </h2>
            <p>
              The Service is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us and we will take steps to delete that information.
            </p>
          </section>

          <section>
            <h2 className="font-stencil mb-3 text-xl uppercase tracking-wide text-gold">
              Changes to Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-stencil mb-3 text-xl uppercase tracking-wide text-gold">
              Contact
            </h2>
            <p>
              If you have questions about this Privacy Policy or your personal data, please contact us at{" "}
              <a
                href="mailto:cassius.reynolds.dev@gmail.com"
                className="text-gold transition-colors hover:text-gold-light"
              >
                cassius.reynolds.dev@gmail.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-foreground/10 pt-8">
          <Link
            href="/"
            className="text-gold transition-colors hover:text-gold-light"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
