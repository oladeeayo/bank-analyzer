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
