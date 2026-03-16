import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Header height (adjust this value to match your actual header height in px)
  const HEADER_OFFSET = 80; // ← change this if your header is taller/shorter (e.g. 64, 96, 100...)

  // Handle hash scrolling (on initial load or navigation)
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      scrollToSection(id);
    }
  }, [location]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - HEADER_OFFSET;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handleSectionClick = (sectionId: string) => {
    setIsOpen(false); // close mobile menu

    if (location.pathname === "/") {
      scrollToSection(sectionId);
    } else {
      // Navigate to home + hash → useEffect will handle smooth scroll
      navigate(`/#${sectionId}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-800/40 bg-gradient-to-b from-emerald-950 to-emerald-900 text-emerald-100 shadow-lg shadow-emerald-950/30 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => navigate("/")}
            className="flex cursor-pointer items-center gap-3 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/90 font-bold text-white text-xl shadow-md transition-transform group-hover:scale-105">
              AT
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-tight text-white">
                Autiva Tech
              </span>
              <span className="text-xs text-emerald-400 font-medium">
                Online Internship Program
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-10">
            <NavButton onClick={() => navigate("/")}>Home</NavButton>
            <NavButton onClick={() => handleSectionClick("program-section")}>
              Program
            </NavButton>
            <NavButton onClick={() => handleSectionClick("about-section")}>
              About
            </NavButton>
            <NavButton onClick={() => navigate("/contact")}>Contact</NavButton>
          </nav>

          {/* Actions + Mobile Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/auth")}
              className="hidden md:block text-sm text-emerald-300 hover:text-white transition"
            >
              Login
            </button>

            <button
              onClick={() => navigate("/auth")}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/30 active:scale-95"
            >
              Apply Now
            </button>

            <button
              className="lg:hidden text-emerald-300 hover:text-white transition"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-emerald-800/40 bg-emerald-950/95 backdrop-blur-md">
          <nav className="flex flex-col px-6 py-8 space-y-6 text-base">
            <MobileButton onClick={() => { navigate("/"); setIsOpen(false); }}>
              Home
            </MobileButton>

            <MobileButton onClick={() => handleSectionClick("program-section")}>
              Program
            </MobileButton>

            <MobileButton onClick={() => handleSectionClick("about-section")}>
              About
            </MobileButton>

            <MobileButton onClick={() => { navigate("/contact"); setIsOpen(false); }}>
              Contact
            </MobileButton>

            <div className="pt-4 border-t border-emerald-800/40 flex flex-col gap-4">
              <button
                onClick={() => { navigate("/auth"); setIsOpen(false); }}
                className="rounded-lg bg-emerald-600 px-6 py-3.5 text-base font-medium text-white transition hover:bg-emerald-500"
              >
                Apply Now
              </button>

              <button
                onClick={() => { navigate("/auth"); setIsOpen(false); }}
                className="text-center text-emerald-300 hover:text-white"
              >
                Login
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative py-2 px-1 text-emerald-300 transition hover:text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-emerald-400 after:transition-all hover:after:w-full"
    >
      {children}
    </button>
  );
}

function MobileButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="block w-full text-left transition hover:text-white"
    >
      {children}
    </button>
  );
}