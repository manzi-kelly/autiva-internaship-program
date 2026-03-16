import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

export default function ProblemVsSolution() {
  return (
    <section id="about-section" className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-12 md:grid-cols-2">
        {/* Old way */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-rose-500" />
            <h2 className="text-2xl font-bold text-rose-900">The Old Way</h2>
          </div>
          <ul className="mt-6 space-y-4">
            <li className="flex gap-3 text-rose-800">
              <span className="font-bold">•</span>
              Pay for travel and accommodation, only to sit idle
            </li>
            <li className="flex gap-3 text-rose-800">
              <span className="font-bold">•</span>
              No structured learning – you're just another intern
            </li>
            <li className="flex gap-3 text-rose-800">
              <span className="font-bold">•</span>
              Leave with no tangible skills, no better than others
            </li>
          </ul>
        </div>

        {/* Autiva Way */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
            <h2 className="text-2xl font-bold text-emerald-900">The Autiva Way</h2>
          </div>
          <ul className="mt-6 space-y-4">
            <li className="flex gap-3 text-emerald-800">
              <span className="font-bold">•</span>
              Remote, structured program – learn from home
            </li>
            <li className="flex gap-3 text-emerald-800">
              <span className="font-bold">•</span>
              Levels L3 → L5, each with real projects
            </li>
            <li className="flex gap-3 text-emerald-800">
              <span className="font-bold">•</span>
              Get graded, unlock advanced tasks, build portfolio
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}