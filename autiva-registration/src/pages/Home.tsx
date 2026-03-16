// pages/Home.tsx (or src/pages/Home.tsx)
import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import HeroSection from "../components/home/HeroSection";
import { useNavigate } from "react-router-dom";

// Import other sections
import ProblemVsSolution from "../components/home/solve";
import HowItWorks from "../components/home/HowItWorks";
import WhyChooseUs from "../components/home/WhyChooseUs";

// Reusable animation variants
export const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

export const staggerContainer = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection projectLevel="L5" />

        {/* Problem vs Solution */}
        <motion.section
          id="program-section"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="py-20"
        >
          <motion.div variants={fadeInUp}>
            <ProblemVsSolution />
          </motion.div>
        </motion.section>

        {/* How It Works */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={staggerContainer}
          className="py-20 bg-gray-50"
        >
          <motion.div variants={fadeInUp}>
            <HowItWorks />
          </motion.div>
        </motion.section>

        {/* Why Choose Us */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="py-20"
        >
          <motion.div variants={fadeInUp}>
            <WhyChooseUs />
          </motion.div>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}