// components/home/HeroSection.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button"; // adjust alias if needed
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ── Variants ────────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 18, stiffness: 120, duration: 0.8 },
  },
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] },
  },
};

const buttonVariants = {
  hover: { scale: 1.05, transition: { duration: 0.3 } },
  tap: { scale: 0.97 },
};

const badgeVariants = {
  initial: { opacity: 0, y: 12, scale: 0.92 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.92,
    transition: { duration: 0.5, ease: "easeIn" },
  },
};

interface HeroSectionProps {
  projectLevel?: "L3" | "L4" | "L5";
}

export default function HeroSection({ projectLevel }: HeroSectionProps) {
  const navigate = useNavigate();

  const levels = [
    { key: "L3", text: "Level 3 Project • Foundation Portfolio" },
    { key: "L4", text: "Level 4 Project • Advanced Portfolio" },
    { key: "L5", text: "Level 5 Project • Live Portfolio" },
  ];

  const [activeIndex, setActiveIndex] = useState(2); // start at L5
  const [isHovered, setIsHovered] = useState(false); // ← new: hover state

  useEffect(() => {
    if (projectLevel) {
      const index = levels.findIndex((l) => l.key === projectLevel);
      if (index !== -1) setActiveIndex(index);
      return;
    }

    if (isHovered) return; // pause cycling when hovered

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % levels.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [projectLevel, isHovered]); // re-run when hover changes

  const currentLevel = levels[activeIndex];

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50/40"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.08),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-28 lg:py-36 lg:px-8">
        <motion.div
          className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left column – unchanged */}
          <div className="space-y-8">
            <motion.h1
              variants={itemVariants}
              className="text-5xl font-extrabold tracking-tight text-emerald-950 md:text-6xl lg:text-7xl leading-tight"
            >
              Stop Wasting Time on Fake Internships.
              <br />
              <motion.span
                variants={itemVariants}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
              >
                Build Real Skills — Remotely.
              </motion.span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="max-w-xl text-xl text-emerald-800/90 md:text-2xl leading-relaxed"
            >
              No travel. No waiting. No filler tasks.
              <br className="hidden sm:inline" />
              Structured levels → real grades → portfolio projects → actual career progress.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-5">
              <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                <Button
                  size="lg"
                  className="group bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-7 text-lg font-semibold shadow-lg shadow-emerald-200/50 hover:from-emerald-700 hover:to-teal-700 hover:shadow-emerald-300/40 transition-all duration-300"
                  onClick={() => navigate("/auth")}
                >
                  Apply Now – Free
                  <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </motion.div>

              <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-emerald-200 px-8 py-7 text-lg font-medium text-emerald-700 hover:bg-emerald-50/80 hover:text-emerald-800 transition-colors"
                  onClick={() => document.getElementById("program-section")?.scrollIntoView({ behavior: "smooth" })}
                >
                  See How It Works
                </Button>
              </motion.div>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-sm text-emerald-700/80 flex items-center gap-2 mt-4"
            >
              <Sparkles className="h-4 w-4 text-emerald-500" />
              Already helped 1,200+ students land better roles
            </motion.p>
          </div>

          {/* Right column with cycling badge */}
          <motion.div className="relative hidden lg:block" variants={imageVariants}>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-emerald-900/20 border border-emerald-100/50 bg-white/30 backdrop-blur-sm">
              <img
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2400"
                alt="Student building real projects remotely"
                className="w-full h-auto object-cover"
              />

              <div className="absolute bottom-6 left-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentLevel.key}
                    variants={badgeVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="rounded-full bg-white/70 backdrop-blur-md px-5 py-2.5 text-sm font-medium text-emerald-800 shadow-md"
                  >
                    {currentLevel.text}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}