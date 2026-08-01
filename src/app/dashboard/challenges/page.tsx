"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrophyIcon,
  FireIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  SparklesIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@/lib/hooks";

interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: "Easy" | "Medium" | "Hard";
  duration: string;
  expectedSavings: number;
  daysTotal: number;
}

interface ActiveChallenge {
  challengeId: string;
  startDate: string;
  checkIns: string[];
  completed: boolean;
}

interface ChallengeState {
  activeChallenge: ActiveChallenge | null;
  completedChallenges: string[];
  totalSaved: number;
  currentStreak: number;
  bestStreak: number;
}

const CHALLENGES: Challenge[] = [
  {
    id: "52-week",
    name: "52-Week Challenge",
    description: "Save ₦1,000 in week 1, ₦2,000 in week 2, up to ₦52,000 in week 52",
    icon: "📅",
    difficulty: "Hard",
    duration: "52 weeks",
    expectedSavings: 1378000,
    daysTotal: 364,
  },
  {
    id: "no-spend-weekend",
    name: "No-Spend Weekend",
    description: "Don't spend on weekends for a month",
    icon: "🚫",
    difficulty: "Medium",
    duration: "1 month",
    expectedSavings: 24000,
    daysTotal: 30,
  },
  {
    id: "500-daily",
    name: "₦500 Daily",
    description: "Save ₦500 every day for 30 days",
    icon: "💰",
    difficulty: "Easy",
    duration: "30 days",
    expectedSavings: 15000,
    daysTotal: 30,
  },
  {
    id: "round-up",
    name: "Round-Up Savings",
    description: "Save the difference when amounts are rounded up",
    icon: "🔄",
    difficulty: "Easy",
    duration: "30 days",
    expectedSavings: 8000,
    daysTotal: 30,
  },
  {
    id: "coffee-cut",
    name: "Coffee Cut",
    description: "Skip buying coffee or drinks for 2 weeks",
    icon: "☕",
    difficulty: "Easy",
    duration: "2 weeks",
    expectedSavings: 10000,
    daysTotal: 14,
  },
  {
    id: "transport-saver",
    name: "Transport Saver",
    description: "Walk or use cheaper transport options for a week",
    icon: "🚶",
    difficulty: "Medium",
    duration: "1 week",
    expectedSavings: 7000,
    daysTotal: 7,
  },
];

const STORAGE_KEY = "savings-challenges-state";

const difficultyColors: Record<string, string> = {
  Easy: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-red-100 text-red-700",
};

