// components/home/WhyChooseUs.tsx
import React from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button"; // ← using shadcn alias (recommended)
import { useNavigate } from "react-router-dom";
import { Zap, Star, Users, ArrowRight, Sparkles } from "lucide-react";

// Animation variants (can be imported from shared file or Home.tsx)
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
    transition: { staggerChildren: 0.18 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 35, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: "easeOut" },
  },
  hover: {
    y: -12,
    scale: 1.03,
    boxShadow: "0 20px 40px -10px rgba(16, 185, 129, 0.18)",
    transition: { duration: 0.35 },
  },
};

export default function WhyChooseUs() {
  const navigate = useNavigate();

  const reasons = [
    {
      icon: Zap,
      title: "Truly Remote & Flexible",
      description:
        "Work from anywhere — your bedroom, café, or hometown. No relocation, no commute, no rigid 9-to-5. Learn and build on your schedule.",
    },
    {
      icon: Star,
      title: "Measurable, Graded Progress",
      description:
        "Every task contributes to your level grade. Clear milestones, real feedback, and verifiable achievements that actually appear in your portfolio.",
    },
    {
      icon: Users,
      title: "Direct Industry Pathways",
      description:
        "Top performers get noticed. We connect strong graduates with freelance gigs, advanced projects, startup roles, and partner companies actively hiring.",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-white via-emerald-50/40 to-white relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.07),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={staggerContainer}
          className="text-center mb-16 md:mb-20"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-emerald-600" />
            <span className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
              Why Autiva?
            </span>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-emerald-950"
          >
            Real Skills. Real Progress. Real Opportunities.
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="mt-5 text-xl text-emerald-700/90 max-w-3xl mx-auto leading-relaxed"
          >
            We moved beyond traditional internships that waste your time.  
            Autiva gives you structure, proof of ability, and actual career acceleration.
          </motion.p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-8 lg:gap-10"
        >
          {reasons.map((reason, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover="hover"
              className="group relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-emerald-900/5 overflow-hidden transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-teal-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative p-8 md:p-10">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100/80 text-emerald-600 shadow-md">
                  <reason.icon className="h-8 w-8" />
                </div>

                <h3 className="text-2xl font-bold text-emerald-900 mb-4">
                  {reason.title}
                </h3>

                <p className="text-emerald-700/90 leading-relaxed text-[15.5px]">
                  {reason.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-16 md:mt-20 text-center"
        >
          <Button
            size="lg"
            className="group h-14 px-10 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-200/40 hover:shadow-emerald-300/50 transition-all duration-300"
            onClick={() => navigate("/auth")}
          >
            Start Building Your Future
            <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1.5" />
          </Button>

          <p className="mt-4 text-sm text-emerald-600/80">
            Free to apply • No credit card required
          </p>
        </motion.div>
      </div>
    </section>
  );
}