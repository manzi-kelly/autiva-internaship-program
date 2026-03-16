// components/home/ProblemVsSolution.tsx
import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

// Shared variants (import from Home or create a lib/animations.ts)
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: "easeOut" },
  },
  hover: { y: -8, scale: 1.02, transition: { duration: 0.3 } },
};

export default function ProblemVsSolution() {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-white to-emerald-50/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Title */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-emerald-950"
          >
            Traditional Internships with Autiva Tech
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mt-4 text-xl text-emerald-700 max-w-3xl mx-auto"
          >
            See why students are switching to structured, remote skill-building that actually moves the needle on your career.
          </motion.p>
        </motion.div>

        {/* Comparison Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-8 lg:gap-12"
        >
          {/* Problem Card */}
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-red-50/80 to-rose-50/40 backdrop-blur-xl border border-red-100/50 shadow-xl shadow-red-900/5"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(239,68,68,0.08),transparent_50%)]" />
            <div className="relative p-8 md:p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-3xl font-bold text-red-800">The Problem</h3>
              </div>

              <ul className="space-y-5 text-red-800/90 text-lg">
                {[
                  "Forced to travel long distances just to show up",
                  "Spend hours waiting around with minimal actual work",
                  "Learn outdated tools or do repetitive coffee runs",
                  "No structured feedback, grades, or portfolio proof",
                  "Career progress feels random and slow",
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    variants={fadeInUp}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Solution Card */}
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-50/90 to-teal-50/50 backdrop-blur-xl border border-emerald-100/50 shadow-2xl shadow-emerald-900/10"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.08),transparent_50%)]" />
            <div className="relative p-8 md:p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="rounded-full bg-emerald-100 p-3">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-3xl font-bold text-emerald-800">The Autiva Solution</h3>
              </div>

              <ul className="space-y-5 text-emerald-800/90 text-lg">
                {[
                  "100% remote – work from your room, no commute stress",
                  "Structured levels with clear milestones & real deadlines",
                  "Hands-on modern tech: code, deploy, contribute to real projects",
                  "Earn verifiable grades + build a live portfolio employers love",
                  "Fast-track career growth with feedback & mentorship",
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    variants={fadeInUp}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    {item}
                  </motion.li>
                ))}
              </ul>

              {/* Optional CTA in solution card */}
              <motion.div
                variants={fadeInUp}
                className="mt-10 flex justify-start"
              >
                <a
                  href="#program-section"
                  className="group inline-flex items-center gap-2 text-lg font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  See How It Works
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </a>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}