export default function ChallengesPage() {
  const { user, loading: userLoading } = useUser();
  const [state, setState] = useState<ChallengeState>({
    activeChallenge: null,
    completedChallenges: [],
    totalSaved: 0,
    currentStreak: 0,
    bestStreak: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState({
          activeChallenge: parsed.activeChallenge || null,
          completedChallenges: parsed.completedChallenges || [],
          totalSaved: parsed.totalSaved || 0,
          currentStreak: parsed.currentStreak || 0,
          bestStreak: parsed.bestStreak || 0,
        });
      } catch {
        // ignore
      }
    }
  }, []);

  const persistState = useCallback((next: ChallengeState) => {
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  if (userLoading || !user) {
    return (
      <div className="space-y-8">
        <div className="h-9 w-64 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-paper-white border-[#ececec]">
              <CardContent className="p-6 space-y-3">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  const activeChallenge = CHALLENGES.find(
    (c) => c.id === state.activeChallenge?.challengeId
  );

  const daysCompleted = state.activeChallenge?.checkIns.length || 0;
  const progressPct =
    activeChallenge && activeChallenge.daysTotal > 0
      ? Math.min((daysCompleted / activeChallenge.daysTotal) * 100, 100)
      : 0;

  const daysRemaining =
    activeChallenge && state.activeChallenge
      ? Math.max(
          activeChallenge.daysTotal -
            daysCompleted -
            (new Date(today).getTime() -
              new Date(state.activeChallenge.startDate).getTime()) /
              (1000 * 60 * 60 * 24),
          0
        )
      : 0;

  const alreadyCheckedIn =
    state.activeChallenge?.checkIns.includes(today) || false;

  const handleCheckIn = () => {
    if (!state.activeChallenge || alreadyCheckedIn) return;
    const checkIns = [...state.activeChallenge.checkIns, today];

    const challenge = CHALLENGES.find(
      (c) => c.id === state.activeChallenge?.challengeId
    );
    const isCompleted = checkIns.length >= (challenge?.daysTotal || 0);

    const updated: ChallengeState = {
      ...state,
      activeChallenge: {
        ...state.activeChallenge,
        checkIns,
        completed: isCompleted,
      },
      totalSaved: state.totalSaved + 500,
      currentStreak: state.currentStreak + 1,
      bestStreak: Math.max(state.bestStreak, state.currentStreak + 1),
    };

    if (isCompleted) {
      updated.completedChallenges = [
        ...state.completedChallenges,
        state.activeChallenge.challengeId,
      ];
      updated.activeChallenge = null;
    }

    persistState(updated);
  };

  const handleStartChallenge = (challengeId: string) => {
    const newState: ChallengeState = {
      ...state,
      activeChallenge: {
        challengeId,
        startDate: today,
        checkIns: [],
        completed: false,
      },
    };
    persistState(newState);
  };

  const handleAbandonChallenge = () => {
    persistState({
      ...state,
      activeChallenge: null,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink-black font-signifier">
          Savings Challenges
        </h1>
        <p className="text-ash-gray mt-1">Build your savings habit</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-paper-white border-[#ececec]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest/10">
              <TrophyIcon className="h-6 w-6 text-forest" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink-black font-mono">
                {formatCurrency(state.totalSaved)}
              </p>
              <p className="text-xs text-ash-gray">Total Saved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-paper-white border-[#ececec]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <FireIcon className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink-black font-mono">
                {state.currentStreak}
              </p>
              <p className="text-xs text-ash-gray">Current Streak</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-paper-white border-[#ececec]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-vibrant/20">
              <CheckCircleIcon className="h-6 w-6 text-forest" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink-black font-mono">
                {state.completedChallenges.length}
              </p>
              <p className="text-xs text-ash-gray">Challenges Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeChallenge && state.activeChallenge && (
        <Card className="bg-paper-white border-[#ececec] overflow-hidden">
          <div className="bg-gradient-to-r from-forest to-emerald-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{activeChallenge.icon}</span>
                <div>
                  <h2 className="text-xl font-bold text-white font-signifier">
                    {activeChallenge.name}
                  </h2>
                  <p className="text-emerald-100 text-sm">
                    {activeChallenge.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-lime-vibrant">
                  <FireIcon className="h-5 w-5" />
                  <span className="font-bold font-mono text-lg">
                    {state.activeChallenge.checkIns.length}
                  </span>
                  <span className="text-emerald-100 text-sm">days</span>
                </div>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-1">
                <p className="text-xs text-ash-gray uppercase tracking-wide">
                  Progress
                </p>
                <p className="text-2xl font-bold text-ink-black font-mono">
                  {progressPct.toFixed(0)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-ash-gray uppercase tracking-wide">
                  Days Remaining
                </p>
                <p className="text-2xl font-bold text-ink-black font-mono">
                  {Math.ceil(daysRemaining)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-ash-gray uppercase tracking-wide">
                  Current Streak
                </p>
                <div className="flex items-center gap-1">
                  <FireIcon className="h-5 w-5 text-orange-500" />
                  <p className="text-2xl font-bold text-ink-black font-mono">
                    {state.currentStreak}
                  </p>
                </div>
              </div>
            </div>
            <Progress value={progressPct} className="h-3 mb-6" />
            <div className="flex gap-3">
              <Button
                onClick={handleCheckIn}
                disabled={alreadyCheckedIn}
                className="bg-forest hover:bg-forest/90 text-white rounded-buttons font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {alreadyCheckedIn ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Checked In Today
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Check In Today
                  </>
                )}
              </Button>
              <Button
                onClick={handleAbandonChallenge}
                variant="outline"
                className="rounded-buttons text-ash-gray border-[#ececec] hover:bg-gray-50"
              >
                Abandon
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-bold text-ink-black mb-4 font-signifier">
          {activeChallenge ? "Other Challenges" : "Available Challenges"}
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {CHALLENGES.map((challenge) => {
            const isActive =
              state.activeChallenge?.challengeId === challenge.id;
            const isCompleted = state.completedChallenges.includes(
              challenge.id
            );
            const canStart = !state.activeChallenge && !isCompleted;

            return (
              <Card
                key={challenge.id}
                className={`bg-paper-white border-[#ececec] hover:shadow-lg transition-shadow relative ${
                  isActive ? "ring-2 ring-forest" : ""
                }`}
              >
                {isCompleted && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-lime-vibrant/20 text-forest">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                )}
                {isActive && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-forest text-white">
                      Active
                    </Badge>
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="text-4xl mb-3">{challenge.icon}</div>
                  <h3 className="font-bold text-ink-black text-lg mb-1">
                    {challenge.name}
                  </h3>
                  <p className="text-sm text-ash-gray mb-4 line-clamp-2">
                    {challenge.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-buttons text-[10px] font-semibold uppercase ${difficultyColors[challenge.difficulty]}`}
                    >
                      {challenge.difficulty}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-buttons text-[10px] font-semibold uppercase bg-gray-100 text-gray-600">
                      <CalendarDaysIcon className="h-3 w-3" />
                      {challenge.duration}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-ash-gray">Expected Savings</p>
                      <p className="text-lg font-bold text-forest font-mono">
                        {formatCurrency(challenge.expectedSavings)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-ash-gray">Duration</p>
                      <p className="text-sm font-medium text-ink-black font-mono">
                        {challenge.daysTotal} days
                      </p>
                    </div>
                  </div>
                  {!isCompleted && (
                    <Button
                      onClick={() => handleStartChallenge(challenge.id)}
                      disabled={!canStart}
                      className={`w-full rounded-buttons font-semibold ${
                        isActive
                          ? "bg-forest text-white"
                          : canStart
                          ? "bg-forest hover:bg-forest/90 text-white"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {isActive ? (
                        "In Progress"
                      ) : canStart ? (
                        <>
                          <BoltIcon className="h-4 w-4 mr-1" />
                          Start Challenge
                        </>
                      ) : (
                        "Complete Active First"
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {state.completedChallenges.length > 0 && (
        <Card className="bg-paper-white border-[#ececec]">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-vibrant/20">
                <TrophyIcon className="h-5 w-5 text-forest" />
              </div>
              <div>
                <h3 className="font-bold text-ink-black font-signifier">
                  Achievement Badges
                </h3>
                <p className="text-xs text-ash-gray">
                  {state.completedChallenges.length} challenge
                  {state.completedChallenges.length !== 1 ? "s" : ""} completed
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {state.completedChallenges.map((id) => {
                const challenge = CHALLENGES.find((c) => c.id === id);
                if (!challenge) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 bg-lime-vibrant/10 border border-lime-vibrant/30 rounded-buttons px-3 py-2"
                  >
                    <span className="text-lg">{challenge.icon}</span>
                    <span className="text-sm font-medium text-forest">
                      {challenge.name}
                    </span>
                    <CheckCircleIcon className="h-4 w-4 text-forest" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
