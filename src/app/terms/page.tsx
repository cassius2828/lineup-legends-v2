import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Lineup Legends",
  description:
    "Terms of Service for Lineup Legends fantasy basketball platform",
};

export default function TermsPage() {
  return (
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-stencil text-gradient-gold text-4xl tracking-wide uppercase sm:text-5xl">
          Terms of Service
        </h1>
        <p className="text-foreground/60 mt-2 text-sm">
          Last updated: March 6, 2025
        </p>

        <div className="text-foreground/80 mt-12 space-y-10">
          <section>
            <h2 className="font-stencil text-gold mb-3 text-xl tracking-wide uppercase">
              Acceptance of Terms
            </h2>
            <p>
              By accessing or using Lineup Legends (&quot;the Service&quot;),
              you agree to be bound by these Terms of Service. If you do not
              agree to these terms, please do not use the Service. We reserve
              the right to modify these terms at any time, and your continued
              use of the Service constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="font-stencil text-gold mb-3 text-xl tracking-wide uppercase">
              Description of Service
            </h2>
            <p>
              Lineup Legends is a free-to-use fantasy basketball platform that
              allows users to:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Create fantasy lineups with a $15 budget</li>
              <li>Browse and rate other users&apos; lineups</li>
              <li>Gamble players for random replacements</li>
              <li>Follow other users and view their profiles</li>
              <li>Upload profile and banner images</li>
            </ul>
            <p className="mt-3">
              The Service is provided &quot;as is&quot; and we do not guarantee
              uninterrupted access or that all features will always be
              available.
            </p>
          </section>

          <section>
            <h2 className="font-stencil text-gold mb-3 text-xl tracking-wide uppercase">
              User Accounts
            </h2>
            <p>
              To access certain features, you must create an account. You may
              sign in via Google OAuth or email and password credentials. You
              are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your
              account. You must provide accurate and complete information when
              creating your account.
            </p>
          </section>

          <section>
            <h2 className="font-stencil text-gold mb-3 text-xl tracking-wide uppercase">
              User Conduct
            </h2>
            <p>
              You agree to use the Service only for lawful purposes and in
              accordance with these terms. You agree not to:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Violate any applicable laws or regulations</li>
              <li>
                Infringe on the intellectual property or privacy rights of
                others
              </li>
              <li>
                Upload content that is offensive, harassing, defamatory, or
                otherwise objectionable
              </li>
              <li>
                Attempt to gain unauthorized access to the Service or other
                users&apos; accounts
              </li>
              <li>
                Use the Service to distribute malware or engage in any harmful
                activity
              </li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate
              these guidelines.
            </p>
          </section>

          <section>
            <h2 className="font-stencil text-gold mb-3 text-xl tracking-wide uppercase">
              Intellectual Property
            </h2>
            <p>
              The Service, including its design, features, and content
              (excluding user-generated content), is owned by Lineup Legends and
              protected by intellectual property laws. You retain ownership of
              content you upload, but you grant us a non-exclusive license to
              use, store, and display that content as necessary to operate the
              Service.
            </p>
          </section>

          <section>
            <h2 className="font-stencil text-gold mb-3 text-xl tracking-wide uppercase">
              Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law, Lineup Legends and its
              developers shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use
              of the Service. The Service is provided free of charge, and we
              make no warranties regarding its accuracy, reliability, or fitness
              for a particular purpose.
            </p>
          </section>

          <section>
            <h2 className="font-stencil text-gold mb-3 text-xl tracking-wide uppercase">
              Changes to Terms
            </h2>
            <p>
              We may update these Terms of Service from time to time. We will
              notify users of material changes by posting the updated terms on
              this page and updating the &quot;Last updated&quot; date. Your
              continued use of the Service after such changes constitutes
              acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="font-stencil text-gold mb-3 text-xl tracking-wide uppercase">
              Contact
            </h2>
            <p>
              If you have questions about these Terms of Service, please contact
              us at{" "}
              <a
                href="mailto:cassius.reynolds.dev@gmail.com"
                className="text-gold hover:text-gold-light transition-colors"
              >
                cassius.reynolds.dev@gmail.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="border-foreground/10 mt-12 border-t pt-8">
          <Link
            href="/"
            className="text-gold hover:text-gold-light transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
