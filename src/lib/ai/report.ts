import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ReportData {
  summary: {
    currentBalance: number;
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    savingsRate: number;
    averageDailySpend: number;
  };
  periodLabel: string;
  transactionCount: number;
  categoryBreakdown: { name: string; icon: string; amount: number; count: number }[];
  merchantRanking: { name: string; amount: number; count: number }[];
  recurringExpenses: { description: string; avgAmount: number; frequency: string }[];
  biggestExpense: { amount: number; description: string; merchant: string } | null;
  topIncomeCategories: { name: string; amount: number }[];
  budgetHealth: { category: string; limit: number; spent: number }[];
  goals: { name: string; targetAmount: number; currentAmount: number }[];
}

export interface AIReport {
  overview: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  savingsOpportunities: string[];
  spendingPattern: string;
  nextSteps: string[];
}

const REPORT_PROMPT = `You are a Nigerian financial analyst. Review the user's financial data and generate a clear, useful financial report.

Write in plain English. Be direct and specific. Use Nigerian naira (₦) when mentioning amounts.

Return JSON only:
{
  "overview": "2-3 sentence summary of their financial situation",
  "strengths": ["3-5 positive observations about their finances"],
  "concerns": ["2-4 areas that need attention"],
  "recommendations": ["3-5 specific, actionable recommendations"],
  "savingsOpportunities": ["2-3 specific ways they could save more"],
  "spendingPattern": "2-3 sentence analysis of their spending pattern",
  "nextSteps": ["3-4 concrete actions to take"]
}`;

export async function generateReport(data: ReportData): Promise<AIReport> {
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
  const result = await model.generateContent(`${REPORT_PROMPT}\n\nFinancial Data:\n${JSON.stringify(data, null, 2)}`);
  const text = result.response.text();
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) throw new Error("No JSON found in AI response");
  return JSON.parse(jsonMatch[1] || jsonMatch[0]);
}