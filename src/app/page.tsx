"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, FileSpreadsheet, PieChart, Building2, Sparkles } from "lucide-react";

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

  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

const banks = [
  { name: "GTBank", color: "#d4541e", short: "GT" },
  { name: "Access Bank", color: "#006e46", short: "AB" },
  { name: "OPay", color: "#11418b", short: "OP" },
  { name: "Kuda", color: "#8b1d8b", short: "KU" },
  { name: "Moniepoint", color: "#0062a0", short: "MP" },
  { name: "First Bank", color: "#003069", short: "FB" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-5 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-forest-container rounded-buttons flex items-center justify-center text-white">
            <span className="font-bold text-base">C</span>
          </div>
          <span className="font-signifier text-xl text-forest">CONYEST</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/login" className="text-sm text-slate-gray hover:text-forest transition-colors">
            Sign In
          </Link>
          <Link href="/register">
            <Button variant="default" size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-16 sm:pt-24 pb-16 sm:pb-24 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 bg-mist-gray rounded-buttons px-4 py-1.5 mb-6 text-sm text-slate-gray">
            <Sparkles className="h-3.5 w-3.5 text-lime-vibrant" />
            <span>Financial intelligence for Nigerians</span>
          </div>
        </Reveal>
        <h1 className="font-signifier text-[40px] sm:text-[56px] md:text-[64px] leading-[1.3] text-ink-black mb-5 text-balance reveal delay-1" style={{ letterSpacing: "-0.96px" }}>
          Financial intelligence<br />
          <span className="italic">for every naira</span>
        </h1>
        <p className="text-[17px] text-slate-gray max-w-xl mx-auto mb-8 leading-relaxed reveal delay-2">
          Upload bank statements, track every transaction, and gain deep insights
          into your spending habits across all your Nigerian bank accounts.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center reveal delay-3">
          <Link href="/register">
            <Button variant="default" size="lg" className="gap-2 w-full sm:w-auto">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Bank logos */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-8 pb-16 sm:pb-24">
        <p className="text-xs text-ash-gray text-center mb-6">Works with all major Nigerian banks</p>
        <Reveal>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {banks.map((bank) => (
              <div key={bank.name} className="flex items-center gap-2.5 bg-mist-gray rounded-buttons px-4 py-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: bank.color }}
                >
                  {bank.short}
                </div>
                <span className="text-sm text-ink-black font-medium">{bank.name}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Feature cards */}
      <section className="bg-fog-white py-20 sm:py-24">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <Reveal>
            <h2 className="font-signifier text-[36px] sm:text-[44px] text-ink-black text-center mb-4" style={{ letterSpacing: "-0.66px" }}>
              Everything you need<br />
              <span className="italic">to understand your money</span>
            </h2>
            <p className="text-[15px] text-slate-gray text-center max-w-lg mx-auto mb-12">
              From multi-bank support to AI-powered categorization — CONYEST brings clarity to your finances.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <Reveal delay={100}>
              <div className="bg-paper-white border border-[#ececec] rounded-cards p-6 sm:p-8">
                <div className="w-11 h-11 bg-forest/10 rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="h-5 w-5 text-forest" />
                </div>
                <h3 className="text-base font-medium text-ink-black mb-2">Multi-Bank Support</h3>
                <p className="text-sm text-slate-gray leading-relaxed">
                  Add all your banks — GTBank, Access, OPay, Kuda, Moniepoint, First Bank, and more. See everything in one view.
                </p>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="bg-paper-white border border-[#ececec] rounded-cards p-6 sm:p-8">
                <div className="w-11 h-11 bg-lime/10 rounded-xl flex items-center justify-center mb-4">
                  <FileSpreadsheet className="h-5 w-5 text-lime" />
                </div>
                <h3 className="text-base font-medium text-ink-black mb-2">Smart Statement Parsing</h3>
                <p className="text-sm text-slate-gray leading-relaxed">
                  Upload CSV, Excel, or PDF statements. Automatic format detection, normalization, and self-transfer detection.
                </p>
              </div>
            </Reveal>
            <Reveal delay={300}>
              <div className="bg-paper-white border border-[#ececec] rounded-cards p-6 sm:p-8">
                <div className="w-11 h-11 bg-forest-container/10 rounded-xl flex items-center justify-center mb-4">
                  <PieChart className="h-5 w-5 text-forest-container" />
                </div>
                <h3 className="text-base font-medium text-ink-black mb-2">Deep Analytics</h3>
                <p className="text-sm text-slate-gray leading-relaxed">
                  Category breakdown, merchant ranking, spending velocity, recurring transaction detection, and actionable insights.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Peach accent card */}
      <section className="py-20 sm:py-24">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <Reveal>
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
                    <Button variant="default" size="lg" className="gap-2">
                      Start Analyzing <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/60 rounded-xl p-4 flex items-center gap-4">
                    <TrendingUp className="h-8 w-8 text-forest shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Track Inflows & Outflows</p>
                      <p className="text-xs opacity-70">See where every naira goes</p>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-xl p-4 flex items-center gap-4">
                    <span className="text-2xl shrink-0">🔄</span>
                    <div>
                      <p className="font-semibold text-sm">Self-Transfer Detection</p>
                      <p className="text-xs opacity-70">Automatically identify internal moves</p>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-xl p-4 flex items-center gap-4">
                    <span className="text-2xl shrink-0">📊</span>
                    <div>
                      <p className="font-semibold text-sm">Monthly Reports</p>
                      <p className="text-xs opacity-70">Beautiful spending summaries</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
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
                <Button variant="default" size="lg" className="gap-2 w-full sm:w-auto">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign In
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
            <a href="/privacy" className="text-xs text-ash-gray hover:text-forest transition-colors">Privacy</a>
            <a href="/terms" className="text-xs text-ash-gray hover:text-forest transition-colors">Terms</a>
            <a href="/support" className="text-xs text-ash-gray hover:text-forest transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}