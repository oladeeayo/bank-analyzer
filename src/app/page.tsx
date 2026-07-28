"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Sparkles, PieChart } from "lucide-react";

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
  { name: "GTBank", file: "gtco.svg" },
  { name: "Access Bank", file: "accesscorp.svg" },
  { name: "First Bank", file: "firstholdco.svg" },
  { name: "Zenith Bank", file: "zenithbank.svg" },
  { name: "UBA", file: "uba.svg" },
  { name: "FCMB", file: "fcmb.svg" },
  { name: "Stanbic IBTC", file: "stanbic.svg" },
  { name: "Fidelity Bank", file: "fidelity.svg" },
  { name: "OPay", file: "opay.svg" },
  { name: "Moniepoint", file: "moniepoint.svg" },
  { name: "Kuda", file: "kuda.svg" },
  { name: "PalmPay", file: "palmpay.svg" },
];

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="group relative bg-paper-white border border-[#ececec] rounded-cards p-8 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[rgba(4,23,43,0.05)0px_0px_0px_1px,rgba(0,0,0,0.08)0px_8px_32px_0px]">
      <div className="w-11 h-11 bg-forest/5 rounded-xl flex items-center justify-center mb-5 group-hover:bg-forest/10 transition-colors">
        <Icon className="h-5 w-5 text-forest" />
      </div>
      <h3 className="text-base font-medium text-ink-black mb-2">{title}</h3>
      <p className="text-sm text-slate-gray leading-relaxed">{description}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-4 max-w-[1200px] mx-auto">
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
      <section className="relative max-w-[1200px] mx-auto px-4 sm:px-8 pt-24 sm:pt-32 pb-16 sm:pb-20 text-center">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-lime-vibrant/3 blur-3xl" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] rounded-full bg-forest/3 blur-3xl" />
        </div>
        <div className="inline-flex items-center gap-2 bg-forest/5 border border-forest/10 rounded-buttons px-4 py-1.5 mb-6 text-sm text-forest">
          <Sparkles className="h-3.5 w-3.5 text-lime-vibrant" />
          <span>Financial intelligence for Nigerians</span>
        </div>
        <h1 className="font-signifier text-[44px] sm:text-[64px] md:text-[76px] leading-[1.15] text-ink-black mb-5 text-balance" style={{ letterSpacing: "-1.2px" }}>
          Financial intelligence<br />
          <span className="italic">for every naira</span>
        </h1>
        <p className="text-[17px] text-slate-gray max-w-xl mx-auto mb-10 leading-relaxed">
          Upload statements from any Nigerian bank and see exactly where your money goes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
      </section>

      {/* Works with */}
      <section className="pb-20 sm:pb-24">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <p className="text-xs text-ash-gray text-center mb-8">Works with all major Nigerian banks</p>
          <Reveal>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
              {banks.map((bank) => (
                <div key={bank.name} className="grayscale opacity-50 hover:opacity-70 hover:grayscale-0 transition-all duration-300">
                  <img
                    src={`/banks/${bank.file}`}
                    alt={bank.name}
                    className="h-8 w-auto"
                  />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section className="pb-28 sm:pb-36">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-8">
          <Reveal>
            <h2 className="font-signifier text-[36px] sm:text-[44px] text-ink-black text-center mb-4" style={{ letterSpacing: "-0.66px" }}>
              See the full picture<br />
              <span className="italic">of your financial life</span>
            </h2>
            <p className="text-[15px] text-slate-gray text-center max-w-lg mx-auto mb-16">
              Connect every account you have. CONYEST unifies your banks, classifies your spending, and surfaces what matters.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <FeatureCard
              icon={Building2}
              title="Unify Every Bank"
              description="Upload statements from any Nigerian bank — GTBank, Access, UBA, Zenith, and more. One dashboard, all your accounts."
            />
            <FeatureCard
              icon={Sparkles}
              title="AI That Understands You"
              description="Transactions sorted into smart categories automatically. Ask questions like 'How much did I spend on food this month?' in plain English."
            />
            <FeatureCard
              icon={PieChart}
              title="Insights That Stick"
              description="Spending breakdowns, merchant rankings, recurring charges, cash flow trends — built to help you actually save more."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest py-20 sm:py-24">
        <div className="max-w-[700px] mx-auto px-4 sm:px-8 text-center">
          <Reveal>
            <h2 className="font-signifier text-[36px] sm:text-[44px] text-paper-white mb-5" style={{ letterSpacing: "-0.66px" }}>
              Stop wondering where<br />
              <span className="italic">your money went</span>
            </h2>
            <p className="text-[17px] text-white/70 max-w-lg mx-auto mb-8">
              Upload your first statement free. No credit card needed.
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