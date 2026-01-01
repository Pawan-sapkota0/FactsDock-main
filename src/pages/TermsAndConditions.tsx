import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const TermsAndConditions: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>
        <p className="text-sm text-gray-500 mb-8">
          Last updated: {new Date().getFullYear()}
        </p>

        <section className="space-y-6">
          <p>
            By accessing or using <strong>World Facts</strong>, you agree to
            comply with these Terms & Conditions.
          </p>

          <h2 className="text-xl font-semibold">Use of Website</h2>
          <p>
            World Facts provides facts and quizzes for informational and
            entertainment purposes only.
          </p>

          <h2 className="text-xl font-semibold">AI Content Disclaimer</h2>
          <p>
            Some content may be generated or assisted by artificial
            intelligence. We do not guarantee absolute accuracy. Users should
            verify important information independently.
          </p>

          <h2 className="text-xl font-semibold">Intellectual Property</h2>
          <p>
            All content, design, and features are the property of World Facts
            unless stated otherwise. Unauthorized copying or redistribution is
            prohibited.
          </p>

          <h2 className="text-xl font-semibold">Prohibited Activities</h2>
          <p>
            Users must not attempt unauthorized access, misuse services, scrape
            data, or engage in illegal activities.
          </p>

          <h2 className="text-xl font-semibold">Limitation of Liability</h2>
          <p>
            World Facts is not liable for inaccuracies, interruptions, or
            damages resulting from use of the website.
          </p>

          <h2 className="text-xl font-semibold">Changes & Termination</h2>
          <p>
            We reserve the right to modify content, features, or terminate
            access at any time without notice.
          </p>

          <h2 className="text-xl font-semibold">Contact</h2>
          <p>
            If you have questions, contact us at:
            <br />
            <a
              href="mailto:support@worldfacts.com"
              className="text-blue-600 hover:underline"
            >
              support@worldfacts.com
            </a>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;
