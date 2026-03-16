// components/home/HowItWorks.tsx
import React from "react";
import { motion } from "framer-motion";
import { GraduationCap, Briefcase, TrendingUp } from "lucide-react";

// Reusable variants (import from Home.tsx or shared file)
const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const stepVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
  hover: { y: -10, scale: 1.04, transition: { duration: 0.3 } },
};

export default function HowItWorks() {
  const steps = [
    {
      icon: GraduationCap,
      title: "Choose Your Starting Level",
      description:
        "Begin at L3, L4, or L5 based on your current skills. Each level delivers structured lessons, modern tools, and hands-on challenges tailored to your growth.",
    },
    {
      icon: Briefcase,
      title: "Master Tasks & Earn Grades",
      description:
        "Complete sessions, submit practical tasks, and receive detailed feedback. Your performance translates into real grades that build your verifiable credentials.",
    },
    {
      icon: TrendingUp,
      title: "Unlock Real Opportunities",
      description:
        "Higher grades open advanced projects, freelance gigs, portfolio features, and job referral pathways. Your progress directly accelerates your career.",
    },
  ];

  return (
    <section id="program-section" className="py-24 md:py-32 bg-gradient-to-b from-emerald-50/50 to-white relative overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.06),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="text-center mb-16 md:mb-20"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-emerald-950"
          >
            How Autiva Works
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mt-5 text-xl md:text-2xl text-emerald-700/90 max-w-3xl mx-auto leading-relaxed"
          >
            A clear, rewarding path: select your level → build real skills → earn grades → unlock career momentum.
          </motion.p>
        </motion.div>

        {/* Timeline Steps */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="relative"
        >
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-20 left-1/2 right-1/2 h-0.5 bg-gradient-to-r from-emerald-200 via-teal-300 to-emerald-200 transform -translate-y-1/2" />

          <div className="grid md:grid-cols-3 gap-10 md:gap-6 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={stepVariants}
                whileHover="hover"
                className="relative group"
              >
                {/* Number + Icon Circle */}
                <div className="relative mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-400/20 blur-xl group-hover:blur-2xl transition-all duration-500" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg shadow-emerald-200/30 border border-emerald-100 mx-auto">
                    <step.icon className="h-10 w-10 text-emerald-600" />
                  </div>
                  <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                    {index + 1}
                  </div>
                </div>

                {/* Glass Card */}
                <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl shadow-emerald-900/5 p-8 text-center transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-emerald-200/20">
                  <h3 className="text-2xl font-bold text-emerald-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-emerald-700/90 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Mobile connector arrow (optional) */}
                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center my-8">
                    <div className="h-16 w-0.5 bg-emerald-200" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}