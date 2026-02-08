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
          <p>We collect information in two categories:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Non-Personal Information:</strong> Browser type, device
              information, pages visited, time spent on the website, and general
              usage analytics.
            </li>
            <li>
              <strong>
                User Account Information (if you create an account):
              </strong>{" "}
              When you create a user account, we collect your email address,
              username, and password (encrypted). We may also store your quiz
              progress, achievement levels, and performance data.
            </li>
          </ul>
          <p className="mt-4">
            This data is used to improve user experience, personalize content,
            track learning progress, and analyze performance metrics.
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

          <h2 className="text-xl font-semibold">
            User Accounts & Authentication
          </h2>
          <p>
            If you create a user account, your login credentials and account
            data are securely stored in our database (Supabase). We implement
            industry-standard encryption for passwords. Your account data is
            used to track quiz progress, achievement levels, and personalize
            your learning experience. You can delete your account at any time
            through your account settings.
          </p>

          <h2 className="text-xl font-semibold">
            Quiz Progress & Learning Data
          </h2>
          <p>
            When you participate in level-wise quizzes, we store your quiz
            attempts, scores, correct/incorrect answers, completion time, and
            achievement levels. This data helps us provide personalized learning
            recommendations and track your progress over time. Only you can
            access your own quiz history and performance data through your
            account.
          </p>

          <h2 className="text-xl font-semibold">Third-Party Services</h2>
          <p>
            We use third-party services including: Unsplash for gallery images,
            Google Generative AI for content assistance, weather APIs for
            real-time data, Supabase for authentication and database storage,
            and analytics services. These services may have their own privacy
            policies that we recommend you review.
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
