import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Gamepad2 } from "lucide-react";

const FunZone = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12">
        {/* <Card className="max-w-xl w-full text-center p-12"> */}
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto"></div>
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                Fun Zone
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Play, learn, and refresh your mind with interactive games
            </p>
            <p className="mt-4 text-muted-foreground">
                Coming soon! Stay tuned for exciting updates.
            </p>
          </div>
          {/* </Card> */}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FunZone;
