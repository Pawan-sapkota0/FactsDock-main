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
            By accessing or using <strong>FactsDock</strong>, you agree to
            comply with these Terms & Conditions.
          </p>

          <h2 className="text-xl font-semibold">Use of Website</h2>
          <p>
            FactsDock provides facts, quizzes, country data, galleries, and
            weather information for informational and entertainment purposes
            only. The website is provided as-is for personal, non-commercial
            use. You may create a user account to access personalized features
            including quiz progress tracking, achievement levels, and learning
            statistics.
          </p>

          <h2 className="text-xl font-semibold">Image Protection & Use</h2>
          <p>
            Gallery images are sourced from Unsplash and are protected with soft
            protection measures (disabled right-click, prevented dragging,
            blocked mobile long-press). Images are provided under Unsplash's
            license terms. Users agree not to attempt to circumvent these
            protections for unauthorized copying or distribution.
          </p>

          <h2 className="text-xl font-semibold">
            User Accounts & Responsibility
          </h2>
          <p>
            If you create a user account, you are responsible for maintaining
            the confidentiality of your login credentials and password. You
            agree to provide accurate information during registration. You are
            responsible for all activities that occur under your account.
            FactsDock reserves the right to suspend or terminate accounts that
            violate these terms.
          </p>

          <h2 className="text-xl font-semibold">Quiz System & Learning</h2>
          <p>
            FactsDock offers level-wise quizzes designed for learning and
            assessment. Quiz questions, answers, and difficulty levels may be
            generated or assisted by artificial intelligence. We do not
            guarantee absolute accuracy of quiz content. Users should not rely
            solely on our quizzes for formal education or certification. Quiz
            scores and progress are recorded for logged-in users to track
            learning achievements.
          </p>

          <h2 className="text-xl font-semibold">Content & Accuracy</h2>
          <p>
            While we strive for accuracy, some content may be generated or
            assisted by artificial intelligence. We do not guarantee absolute
            accuracy of facts, statistics, or data. Users should verify
            important information independently before relying on it.
          </p>

          <h2 className="text-xl font-semibold">Cache & Local Storage</h2>
          <p>
            FactsDock uses browser storage (IndexedDB, localStorage) to cache
            data for performance. This data is compressed and stored locally on
            your device. Users can clear this data anytime through browser
            settings. We are not responsible for data loss on your device.
          </p>

          <h2 className="text-xl font-semibold">Intellectual Property</h2>
          <p>
            All content, design, features, and functionality are the property of
            FactsDock unless stated otherwise. Gallery images are sourced from
            Unsplash. Unauthorized copying, scraping, or redistribution of any
            content is prohibited.
          </p>

          <h2 className="text-xl font-semibold">Third-Party Services</h2>
          <p>
            FactsDock integrates third-party services including Unsplash,
            weather APIs, and Google Generative AI. Your use of these services
            is subject to their respective terms and policies. We are not
            responsible for their availability, accuracy, or terms.
          </p>

          <h2 className="text-xl font-semibold">Prohibited Activities</h2>
          <p>
            Users must not: attempt unauthorized access to other user accounts,
            misuse services, scrape or extract data (including images), bypass
            image protection measures, engage in illegal activities, violate any
            third-party terms, share account credentials, or manipulate quiz
            systems to artificially inflate scores.
          </p>

          <h2 className="text-xl font-semibold">Limitation of Liability</h2>
          <p>
            FactsDock is not liable for inaccuracies, interruptions, service
            downtime, data loss, or damages resulting from use of the website or
            third-party services. We provide the website "as-is" without
            warranty.
          </p>

          <h2 className="text-xl font-semibold">Changes & Termination</h2>
          <p>
            We reserve the right to modify content, features, cache strategy,
            image protection measures, or terminate access at any time without
            notice. Significant changes will be announced where possible.
          </p>

          <h2 className="text-xl font-semibold">Contact</h2>
          <p>
            If you have questions, contact us at:
            <br />
            <a
              href="mailto:support@factsdock.com"
              className="text-blue-600 hover:underline"
            >
              support@factsdock.com
            </a>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;
