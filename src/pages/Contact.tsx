import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { log, debug, warn, error } from "@/lib/logger";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formElement = e.currentTarget; // Save form before async call
      const fd = new FormData(formElement);
      const payload = {
        name: String(fd.get("user_name") || "").trim(),
        email: String(fd.get("user_email") || "").trim(),
        message: String(fd.get("message") || "").trim(),
      };

      const resp = await fetch(
        import.meta.env.VITE_CONTACT_API_URL || "/api/contact",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!resp.ok) {
        const text = await resp.text().catch(() => "Server error");
        throw new Error(text || "Failed to send message");
      }

      const successText = "Email sent successfully!";
      setSuccessMsg(successText);
      toast({
        title: successText,
        description: "Thank you for contacting us. We'll get back to you soon.",
      });
      formElement.reset(); // Reset form
    } catch (err) {
      error("🚨 Email sending failed.", err);
      const errorMsg = "Failed to send email, please try again.";
      setErrorMsg(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Contact Us
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                We'd love to hear from you
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  Send us a message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Inline alerts */}
                  {successMsg ? (
                    <div className="p-4 rounded-md bg-green-50 border border-green-200 text-green-800">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{successMsg}</div>
                        <button
                          type="button"
                          onClick={() => setSuccessMsg(null)}
                          className="text-green-700 hover:text-green-900"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {errorMsg ? (
                    <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-800">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{errorMsg}</div>
                        <button
                          type="button"
                          onClick={() => setErrorMsg(null)}
                          className="text-red-700 hover:text-red-900"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="user_name"
                      placeholder="Your name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="user_email"
                      type="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="How can we help you?"
                      rows={6}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">
                      Email us directly
                    </p>
                    <a
                      href="mailto:pawansapkota06@gmail.com"
                      className="text-primary hover:text-primary-hover transition-colors"
                    >
                      pawansapkota06@gmail.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
