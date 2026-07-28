"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, FileSpreadsheet, PieChart, TrendingUp, Sparkles, Send, CreditCard, Wallet, BarChart3 } from "lucide-react";

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add("visible"), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

function RevealScale({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add("visible"), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`reveal-scale ${className}`}>
      {children}
    </div>
  );
}

const AVATARS = [
  { initials: "TO", color: "#e8f5e9", textColor: "#2e7d32" },
  { initials: "AK", color: "#e3f2fd", textColor: "#1565c0" },
  { initials: "SE", color: "#fce4ec", textColor: "#c62828" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper-white">
      {/* Navigation — Steep transparent style */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-5 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-forest-container rounded-buttons flex items-center justify-center text-white">
            <span className="font-bold text-base">C</span>
          </div>
          <span className="font-signifier text-xl text-forest">CONYEST</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm text-slate-gray hover:text-forest transition-colors">Product</a>
          <a href="#" className="text-sm text-slate-gray hover:text-forest transition-colors">Resources</a>
          <a href="#" className="text-sm text-slate-gray hover:text-forest transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden sm:inline text-sm text-slate-gray hover:text-forest transition-colors">
            Sign In
          </Link>
          <Link href="/register">
            <Button variant="default" size="sm" className="btn-lift">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero — Steep editorial layout with floating artifacts */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-16 sm:pt-24 pb-16 relative">
        <div className="text-center max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-mist-gray rounded-buttons px-4 py-1.5 mb-6 text-sm text-slate-gray">
            <Sparkles className="h-3.5 w-3.5 text-lime-vibrant" />
            <span>Financial intelligence for Nigerians</span>
          </div>
          <h1 className="font-signifier text-[40px] sm:text-[56px] md:text-[64px] leading-[1.3] text-ink-black mb-5" style={{ letterSpacing: "-0.96px" }}>
            Financial intelligence<br />
            <span className="italic">for every naira</span>
          </h1>
          <p className="text-[17px] text-slate-gray max-w-xl mx-auto mb-8 leading-relaxed">
            Upload bank statements, track every transaction, and gain deep insights
            into your spending habits across all your Nigerian bank accounts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link href="/register">
              <Button variant="default" size="lg" className="gap-2 btn-lift w-full sm:w-auto">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="btn-lift w-full sm:w-auto">
                Book a Demo
              </Button>
            </Link>
          </div>

          {/* AI Composer — Steep-style input artifact */}
          <div className="floating-artifact p-3 sm:p-4 max-w-xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center text-xs text-forest font-medium">@</span>
                <span className="w-8 h-8 rounded-full bg-mist-gray flex items-center justify-center text-xs text-smoke-gray">ⓘ</span>
              </div>
              <input
                type="text"
                placeholder="Ask anything about your finances..."
                className="flex-1 bg-transparent border-none text-sm text-ink-black placeholder:text-smoke-gray focus:outline-none"
              />
              <button className="w-10 h-10 bg-forest rounded-full flex items-center justify-center text-white shrink-0 hover:bg-forest-container transition-colors">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Floating artifacts around hero */}
        <div className="hidden lg:block">
          {/* Stat card — top right */}
          <div className="floating-artifact p-4 absolute right-4 top-20 w-56">
            <p className="text-[11px] text-ash-gray mb-1">Total Balance</p>
            <p className="text-xl font-mono font-medium text-ink-black">₦2,847,500</p>
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingUp className="h-3 w-3 text-forest" />
              <span className="text-[11px] text-slate-gray">↑ 5.5x vs last month</span>
            </div>
            {/* Mini chart line */}
            <svg className="w-full h-8 mt-2" viewBox="0 0 200 30">
              <path d="M0,25 Q25,20 50,22 Q75,18 100,10 Q125,15 150,5 Q175,8 200,3" fill="none" stroke="#5d2a1a" strokeWidth="2" />
            </svg>
          </div>

          {/* Avatar bubbles — left side */}
          <div className="absolute left-2 top-40 flex -space-x-2">
            {AVATARS.map((a, i) => (
              <div key={i} className="avatar-bubble" style={{ background: a.color, color: a.textColor, zIndex: 10 - i }}>
                {a.initials}
              </div>
            ))}
            <div className="ml-3 mt-2">
              <p className="text-[11px] text-ash-gray">Active users</p>
              <p className="text-sm font-medium text-ink-black">3 analyzing now</p>
            </div>
          </div>

          {/* Registration stat card — bottom right */}
          <div className="floating-artifact p-4 absolute right-0 bottom-4 w-48">
            <p className="text-[11px] text-ash-gray mb-1">Registrations</p>
            <p className="text-xl font-mono font-medium text-ink-black">2.4k</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-lime-vibrant/20 text-forest font-medium">↑ 12%</span>
              <span className="text-[10px] text-ash-gray">vs last week</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by — subtle line */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-8 pb-16 text-center">
        <p className="text-xs text-ash-gray mb-6">Trusted by financial analysts across Nigeria</p>
        <div className="flex items-center justify-center gap-8 sm:gap-12 opacity-40">
          <span className="text-lg font-semibold text-ink-black">GTBank</span>
          <span className="text-lg font-semibold text-ink-black">Access</span>
          <span className="text-lg font-semibold text-ink-black">OPay</span>
          <span className="text-lg font-semibold text-ink-black">Kuda</span>
          <span className="text-lg font-semibold text-ink-black">Moniepoint</span>
        </div>
      </section>

      {/* Feature columns — Steep 3-column layout */}
      <section className="bg-section-fog py-20 sm:py-24">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <Reveal>
            <h2 className="font-signifier text-[40px] sm:text-[44px] text-ink-black text-center mb-16" style={{ letterSpacing: "-0.66px" }}>
              A new kind of<br />
              <span className="italic">financial analytics</span>
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <Reveal delay={100}>
              <div className="bg-mist-gray rounded-cards p-6 sm:p-8 card-lift">
                <div className="w-11 h-11 bg-forest/10 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="h-5 w-5 text-forest" />
                </div>
                <h3 className="text-base font-medium text-ink-black mb-2">Built on metrics</h3>
                <p className="text-sm text-slate-gray leading-relaxed">
                  No more manual tracking. CONYEST normalizes all your bank data into governed financial metrics you can trust.
                </p>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="bg-mist-gray rounded-cards p-6 sm:p-8 card-lift">
                <div className="w-11 h-11 bg-lime/10 rounded-xl flex items-center justify-center mb-4">
                  <Sparkles className="h-5 w-5 text-lime" />
                </div>
                <h3 className="text-base font-medium text-ink-black mb-2">Powered by AI</h3>
                <p className="text-sm text-slate-gray leading-relaxed">
                  AI-powered categorization and anomaly detection. Ask questions about your spending in plain English.
                </p>
              </div>
            </Reveal>
            <Reveal delay={300}>
              <div className="bg-mist-gray rounded-cards p-6 sm:p-8 card-lift">
                <div className="w-11 h-11 bg-forest-container/10 rounded-xl flex items-center justify-center mb-4">
                  <Wallet className="h-5 w-5 text-forest-container" />
                </div>
                <h3 className="text-base font-medium text-ink-black mb-2">Designed for clarity</h3>
                <p className="text-sm text-slate-gray leading-relaxed">
                  Beautiful reports, clear categories, and actionable insights. Understand your money at a glance.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Feature detail — 2-column text + AI card */}
      <section className="py-20 sm:py-24">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <Reveal>
              <div>
                <p className="text-xs uppercase tracking-widest text-ash-gray font-medium mb-3">AI-Powered Analysis</p>
                <h2 className="font-signifier text-[36px] sm:text-[44px] text-ink-black mb-5" style={{ letterSpacing: "-0.66px" }}>
                  Ask anything about<br />
                  <span className="italic">your finances</span>
                </h2>
                <p className="text-[15px] text-slate-gray leading-relaxed mb-6">
                  Get deep insights about your spending patterns, recurring charges, and financial health — all in plain English.
                </p>
                <Link href="/register" className="inline-flex items-center gap-1.5 text-sm text-ink-black font-medium hover:underline">
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Reveal>
            <RevealScale delay={100}>
              {/* AI Chat card — floating artifact */}
              <div className="floating-artifact p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="avatar-bubble" style={{ background: "#e8f5e9", color: "#2e7d32" }}>
                    MF
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-black">Mary (Finance)</p>
                    <p className="text-xs text-ash-gray">Asked 2 min ago</p>
                  </div>
                </div>
                <div className="bg-mist-gray rounded-xl p-4 mb-4">
                  <p className="text-sm text-ink-black">&ldquo;Are subscriptions growing in line with revenue expectations?&rdquo;</p>
                </div>
                <div className="bg-forest/5 rounded-xl p-4 border border-forest/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-lime-vibrant" />
                    <span className="text-xs font-medium text-forest">AI Response</span>
                  </div>
                  <p className="text-sm text-ink-black leading-relaxed">
                    Subscriptions grew 23% this month vs 18% last month. Revenue is tracking 5% above projections. Top driver: Premium plan upgrades (+31%).
                  </p>
                </div>
              </div>
            </RevealScale>
          </div>
        </div>
      </section>

      {/* Feature detail 2 — reversed layout */}
      <section className="bg-section-fog py-20 sm:py-24">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealScale delay={100} className="order-2 lg:order-1">
              {/* Multi-bank card — floating artifact */}
              <div className="floating-artifact p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-forest" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-black">Multi-Bank Support</p>
                    <p className="text-xs text-ash-gray">18+ Nigerian banks supported</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { bank: "GTBank", type: "credit", amount: "+₦450,000" },
                    { bank: "Access Bank", type: "debit", amount: "-₦125,000" },
                    { bank: "OPay", type: "credit", amount: "+₦89,000" },
                    { bank: "Kuda", type: "debit", amount: "-₦34,500" },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[#ececec]/50 last:border-0">
                      <span className="text-sm text-ink-black">{row.bank}</span>
                      <span className={`text-sm font-mono font-medium ${row.type === "credit" ? "text-forest" : "text-error"}`}>
                        {row.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </RevealScale>
            <Reveal delay={100} className="order-1 lg:order-2">
              <div>
                <p className="text-xs uppercase tracking-widest text-ash-gray font-medium mb-3">Multi-Bank</p>
                <h2 className="font-signifier text-[36px] sm:text-[44px] text-ink-black mb-5" style={{ letterSpacing: "-0.66px" }}>
                  All your accounts<br />
                  <span className="italic">in one place</span>
                </h2>
                <p className="text-[15px] text-slate-gray leading-relaxed mb-6">
                  Connect GTBank, Access, OPay, Kuda, Moniepoint, and 13 more. See your complete financial picture across every account.
                </p>
                <Link href="/register" className="inline-flex items-center gap-1.5 text-sm text-ink-black font-medium hover:underline">
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Accent Peach Card — Editorial highlight */}
      <section className="py-20 sm:py-24">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <RevealScale>
            <div className="bg-blush-peach rounded-cards p-8 sm:p-12 text-sienna-brown">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                <div>
                  <h2 className="font-signifier text-[28px] sm:text-[36px] leading-[1.3] mb-4" style={{ letterSpacing: "-0.66px" }}>
                    Turn messy statements<br />
                    <span className="italic">into clarity</span>
                  </h2>
                  <p className="text-[17px] leading-relaxed mb-6 opacity-80">
                    Our intelligent parser normalizes transaction data from 18+ Nigerian banks,
                    detects self-transfers, and auto-categorizes your spending.
                  </p>
                  <Link href="/register">
                    <Button variant="default" size="lg" className="gap-2 btn-lift">
                      Start Analyzing <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/60 rounded-xl p-4 flex items-center gap-4 card-lift">
                    <TrendingUp className="h-8 w-8 text-forest shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Track Inflows & Outflows</p>
                      <p className="text-xs opacity-70">See where every naira goes</p>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-xl p-4 flex items-center gap-4 card-lift">
                    <span className="text-2xl shrink-0">🔄</span>
                    <div>
                      <p className="font-semibold text-sm">Self-Transfer Detection</p>
                      <p className="text-xs opacity-70">Automatically identify internal moves</p>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-xl p-4 flex items-center gap-4 card-lift">
                    <span className="text-2xl shrink-0">📊</span>
                    <div>
                      <p className="font-semibold text-sm">Monthly Reports</p>
                      <p className="text-xs opacity-70">Beautiful spending summaries</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealScale>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-mist-gray py-20 sm:py-24">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 text-center">
          <Reveal>
            <h2 className="font-signifier text-[36px] sm:text-[44px] text-ink-black mb-5" style={{ letterSpacing: "-0.66px" }}>
              Ready to take control<br />
              <span className="italic">of your finances?</span>
            </h2>
            <p className="text-[17px] text-slate-gray max-w-lg mx-auto mb-8">
              Join thousands of Nigerians who trust CONYEST to track, analyze, and optimize their financial life.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button variant="default" size="lg" className="gap-2 btn-lift w-full sm:w-auto">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="btn-lift w-full sm:w-auto">
                  Book a Demo →
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ececec] py-8 px-4 sm:px-8">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ash-gray">© 2026 CONYEST. Financial Intelligence System.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-ash-gray hover:text-forest transition-colors">Privacy</a>
            <a href="#" className="text-xs text-ash-gray hover:text-forest transition-colors">Terms</a>
            <a href="#" className="text-xs text-ash-gray hover:text-forest transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}