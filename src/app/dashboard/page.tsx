"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { FounderProfile } from "@/lib/store";

const CAMPAIGN_ROWS = [
  { name: "Instagram Launch Push", status: "Completed", cost: "$220" },
  { name: "Ads Bee Setup", status: "Completed", cost: "$150" },
  { name: "Retarget Warm Audience", status: "Pending", cost: "$180" },
  { name: "New Collection Teaser", status: "Completed", cost: "$120" },
  { name: "Founder Story Reel", status: "Pending", cost: "$90" },
];

const CHANNEL_DATA = [
  { month: "Jan", call: 60, email: 40, whatsapp: 30 },
  { month: "Feb", call: 90, email: 70, whatsapp: 50 },
  { month: "Mar", call: 120, email: 90, whatsapp: 60 },
  { month: "Apr", call: 200, email: 140, whatsapp: 90 },
  { month: "May", call: 260, email: 180, whatsapp: 120 },
];

const TAGS = [
  { label: "High Cost", value: 400, color: "bg-growth" },
  { label: "High Demand", value: 350, color: "bg-honey" },
  { label: "New Leads", value: 280, color: "bg-yellow-300" },
  { label: "Re-engagement", value: 200, color: "bg-orange-400" },
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const [profile, setProfile] = useState<FounderProfile | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/profile/${sessionId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProfile(data))
      .catch(() => setProfile(null));
  }, [sessionId]);

  const industryLabel = profile?.industry || "your business";
  const agents =
    profile?.recommendedAgents && profile.recommendedAgents.length > 0
      ? profile.recommendedAgents
      : ["Ads Bee"];
  const channel = profile?.currentChannel || "Instagram";
  const maxChannel = Math.max(...CHANNEL_DATA.map((d) => d.call));

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-sidebar text-white/80 min-h-screen">
        <div className="px-5 py-5 flex items-center gap-2">
          <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
            <svg width="28" height="28" viewBox="0 0 32 32">
              <polygon
                points="16,2 29,9 29,23 16,30 3,23 3,9"
                fill="none"
                stroke="#F4C10F"
                strokeWidth="2"
              />
              <polygon
                points="16,8 23,12 23,20 16,24 9,20 9,12"
                fill="#F4C10F"
                opacity="0.6"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">beesz</p>
            <p className="text-[9px] font-mono text-white/40 mt-0.5 tracking-wide">
              YOUR DIGITAL WORKERS
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 text-sm overflow-y-auto">
          <NavItem label="Overview" active icon="grid" />
          <NavItem label="Leaderboard" icon="trophy" />

          <NavSection label="LEXI" />
          <NavItem label="Campaigns" icon="chart" />
          <div className="pl-8 space-y-0.5 text-white/40 text-xs">
            <p className="py-1">All Campaigns</p>
            <p className="py-1">Build with Lexi</p>
            <p className="py-1">Create with Template</p>
            <p className="py-1">Start from Scratch</p>
          </div>

          <NavSection label="KRIDHA" />
          {agents.map((agent) => (
            <NavItem key={agent} label={agent} icon="bot" />
          ))}
          <div className="pl-8 space-y-0.5 text-white/40 text-xs">
            <p className="py-1">All</p>
            <p className="py-1">Calling</p>
            <p className="py-1">WhatsApp</p>
            <p className="py-1">Email</p>
          </div>

          <NavSection label="ECHO" />
          <NavItem label="Operations" icon="ops" />
          <div className="pl-8 space-y-0.5 text-white/40 text-xs">
            <p className="py-1">CRM Sync</p>
          </div>
        </nav>

        <div className="px-4 py-4 border-t border-white/10 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-honey flex items-center justify-center text-sidebar text-xs font-bold flex-shrink-0">
            N
          </div>
          <div className="min-w-0">
            <p className="text-xs text-white truncate">Naman&apos;s Team</p>
            <p className="text-[10px] text-white/40">Pro workspace</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 px-5 md:px-8 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-text">Dashboard</h1>
            <p className="text-xs font-mono text-muted mt-1">
              An easy way to manage {industryLabel.toLowerCase()} sales with care and precision.
            </p>
          </div>
          <div className="text-xs font-mono text-muted bg-surface border border-surface-2 rounded-full px-4 py-2">
            January 2024 — May 2024
          </div>
        </div>

        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-sidebar text-white rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-honey mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-honey" /> Update
              </span>
              <p className="text-sm leading-snug">
                Sales revenue increased{" "}
                <span className="text-honey font-semibold">40%</span> in 1 week
              </p>
            </div>
            <p className="text-[11px] font-mono text-white/50 mt-4">See Statistics →</p>
          </div>

          <StatCard label="Total Leads" value="1,200" icon="user" delta="+18%" positive />
          <StatCard label="Total Cost" value="$10,000" icon="wallet" delta="-24%" positive={false} />

          <div className="bg-surface border border-surface-2 rounded-2xl p-5 flex flex-col items-center justify-center">
            <p className="text-xs font-mono text-muted mb-2 self-start">Disposition breakdown</p>
            <Donut />
            <div className="flex items-center gap-3 mt-3 text-[10px] font-mono text-muted flex-wrap justify-center">
              <Legend color="bg-honey" label="Interested" />
              <Legend color="bg-orange-300" label="Cold" />
              <Legend color="bg-surface-2" label="Callback" />
              <Legend color="bg-sidebar" label="Dead" />
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Campaign Activity */}
          <div className="bg-surface border border-surface-2 rounded-2xl p-5">
            <p className="text-xs font-mono text-muted mb-3">Campaign Activity</p>
            <div className="space-y-3">
              {CAMPAIGN_ROWS.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-bg border border-surface-2 flex items-center justify-center text-[10px] flex-shrink-0">
                      🐝
                    </div>
                    <p className="text-xs text-text truncate">{c.name}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        c.status === "Completed"
                          ? "text-growth bg-growth/10"
                          : "text-deep-honey bg-honey/10"
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="text-xs font-mono text-muted w-10 text-right">
                      {c.cost}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Channel Activity + Tags */}
          <div className="flex flex-col gap-4">
            <div className="bg-surface border border-surface-2 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-mono text-muted">Channel Activity</p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-muted">
                  <Legend color="bg-sidebar" label="Call" />
                  <Legend color="bg-honey" label="Email" />
                  <Legend color="bg-orange-300" label={channel} />
                </div>
              </div>
              <div className="flex items-end justify-between gap-2 h-36">
                {CHANNEL_DATA.map((d) => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center gap-0.5 h-28">
                      <div
                        className="w-1.5 bg-sidebar rounded-t"
                        style={{ height: `${(d.call / maxChannel) * 100}%` }}
                      />
                      <div
                        className="w-1.5 bg-honey rounded-t"
                        style={{ height: `${(d.email / maxChannel) * 100}%` }}
                      />
                      <div
                        className="w-1.5 bg-orange-300 rounded-t"
                        style={{ height: `${(d.whatsapp / maxChannel) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-muted">{d.month}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface border border-surface-2 rounded-2xl p-5">
              <p className="text-xs font-mono text-muted mb-3">Tags</p>
              <div className="space-y-2.5">
                {TAGS.map((t) => (
                  <div key={t.label}>
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted mb-1">
                      <span>{t.label}</span>
                      <span>{t.value}</span>
                    </div>
                    <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                      <div
                        className={`h-full ${t.color} rounded-full`}
                        style={{ width: `${(t.value / 400) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-sidebar text-white rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-honey mb-3">
                🐝 Beesz Recommendations
              </span>
              <p className="text-sm leading-snug text-white/80">
                {profile?.differentiator
                  ? `Since you mentioned "${profile.differentiator}", `
                  : ""}
                moving your {channel} follow-up to within 5 minutes could lift response
                rate by 3x.
              </p>
            </div>
            <button className="mt-4 bg-honey text-sidebar text-xs font-mono font-semibold px-4 py-2 rounded-full self-start hover:bg-honey/90 transition-colors">
              View Recommendations
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavSection({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-mono text-white/30 tracking-wide pt-3 pb-1 px-2">
      {label}
    </p>
  );
}

function NavItem({
  label,
  icon,
  active,
}: {
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-default ${
        active ? "bg-honey text-sidebar font-medium" : "text-white/70"
      }`}
    >
      <span className="text-xs">{iconFor(icon)}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}

function iconFor(icon: string) {
  switch (icon) {
    case "grid":
      return "▦";
    case "trophy":
      return "🏆";
    case "chart":
      return "📈";
    case "bot":
      return "🐝";
    case "ops":
      return "⚙";
    default:
      return "•";
  }
}

function StatCard({
  label,
  value,
  delta,
  positive,
}: {
  label: string;
  value: string;
  icon: string;
  delta: string;
  positive: boolean;
}) {
  return (
    <div className="bg-surface border border-surface-2 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-muted">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-text">{value}</p>
      <p
        className={`text-[11px] font-mono mt-1 ${
          positive ? "text-growth" : "text-red-500"
        }`}
      >
        {positive ? "↗" : "↘"} {delta} from last month
      </p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function Donut() {
  return (
    <div
      className="w-28 h-28 rounded-full flex items-center justify-center"
      style={{
        background:
          "conic-gradient(#F4C10F 0% 58%, #FDBA74 58% 81%, #EAE7E0 81% 94%, #0B0B0B 94% 100%)",
      }}
    >
      <div className="w-16 h-16 rounded-full bg-surface flex flex-col items-center justify-center">
        <p className="text-[8px] font-mono text-muted leading-none">TOTAL COUNT</p>
        <p className="text-sm font-semibold text-text leading-tight">565K</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex items-center justify-center">
          <p className="font-mono text-muted text-sm">Loading dashboard…</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
