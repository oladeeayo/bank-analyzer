"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Building2,
  FileSpreadsheet,
  PieChart,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronRight,
  CheckCircle,
} from "lucide-react";

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

function DashboardPreview() {
  return (
    <div className="floating-artifact overflow-hidden text-left">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#ececec]/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-error rounded-full" />
          <div className="w-3 h-3 bg-pending rounded-full" />
          <div className="w-3 h-3 bg-lime-vibrant rounded-full" />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-ash-gray font-medium">
          <span className="w-2 h-2 bg-forest rounded-full" />
          CONYEST Dashboard
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-ash-gray uppercase tracking-wider font-medium">Current Balance</p>
            <p className="font-mono text-2xl font-medium text-ink-black">₦2,847,500</p>
          </div>
          <div className="flex items-center gap-1.5 bg-lime-vibrant/15 px-2.5 py-1 rounded-buttons">
            <TrendingUp className="h-3 w-3 text-forest" />
            <span className="text-[11px] font-semibold text-forest">+12.4%</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-mist-gray rounded-xl p-3">
            <p className="text-[10px] text-ash-gray">Income</p>
            <p className="font-mono text-sm font-medium text-forest">₦1,240,000</p>
          </div>
          <div className="bg-mist-gray rounded-xl p-3">
            <p className="text-[10px] text-ash-gray">Expenses</p>
            <p className="font-mono text-sm font-medium text-error">₦892,000</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-[#ececec]/50 last:border-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-lime-vibrant/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-forest" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink-black">Salary Credit</p>
                <p className="text-[10px] text-ash-gray">GTBank • Mar 28</p>
              </div>
            </div>
            <span className="font-mono text-xs font-medium text-forest">+₦350,000</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#ececec]/50 last:border-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-error/10 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-3.5 w-3.5 text-error" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink-black">Shoprite</p>
                <p className="text-[10px] text-ash-gray">Food & Dining • Mar 27</p>
              </div>
            </div>
            <span className="font-mono text-xs font-medium text-error">-₦45,200</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-error/10 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-3.5 w-3.5 text-error" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink-black">Uber Trip</p>
                <p className="text-[10px] text-ash-gray">Transport • Mar 27</p>
              </div>
            </div>
            <span className="font-mono text-xs font-medium text-error">-₦8,500</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, delay }: { icon: any; title: string; description: string; delay: number }) {
  return (
    <Reveal delay={delay}>
      <div className="group relative bg-paper-white border border-[#ececec] rounded-cards p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[rgba(4,23,43,0.05)0px_0px_0px_1px,rgba(0,0,0,0.1)0px_20px_25px_-5px,rgba(0,0,0,0.1)0px_8px_10px_-6px]">
        <div className="w-11 h-11 bg-forest/5 rounded-xl flex items-center justify-center mb-4 group-hover:bg-forest/10 transition-colors">
          <Icon className="h-5 w-5 text-forest" />
        </div>
        <h3 className="text-base font-medium text-ink-black mb-2">{title}</h3>
        <p className="text-sm text-slate-gray leading-relaxed">{description}</p>
      </div>
    </Reveal>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper-white">
      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-4 sm:px-8 py-4 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-forest rounded-buttons flex items-center justify-center text-white">
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
      <section className="relative max-w-[1200px] mx-auto px-4 sm:px-8 pt-20 sm:pt-28 pb-24 sm:pb-32 text-center">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-lime-vibrant/3 blur-3xl" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] rounded-full bg-forest/3 blur-3xl" />
        </div>
        <Reveal>
          <div className="inline-flex items-center gap-2 bg-forest/5 border border-forest/10 rounded-buttons px-4 py-1.5 mb-6 text-sm text-forest">
            <Sparkles className="h-3.5 w-3.5 text-lime-vibrant" />
            <span>Financial intelligence for Nigerians</span>
          </div>
        </Reveal>
        <h1 className="font-signifier text-[44px] sm:text-[64px] md:text-[76px] leading-[1.15] text-ink-black mb-5 text-balance reveal delay-1" style={{ letterSpacing: "-1.2px" }}>
          Financial intelligence<br />
          <span className="italic">for every naira</span>
        </h1>
        <p className="text-[17px] text-slate-gray max-w-xl mx-auto mb-10 leading-relaxed reveal delay-2">
          Upload statements from any Nigerian bank and see exactly where your money goes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center reveal delay-3">
          <Link href="/register">
            <Button variant="default" size="lg" className="gap-2 w-full sm:w-auto text-base h-11 px-7">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base h-11 px-7">
              Sign In
            </Button>
          </Link>
        </div>
        <Reveal delay={300}>
          <div className="mt-16 max-w-2xl mx-auto">
            <DashboardPreview />
          </div>
        </Reveal>
      </section>

      {/* Feature cards */}
      <section className="border-t border-[#ececec]/50 py-24 sm:py-28">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <Reveal>
            <h2 className="font-signifier text-[36px] sm:text-[44px] text-ink-black text-center mb-4" style={{ letterSpacing: "-0.66px" }}>
              Everything you need<br />
              <span className="italic">to understand your money</span>
            </h2>
            <p className="text-[15px] text-slate-gray text-center max-w-lg mx-auto mb-16">
              From multi-bank uploads to AI-powered categorization — CONYEST brings clarity to your finances.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <FeatureCard
              icon={Building2}
              title="Multi-Bank Support"
              description="Add all your banks — GTBank, Access, OPay, Kuda, Moniepoint, and more — and see everything in one place."
              delay={100}
            />
            <FeatureCard
              icon={Sparkles}
              title="AI Classification"
              description="Every transaction is automatically categorized. Ask questions about your spending in plain English."
              delay={200}
            />
            <FeatureCard
              icon={PieChart}
              title="Deep Analytics"
              description="Category breakdowns, merchant rankings, recurring charges, and cash flow — insights that actually help."
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-mist-gray/50">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "18+", label: "Banks supported" },
              { number: "50K+", label: "Transactions analyzed" },
              { number: "99%", label: "Parsing accuracy" },
              { number: "2,000+", label: "Active users" },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 100}>
                <div className="text-center">
                  <p className="font-signifier text-3xl sm:text-4xl text-forest mb-1">{stat.number}</p>
                  <p className="text-sm text-slate-gray">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 sm:py-28">
        <div className="max-w-[900px] mx-auto px-4 sm:px-8">
          <Reveal>
            <h2 className="font-signifier text-[36px] sm:text-[44px] text-ink-black text-center mb-16" style={{ letterSpacing: "-0.66px" }}>
              Get started in<br />
              <span className="italic">three minutes</span>
            </h2>
          </Reveal>
          <div className="space-y-8">
            {[
              {
                step: "01",
                title: "Connect your banks",
                desc: "Add your Nigerian bank accounts — GTBank, Access, OPay, Kuda, and more.",
              },
              {
                step: "02",
                title: "Upload your statements",
                desc: "Drag and drop CSV, Excel, or PDF statements. We detect the format and parse everything automatically.",
              },
              {
                step: "03",
                title: "See your financial picture",
                desc: "Dashboard shows your balance, spending patterns, recurring charges, and category breakdowns.",
              },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 100}>
                <div className="flex items-start gap-5 sm:gap-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-forest rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <span className="font-signifier text-lg sm:text-xl text-lime-vibrant">{item.step}</span>
                  </div>
                  <div className="pt-2 sm:pt-3">
                    <h3 className="text-lg font-medium text-ink-black mb-1.5">{item.title}</h3>
                    <p className="text-sm text-slate-gray leading-relaxed max-w-lg">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Accent CTA card */}
      <section className="pb-24 sm:pb-28">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-8">
          <Reveal>
            <div className="bg-blush-peach rounded-cards p-8 sm:p-12 text-sienna-brown overflow-hidden relative">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-sienna-brown/5 rounded-full blur-3xl" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center relative">
                <div>
                  <h2 className="font-signifier text-[28px] sm:text-[36px] leading-[1.3] mb-4" style={{ letterSpacing: "-0.66px" }}>
                    Turn messy statements<br />
                    <span className="italic">into clarity</span>
                  </h2>
                  <p className="text-[17px] leading-relaxed mb-6 opacity-80">
                    Upload statements from 18+ Nigerian banks. CONYEST normalizes the data,
                    detects transfers between your accounts, and categorizes every transaction.
                  </p>
                  <Link href="/register">
                    <Button variant="default" size="lg" className="gap-2 bg-sienna-brown hover:bg-sienna-brown/90 text-white border-none">
                      Start Analyzing <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: TrendingUp, title: "Track Money In & Money Out", desc: "See where every naira goes" },
                    { icon: Wallet, title: "Self-Transfer Detection", desc: "Automatically find transfers between your own accounts" },
                    { icon: FileSpreadsheet, title: "Monthly Reports", desc: "Clear summaries of what you earned and spent" },
                  ].map((item) => (
                    <div key={item.title} className="bg-white/60 rounded-xl p-4 flex items-center gap-4 transition-colors hover:bg-white/80">
                      <div className="w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center shrink-0">
                        <item.icon className="h-5 w-5 text-sienna-brown" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{item.title}</p>
                        <p className="text-xs opacity-70">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest py-20 sm:py-24">
        <div className="max-w-[700px] mx-auto px-4 sm:px-8 text-center">
          <Reveal>
            <h2 className="font-signifier text-[36px] sm:text-[44px] text-paper-white mb-5" style={{ letterSpacing: "-0.66px" }}>
              Ready to take control<br />
              <span className="italic">of your finances?</span>
            </h2>
            <p className="text-[17px] text-white/70 max-w-lg mx-auto mb-8">
              Join thousands of Nigerians who use CONYEST to understand and manage their finances.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button variant="success" size="lg" className="gap-2 w-full sm:w-auto text-base h-11 px-7">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="lg" className="w-full sm:w-auto text-base h-11 px-7 text-white/80 hover:text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-forest border-t border-white/10 py-10 px-4 sm:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-lime-vibrant rounded-buttons flex items-center justify-center text-forest text-xs font-bold">C</div>
                <span className="font-signifier text-base text-paper-white">CONYEST</span>
              </div>
              <p className="text-xs text-white/50">Financial intelligence for every naira.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Product</p>
              <div className="space-y-2">
                <Link href="/register" className="block text-xs text-white/50 hover:text-white transition-colors">Get Started</Link>
                <Link href="/login" className="block text-xs text-white/50 hover:text-white transition-colors">Sign In</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Support</p>
              <div className="space-y-2">
                <Link href="/privacy" className="block text-xs text-white/50 hover:text-white transition-colors">Privacy</Link>
                <Link href="/terms" className="block text-xs text-white/50 hover:text-white transition-colors">Terms</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">&copy; 2026 CONYEST. Financial Intelligence System.</p>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <span>Built for Nigeria</span>
              <span>&middot;</span>
              <span>18+ banks supported</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}