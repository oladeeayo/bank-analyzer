import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Building2, FileSpreadsheet, PieChart, TrendingUp } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Bank Analyzer
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Personal finance intelligence. Upload bank statements, track every transaction,
            and gain deep insights into your spending habits.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                Get Started <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-white border-slate-600 hover:bg-slate-700">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Building2 className="h-10 w-10 text-emerald-400 mb-2" />
              <CardTitle className="text-white">Multi-Bank Support</CardTitle>
              <CardDescription className="text-slate-300">
                Add all your banks - GTBank, Access, OPay, Kuda, and more
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <FileSpreadsheet className="h-10 w-10 text-blue-400 mb-2" />
              <CardTitle className="text-white">Smart Parsing</CardTitle>
              <CardDescription className="text-slate-300">
                Upload CSV, Excel, or PDF statements with automatic normalization
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <PieChart className="h-10 w-10 text-purple-400 mb-2" />
              <CardTitle className="text-white">Deep Analytics</CardTitle>
              <CardDescription className="text-slate-300">
                Category breakdown, merchant ranking, and spending insights
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-8 text-slate-400">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Track Inflows & Outflows</p>
            </div>
            <div className="text-center">
              <span className="text-3xl">🔄</span>
              <p className="text-sm mt-2">Self-Transfer Detection</p>
            </div>
            <div className="text-center">
              <span className="text-3xl">📊</span>
              <p className="text-sm mt-2">Monthly Reports</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
