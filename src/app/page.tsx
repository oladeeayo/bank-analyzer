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
  {
    name: "GTBank",
    logo: (
      <svg viewBox="0 0 28 28" className="w-7 h-7 shrink-0">
        <rect width="28" height="28" rx="6" fill="#d4541e" />
        <text x="14" y="19" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="sans-serif">G</text>
        <text x="14" y="19" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="sans-serif" dx="7" dy="-2">T</text>
      </svg>
    ),
  },
  {
    name: "Access Bank",
    logo: (
      <svg viewBox="0 0 28 28" className="w-7 h-7 shrink-0">
        <rect width="28" height="28" rx="6" fill="#006e46" />
        <circle cx="14" cy="14" r="6" fill="none" stroke="white" strokeWidth="1.5" />
        <path d="M14 8 L14 20 M8 14 L20 14" stroke="white" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    name: "OPay",
    logo: (
      <svg viewBox="0 0 28 28" className="w-7 h-7 shrink-0">
        <rect width="28" height="28" rx="6" fill="#11418b" />
        <circle cx="14" cy="14" r="7" fill="none" stroke="white" strokeWidth="1.5" />
        <text x="14" y="18" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="sans-serif">O</text>
      </svg>
    ),
  },
  {
    name: "Kuda",
    logo: (
      <svg viewBox="0 0 28 28" className="w-7 h-7 shrink-0">
        <rect width="28" height="28" rx="6" fill="#8b1d8b" />
        <path d="M8 8 Q14 4 16 10 Q18 16 20 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="20" cy="14" r="1.5" fill="white" />
      </svg>
    ),
  },
  {
    name: "Moniepoint",
    logo: (
      <svg viewBox="0 0 28 28" className="w-7 h-7 shrink-0">
        <rect width="28" height="28" rx="6" fill="#0062a0" />
        <polygon points="10,20 14,8 18,20" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="10" y1="20" x2="18" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "First Bank",
    logo: (
      <svg viewBox="0 0 28 28" className="w-7 h-7 shrink-0">
        <rect width="28" height="28" rx="6" fill="#003069" />
        <path d="M14 6 L6 14 L14 22 L22 14 Z" fill="none" stroke="white" strokeWidth="1.5" />
        <text x="14" y="18" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">F</text>
      </svg>
    ),
  },
  {
    name: "UBA",
    logo: (
      <svg viewBox="0 0 28 28" className="w-7 h-7 shrink-0">
        <rect width="28" height="28" rx="6" fill="#c8102e" />
        <text x="14" y="18" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="sans-serif">U</text>
      </svg>
    ),
  },
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
          Upload statements from any Nigerian bank and see exactly where your money goes.
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
                {bank.logo}
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
                  Add all your banks — GTBank, Access, OPay, Kuda, Moniepoint, First Bank, and more — and see everything in one place.
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
                  Upload CSV, Excel, or PDF statements — we detect the format, normalize every transaction, and flag transfers between your own accounts.
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
                  See category breakdowns, merchant rankings, and recurring charges. Actionable insights, not just numbers.
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
                    Upload statements from 18+ Nigerian banks. CONYEST normalizes the data,
                    detects transfers between your accounts, and categorizes every transaction automatically.
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
                      <p className="font-semibold text-sm">Track Money In & Money Out</p>
                      <p className="text-xs opacity-70">See where every naira goes</p>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-xl p-4 flex items-center gap-4">
                    <span className="text-2xl shrink-0">🔄</span>
                    <div>
                      <p className="font-semibold text-sm">Self-Transfer Detection</p>
                      <p className="text-xs opacity-70">Automatically find transfers between your own accounts</p>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-xl p-4 flex items-center gap-4">
                    <span className="text-2xl shrink-0">📊</span>
                    <div>
                      <p className="font-semibold text-sm">Monthly Reports</p>
                      <p className="text-xs opacity-70">Clear summaries of what you earned and spent</p>
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
              Join thousands of Nigerians who use CONYEST to understand and manage their finances.
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