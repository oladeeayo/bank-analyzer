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
        setError(data.error?.message || data.message || "Registration failed");
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
    <div className="min-h-screen flex items-center justify-center bg-paper-white p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-forest-container rounded-buttons flex items-center justify-center text-white">
              <span className="font-bold text-lg">C</span>
            </div>
            <span className="font-signifier text-[22px] text-forest">CONYEST</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-8 shadow-subtle">
          <div className="text-center mb-6">
            <h1 className="font-signifier text-[28px] text-ink-black mb-2">Create Account</h1>
            <p className="text-sm text-ash-gray">Start analyzing your finances today</p>
          </div>

          {/* Google Sign-Up */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-[#ececec] text-ink-black hover:bg-mist-gray"
            onClick={() => signIn.social({ provider: "google" })}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#ececec]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-paper-white px-2 text-ash-gray">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-error-container/50 border border-error/20 text-error px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-ink-black">Name</Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="bg-mist-gray border-[#ececec] rounded-inputs text-ink-black placeholder:text-smoke-gray focus:ring-lime-vibrant/50 focus:border-lime"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-ink-black">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-mist-gray border-[#ececec] rounded-inputs text-ink-black placeholder:text-smoke-gray focus:ring-lime-vibrant/50 focus:border-lime"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-ink-black">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-mist-gray border-[#ececec] rounded-inputs text-ink-black placeholder:text-smoke-gray focus:ring-lime-vibrant/50 focus:border-lime"
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-ash-gray">
            Already have an account?{" "}
            <Link href="/login" className="text-lime font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
