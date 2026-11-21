"use strict";
"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface ChartsSectionProps {
  categoryData: Array<{ name: string; count: number }>;
  severityData: Array<{ name: string; count: number }>;
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#f59e0b",
  Low: "#10b981",
};

export function ChartsSection({ categoryData, severityData }: ChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Category Breakdown (Bar Chart) */}
      <div className="lg:col-span-2 glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold text-white">Tickets by Civic Category</h4>
            <p className="text-xs text-slate-400">Distribution across municipal divisions</p>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            Real-time Telemetry
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#f8fafc",
                }}
              />
              <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Severity Breakdown (Donut Chart) */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold text-white">Severity Split</h4>
            <p className="text-xs text-slate-400">Priority triage distribution</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="count"
              >
                {severityData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={SEVERITY_COLORS[entry.name] || "#64748b"}
                    stroke="#0f172a"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#f8fafc",
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
