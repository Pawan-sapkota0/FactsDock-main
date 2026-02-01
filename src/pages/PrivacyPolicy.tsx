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
            Welcome to <strong>FactsDock</strong>. Your privacy is important to
            us. This Privacy Policy explains how we collect, use, and protect
            information when you use our website.
          </p>

          <h2 className="text-xl font-semibold">Information We Collect</h2>
          <p>
            We may collect non-personal information such as browser type, device
            information, pages visited, and time spent on the website. This data
            is used only to improve user experience and performance. We do not
            collect personal information unless you voluntarily submit it.
          </p>

          <h2 className="text-xl font-semibold">Local Storage & Caching</h2>
          <p>
            FactsDock uses browser storage technologies (IndexedDB,
            localStorage) to cache country images, facts, and data for improved
            performance and offline functionality. This data is stored locally
            on your device and is never transmitted to our servers unless you
            explicitly share it. Image compression is applied to reduce storage
            requirements.
          </p>

          <h2 className="text-xl font-semibold">Image Protection</h2>
          <p>
            Images displayed in our galleries are protected with soft image
            protection measures that disable right-click context menu, prevent
            image dragging, and block mobile long-press actions. This protection
            is designed to discourage casual copying only and does not provide
            complete security.
          </p>

          <h2 className="text-xl font-semibold">Third-Party Services</h2>
          <p>
            We use third-party services including: Unsplash for gallery images,
            Google Generative AI for content assistance, weather APIs for
            real-time data, and analytics services. These services may have
            their own privacy policies that we recommend you review.
          </p>

          <h2 className="text-xl font-semibold">Cookies</h2>
          <p>
            FactsDock uses cookies to enhance functionality, analyze traffic,
            and display advertisements. You can disable cookies in your browser
            settings. Some functionality may be limited without cookies.
          </p>

          <h2 className="text-xl font-semibold">Advertising</h2>
          <p>
            We use Google AdSense to display ads. Google may use cookies
            (including the DoubleClick cookie) to show ads based on your visits
            to this and other websites. Users can opt out of personalized
            advertising via Google Ad Settings.
          </p>

          <h2 className="text-xl font-semibold">Data Security</h2>
          <p>
            We take reasonable measures to protect information transmitted
            through our systems. However, no online system is 100% secure. Data
            stored locally on your device is protected by your device's
            security.
          </p>

          <h2 className="text-xl font-semibold">User Consent</h2>
          <p>By using this website, you consent to this Privacy Policy.</p>

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

export default PrivacyPolicy;
