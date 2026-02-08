import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import logger from "@/lib/logger";

/**
 * VerifyEmail - Legacy page that redirects to home
 * OTP verification is no longer needed
 */
const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // OTP verification disabled - redirect to home
    logger.debug(
      "[VerifyEmail] OTP verification disabled - redirecting to home",
    );
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VerifyEmail;
