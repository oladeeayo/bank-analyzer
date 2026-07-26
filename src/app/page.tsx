import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, FileSpreadsheet, PieChart, TrendingUp, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-forest-container rounded-buttons flex items-center justify-center text-white">
            <span className="font-bold text-lg">C</span>
          </div>
          <span className="font-signifier text-[22px] text-forest">CONYEST</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-slate-gray hover:text-forest transition-colors">
            Sign In
          </Link>
          <Link href="/register">
            <Button variant="default" size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section — Steep editorial style */}
      <section className="max-w-[1200px] mx-auto px-8 py-24 text-center">
        <h1 className="font-signifier text-[64px] leading-[1.3] text-ink-black mb-6" style={{ letterSpacing: "-0.96px" }}>
          Financial intelligence<br />
          <span className="italic">for every naira</span>
        </h1>
        <p className="text-[17px] text-slate-gray max-w-xl mx-auto mb-10 leading-relaxed">
          Upload bank statements, track every transaction, and gain deep insights
          into your spending habits across all your Nigerian bank accounts.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button variant="default" size="lg" className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Floating Product Artifacts — Steep hero collage style */}
      <section className="max-w-[1200px] mx-auto px-8 pb-24">
        <div className="grid grid-cols-3 gap-6">
          {/* Card 1 — Bank Support */}
          <div className="bg-mist-gray rounded-cards p-8">
            <Building2 className="h-10 w-10 text-forest mb-4" />
            <h3 className="text-[17px] font-semibold text-ink-black mb-2">Multi-Bank Support</h3>
            <p className="text-sm text-slate-gray leading-relaxed">
              Add all your banks — GTBank, Access, OPay, Kuda, Moniepoint, and 13 more Nigerian institutions.
            </p>
          </div>

          {/* Card 2 — Smart Parsing */}
          <div className="bg-mist-gray rounded-cards p-8">
            <FileSpreadsheet className="h-10 w-10 text-lime mb-4" />
            <h3 className="text-[17px] font-semibold text-ink-black mb-2">Smart Parsing</h3>
            <p className="text-sm text-slate-gray leading-relaxed">
              Upload CSV, Excel, or PDF statements with automatic format detection and normalization.
            </p>
          </div>

          {/* Card 3 — Deep Analytics */}
          <div className="bg-mist-gray rounded-cards p-8">
            <PieChart className="h-10 w-10 text-forest-container mb-4" />
            <h3 className="text-[17px] font-semibold text-ink-black mb-2">Deep Analytics</h3>
            <p className="text-sm text-slate-gray leading-relaxed">
              Category breakdown, merchant ranking, spending velocity, and actionable financial insights.
            </p>
          </div>
        </div>
      </section>

      {/* Accent Peach Card — Editorial highlight */}
      <section className="max-w-[1200px] mx-auto px-8 pb-24">
        <div className="bg-blush-peach rounded-cards p-12 text-sienna-brown">
          <div className="grid grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-signifier text-[36px] leading-[1.3] mb-4" style={{ letterSpacing: "-0.66px" }}>
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
            <div className="space-y-4">
              <div className="bg-white/60 rounded-xl p-4 flex items-center gap-4">
                <TrendingUp className="h-8 w-8 text-forest" />
                <div>
                  <p className="font-semibold text-sm">Track Inflows & Outflows</p>
                  <p className="text-xs opacity-70">See where every naira goes</p>
                </div>
              </div>
              <div className="bg-white/60 rounded-xl p-4 flex items-center gap-4">
                <span className="text-2xl">🔄</span>
                <div>
                  <p className="font-semibold text-sm">Self-Transfer Detection</p>
                  <p className="text-xs opacity-70">Automatically identify internal moves</p>
                </div>
              </div>
              <div className="bg-white/60 rounded-xl p-4 flex items-center gap-4">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-semibold text-sm">Monthly Reports</p>
                  <p className="text-xs opacity-70">Beautiful spending summaries</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ececec] py-8 px-8">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
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
