"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await signIn.email({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message || "Invalid email or password");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
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
            <h1 className="font-signifier text-[28px] text-ink-black mb-2">Welcome Back</h1>
            <p className="text-sm text-ash-gray">Sign in to your financial intelligence account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-error-container/50 border border-error/20 text-error px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
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
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-ash-gray">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-lime font-semibold hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
