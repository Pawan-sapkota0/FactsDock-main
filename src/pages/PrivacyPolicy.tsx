import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">
          Last updated: {new Date().getFullYear()}
        </p>

        <section className="space-y-6">
          <p>
            Welcome to <strong>World Facts</strong>. Your privacy is important
            to us. This Privacy Policy explains how we collect, use, and protect
            information when you use our website.
          </p>

          <h2 className="text-xl font-semibold">Information We Collect</h2>
          <p>
            We may collect non-personal information such as browser type, device
            information, pages visited, and time spent on the website. This data
            is used only to improve user experience and performance.
          </p>

          <h2 className="text-xl font-semibold">Cookies</h2>
          <p>
            World Facts uses cookies to enhance functionality, analyze traffic,
            and display advertisements. You can disable cookies in your browser
            settings.
          </p>

          <h2 className="text-xl font-semibold">Advertising</h2>
          <p>
            We use Google AdSense to display ads. Google may use cookies
            (including the DoubleClick cookie) to show ads based on your visits
            to this and other websites. Users can opt out of personalized
            advertising via Google Ad Settings.
          </p>

          <h2 className="text-xl font-semibold">Third-Party Services</h2>
          <p>
            We may use third-party services for data storage, authentication,
            analytics, and AI-based content generation. These services may
            change over time as the platform evolves.
          </p>

          <h2 className="text-xl font-semibold">Data Security</h2>
          <p>
            We take reasonable measures to protect information. However, no
            online system is 100% secure.
          </p>

          <h2 className="text-xl font-semibold">User Consent</h2>
          <p>By using this website, you consent to this Privacy Policy.</p>

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

export default PrivacyPolicy;
