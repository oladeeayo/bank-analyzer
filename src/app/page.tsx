import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, FileSpreadsheet, PieChart, TrendingUp, ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-6 max-w-[1200px] mx-auto animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-forest-container rounded-buttons flex items-center justify-center text-white">
            <span className="font-bold text-lg">C</span>
          </div>
          <span className="font-signifier text-[22px] text-forest">CONYEST</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/login" className="text-sm text-slate-gray hover:text-forest transition-colors">
            Sign In
          </Link>
          <Link href="/register">
            <Button variant="default" size="sm" className="btn-lift">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section — Sleek */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-16 sm:pt-24 pb-16 text-center">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-mist-gray rounded-buttons px-4 py-1.5 mb-8 text-sm text-slate-gray">
            <Sparkles className="h-3.5 w-3.5 text-lime-vibrant" />
            <span>Financial Intelligence for Nigerians</span>
          </div>
        </div>
        <h1 className="font-signifier text-[40px] sm:text-[56px] md:text-[64px] leading-[1.3] text-ink-black mb-6 animate-fade-up animate-delay-100" style={{ letterSpacing: "-0.96px" }}>
          Financial intelligence<br />
          <span className="italic">for every naira</span>
        </h1>
        <p className="text-[17px] text-slate-gray max-w-xl mx-auto mb-10 leading-relaxed animate-fade-up animate-delay-200">
          Upload bank statements, track every transaction, and gain deep insights
          into your spending habits across all your Nigerian bank accounts.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up animate-delay-300">
          <Link href="/register">
            <Button variant="default" size="lg" className="gap-2 btn-lift w-full sm:w-auto">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="btn-lift w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Floating Product Artifacts */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-8 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1 */}
          <div className="bg-mist-gray rounded-cards p-6 sm:p-8 card-lift animate-fade-up animate-delay-100">
            <div className="w-12 h-12 bg-forest/10 rounded-xl flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-forest" />
            </div>
            <h3 className="text-[17px] font-semibold text-ink-black mb-2">Multi-Bank Support</h3>
            <p className="text-sm text-slate-gray leading-relaxed">
              Add all your banks — GTBank, Access, OPay, Kuda, Moniepoint, and 13 more Nigerian institutions.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-mist-gray rounded-cards p-6 sm:p-8 card-lift animate-fade-up animate-delay-200">
            <div className="w-12 h-12 bg-lime/10 rounded-xl flex items-center justify-center mb-4">
              <FileSpreadsheet className="h-6 w-6 text-lime" />
            </div>
            <h3 className="text-[17px] font-semibold text-ink-black mb-2">Smart Parsing</h3>
            <p className="text-sm text-slate-gray leading-relaxed">
              Upload CSV, Excel, or PDF statements with automatic format detection and normalization.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-mist-gray rounded-cards p-6 sm:p-8 card-lift animate-fade-up animate-delay-300 sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 bg-forest-container/10 rounded-xl flex items-center justify-center mb-4">
              <PieChart className="h-6 w-6 text-forest-container" />
            </div>
            <h3 className="text-[17px] font-semibold text-ink-black mb-2">Deep Analytics</h3>
            <p className="text-sm text-slate-gray leading-relaxed">
              Category breakdown, merchant ranking, spending velocity, and actionable financial insights.
            </p>
          </div>
        </div>
      </section>

      {/* Accent Peach Card — Editorial highlight */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-8 pb-16 sm:pb-24">
        <div className="bg-blush-peach rounded-cards p-8 sm:p-12 text-sienna-brown animate-scale-in">
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
            <div className="space-y-4">
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