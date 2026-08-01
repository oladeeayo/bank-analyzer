"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        const msg = data.error?.message || data.message || "";
        if (msg.toLowerCase().includes("already exists")) {
          router.push(`/login?email=${encodeURIComponent(email)}&msg=account_exists`);
          return;
        }
        setError(msg || "Registration failed");
        setLoading(false);
        return;
      }

      const { error: signInError } = await signIn.email({
        email,
        password,
      });

      if (signInError) {
        setError("Account created but sign-in failed. Please go to login.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-low p-4">
      <div className="w-full max-w-[440px]">
        <div className="bg-paper-white rounded-elevated shadow-elevated p-10 relative">
          <button
            onClick={() => router.push("/")}
            className="absolute top-6 right-6 text-ash-gray hover:text-ink-black transition-colors"
            aria-label="Close"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-forest rounded-buttons flex items-center justify-center text-white">
              <span className="font-bold text-lg">C</span>
            </div>
            <span className="font-signifier text-2xl text-forest">CONYEST</span>
          </div>

          <h1 className="font-signifier text-[22px] text-center text-ink-black mb-8">
            Create your account
          </h1>

          {error && (
            <div className="bg-error-container border border-error/20 text-error px-4 py-2.5 rounded-inputs text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-ink-black block mb-2.5">
                Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-11 rounded-inputs border-[#ececec] bg-paper-white text-ink-black placeholder:text-smoke-gray focus-visible:ring-2 focus-visible:ring-lime-vibrant/50 text-[15px]"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-ink-black block mb-2.5">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="h-11 rounded-inputs border-[#ececec] bg-paper-white text-ink-black placeholder:text-smoke-gray focus-visible:ring-2 focus-visible:ring-lime-vibrant/50 text-[15px]"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-ink-black block mb-2.5">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="h-11 rounded-inputs border-[#ececec] bg-paper-white text-ink-black placeholder:text-smoke-gray focus-visible:ring-2 focus-visible:ring-lime-vibrant/50 text-[15px]"
                required
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#ececec]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-paper-white px-3 text-ash-gray">or</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={async () => {
                const { error } = await signIn.social({
                  provider: "google",
                  callbackURL: "/dashboard",
                });
                if (error) {
                  setError(error.message || "Google sign-up failed");
                }
              }}
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign up with Google
            </Button>
          </div>

          <p className="text-center text-[13px] text-ash-gray mt-8 leading-relaxed">
            By signing up I agree to the{" "}
            <Link href="#" className="underline hover:text-slate-gray">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="underline hover:text-slate-gray">
              Privacy Policy
            </Link>
          </p>

          <p className="text-center text-[13px] text-smoke-gray mt-5">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-ink-black hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
