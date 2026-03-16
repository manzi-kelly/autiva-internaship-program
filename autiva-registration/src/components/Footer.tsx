"use client";

import React from "react";
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  MapPin,
  Send,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-emerald-950 to-emerald-900 text-emerald-100">
      <div className="mx-auto max-w-7xl px-5 py-12 md:py-16 lg:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand + Contact */}
          <div className="lg:col-span-4">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Autiva Tech
            </h2>
            <p className="mt-3 text-emerald-300">
              Online Internship Program
            </p>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <MapPin className="h-4.5 w-4.5 text-emerald-400" />
                <span>Kigali, Rwanda</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4.5 w-4.5 text-emerald-400" />
                <span>+250 78 028 596</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4.5 w-4.5 text-emerald-400" />
                <a
                  href="mailto:tech@autivatech.com"
                  className="transition hover:text-emerald-300"
                >
                  tech@autivatech.com
                </a>
              </div>
            </div>

            {/* Social Icons */}
            <div className="mt-8 flex gap-5">
              <SocialIcon href="https://facebook.com" icon={Facebook} />
              <SocialIcon href="https://twitter.com" icon={Twitter} />
              <SocialIcon href="https://linkedin.com" icon={Linkedin} />
              <SocialIcon href="https://instagram.com" icon={Instagram} />
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h3 className="mb-5 text-lg font-semibold text-white">Quick Links</h3>
            <ul className="space-y-3 text-sm text-emerald-300">
              <li><FooterLink href="/">Home</FooterLink></li>
              <li><FooterLink href="/program">Program</FooterLink></li>
              <li><FooterLink href="/about-us">About Us</FooterLink></li>
              <li><FooterLink href="/apply">Apply Now</FooterLink></li>
            </ul>
          </div>

          {/* Internship Levels */}
          <div className="lg:col-span-3">
            <h3 className="mb-5 text-lg font-semibold text-white">
              Internship Tracks
            </h3>
            <ul className="space-y-3 text-sm text-emerald-300">
              <li><FooterLink href="/internship/l3">Level 3 – Software Development</FooterLink></li>
              <li><FooterLink href="/internship/l4">Level 4 – Software Development</FooterLink></li>
              <li><FooterLink href="/internship/l5">Level 5 – Software Development</FooterLink></li>
              <li><FooterLink href="/mentorship">Mentorship Program</FooterLink></li>
            </ul>
          </div>

          {/* Newsletter / Contact CTA */}
          <div className="lg:col-span-3">
            <h3 className="mb-5 text-lg font-semibold text-white">
              Stay Updated
            </h3>
            <p className="text-sm text-emerald-300">
              Get notified about new internship openings and tech updates.
            </p>

            <div className="mt-5 flex rounded-lg bg-emerald-800/40">
              <input
                type="email"
                placeholder="Your email"
                className="w-full bg-transparent px-4 py-3 text-sm text-emerald-100 placeholder-emerald-400 outline-none"
              />
              <button className="flex items-center gap-2 rounded-r-lg bg-emerald-600 px-5 text-white transition hover:bg-emerald-500">
                <Send size={18} />
              </button>
            </div>

            <p className="mt-4 text-xs text-emerald-400">
              We respect your privacy • No spam
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-emerald-800/50 pt-8 text-center text-sm text-emerald-400">
          <p>
            © {new Date().getFullYear()} Autiva Tech Ltd. All rights reserved.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs">
            <a href="/privacy" className="hover:text-emerald-300 transition">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-emerald-300 transition">
              Terms of Service
            </a>
            <a href="/contact" className="hover:text-emerald-300 transition">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({
  href,
  icon: Icon,
}: {
  href: string;
  icon: any;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full bg-emerald-800/50 p-2.5 text-emerald-300 transition hover:bg-emerald-700 hover:text-white"
    >
      <Icon className="h-5 w-5" />
    </a>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="transition hover:text-emerald-100 hover:translate-x-1 inline-block"
    >
      {children}
    </a>
  );
}