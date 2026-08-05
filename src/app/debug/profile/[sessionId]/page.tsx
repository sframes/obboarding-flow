"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { FounderProfile } from "@/lib/store";

export default function DebugProfile() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/profile/${sessionId}`);
        if (!res.ok) {
          throw new Error("Profile not found");
        }
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="font-mono text-muted text-sm">Loading profile…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-honey text-sm mb-2">{error || "Profile not found"}</p>
          <a href="/" className="text-xs font-mono text-muted hover:text-text">
            ← Back to onboarding
          </a>
        </div>
      </div>
    );
  }

  const fields: Array<{ key: string; label: string; value: unknown }> = [
    { key: "sessionId", label: "Session ID", value: profile.sessionId },
    { key: "stage", label: "Current Stage", value: profile.stage },
    { key: "industry", label: "Industry", value: profile.industry },
    { key: "industryConfidence", label: "Industry Confidence", value: profile.industryConfidence },
    { key: "rawDescription", label: "Raw Description", value: profile.rawDescription },
    { key: "differentiator", label: "Differentiator", value: profile.differentiator },
    { key: "sourcingModel", label: "Sourcing Model", value: profile.sourcingModel },
    { key: "currentChannel", label: "Current Channel", value: profile.currentChannel },
    { key: "currentTools", label: "Current Tools", value: profile.currentTools },
    { key: "wantsToConnectData", label: "Wants to Connect Data", value: profile.wantsToConnectData },
    { key: "recommendedAgents", label: "Recommended Agents", value: profile.recommendedAgents },
    { key: "columnMappings", label: "Column Mappings", value: profile.columnMappings },
    { key: "createdAt", label: "Created At", value: profile.createdAt },
    { key: "updatedAt", label: "Updated At", value: profile.updatedAt },
  ];

  return (
    <div className="min-h-screen bg-bg p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-text">
              Founder Profile
            </h1>
            <p className="text-xs font-mono text-muted mt-1">
              Debug view — structured data captured during onboarding
            </p>
          </div>
          <a
            href="/"
            className="text-xs font-mono text-muted hover:text-text transition-colors"
          >
            ← Back
          </a>
        </div>

        <div className="bg-surface border border-surface-2 rounded-xl overflow-hidden">
          <div className="border-b border-surface-2 px-5 py-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-growth" />
            <span className="text-xs font-mono text-muted">
              Stage: <span className="text-honey">{profile.stage}</span>
            </span>
          </div>

          <div className="divide-y divide-surface-2/50">
            {fields.map((field) => (
              <div
                key={field.key}
                className="px-5 py-3 flex flex-col md:flex-row md:items-start gap-1 md:gap-4"
              >
                <div className="md:w-48 flex-shrink-0">
                  <span className="text-xs font-mono text-muted">
                    {field.label}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  {field.value === null || field.value === undefined ? (
                    <span className="text-xs font-mono text-muted/40 italic">
                      not captured
                    </span>
                  ) : Array.isArray(field.value) && field.value.length > 0 && typeof field.value[0] === 'object' && field.value[0] !== null && 'internalField' in (field.value[0] as Record<string, unknown>) ? (
                  <div className="space-y-1.5">
                    {(field.value as Array<{ internalField: string; clientColumnName: string; confidence: string }>).map((mapping, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-honey bg-honey/10 px-2 py-0.5 rounded">{mapping.internalField}</span>
                        <span className="text-muted">→</span>
                        <span className="text-text">{mapping.clientColumnName || '(unmapped)'}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          mapping.confidence === 'auto-detected' ? 'text-growth bg-growth/10' :
                          mapping.confidence === 'user-confirmed' ? 'text-honey bg-honey/10' :
                          'text-muted bg-surface-2'
                        }`}>
                          {mapping.confidence}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : Array.isArray(field.value) ? (
                    <div className="flex flex-wrap gap-1.5">
                      {field.value.map((item, i) => (
                        <span
                          key={i}
                          className="text-xs font-mono text-honey bg-honey/10 px-2 py-0.5 rounded"
                        >
                          {String(item)}
                        </span>
                      ))}
                    </div>
                  ) : typeof field.value === "boolean" ? (
                    <span
                      className={`text-xs font-mono ${
                        field.value ? "text-growth" : "text-muted"
                      }`}
                    >
                      {String(field.value)}
                    </span>
                  ) : (
                    <span className="text-sm text-text break-words">
                      {String(field.value)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <details className="bg-surface border border-surface-2 rounded-xl overflow-hidden">
            <summary className="px-5 py-3 cursor-pointer text-xs font-mono text-muted hover:text-text transition-colors">
              Raw JSON
            </summary>
            <pre className="px-5 py-4 text-xs font-mono text-text/80 overflow-x-auto bg-bg/50">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
