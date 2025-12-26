// components/header.tsx
"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { Menu, X, BookOpen, ChevronDown } from "lucide-react";
import CoursesDropdown from "@/components/ui/courses-dropdown";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import DrawOutlineButton from "@/components/ui/draw-outline-button";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const dropdownTriggerRef = useRef<HTMLButtonElement>(null);

  const handleCoursesToggle = () => {
    setCoursesDropdownOpen(!coursesDropdownOpen);
  };

  const handleMobileLinkClick = () => {
    setMobileMenuOpen(false);
    setCoursesDropdownOpen(false);
  };

  const freeCourses = [
    "HTML & CSS Dasar",
    "JavaScript Pemula",
    "Python untuk Pemula",
    "UI/UX Fundamentals",
  ];

  const paidCourses = [
    "Full-Stack Web Development",
    "Mobile App Development",
    "Advanced Data Science",
    "Machine Learning Professional",
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-700 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/80">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo dan Menu */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 transition-transform hover:scale-105"
            >
              <BookOpen className="h-7 w-7 text-[#005EB8]" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                EduAccess
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              {/* Courses Dropdown */}
              <div className="relative">
                <button
                  ref={dropdownTriggerRef}
                  onClick={handleCoursesToggle}
                  className="flex items-center gap-1 px-3 py-2 font-medium text-gray-700 dark:text-gray-300 hover:text-[#005EB8] dark:hover:text-[#005EB8] transition-colors duration-200 group"
                >
                  Kursus
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      coursesDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <CoursesDropdown
                  isOpen={coursesDropdownOpen}
                  onClose={() => setCoursesDropdownOpen(false)}
                />
              </div>
            </div>
          </div>

          {/* Right Side Actions - Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Jadi Instruktur */}
            <Link href="/register">
              <DrawOutlineButton className="text-[#005EB8] text-sm">
                Jadi Mentor
              </DrawOutlineButton>
            </Link>

            {/* Theme Toggle */}
            <AnimatedThemeToggler />

            {/* Auth Buttons */}
            <Link href="/login">
              <DrawOutlineButton className="text-[#005EB8] text-sm">
                Masuk
              </DrawOutlineButton>
            </Link>

            <Link href="/register">
              <DrawOutlineButton className="bg-[#005EB8] text-white border-[#005EB8] text-sm hover:bg-[#004A93] hover:border-[#004A93]">
                Daftar
              </DrawOutlineButton>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <AnimatedThemeToggler />
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-700 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-4">
              {/* Mobile Courses */}
              <div className="space-y-4">
                {/* Free Courses Mobile */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-[#008A00] rounded-full"></div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        Kursus Gratis
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Mulai belajar tanpa biaya
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 ml-4">
                    {freeCourses.map((course, index) => (
                      <Link
                        key={index}
                        href={`/courses`}
                        className="bg-[#008A00]/5 dark:bg-[#008A00]/10 rounded-lg p-2 border border-[#008A00]/20 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-[#008A00] transition-colors"
                        onClick={handleMobileLinkClick}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="w-1 h-1 bg-[#008A00] rounded-full"></div>
                          <span className="line-clamp-1">{course}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/courses"
                    className="block text-xs font-medium text-[#008A00] hover:text-[#006600] ml-4 transition-colors"
                    onClick={handleMobileLinkClick}
                  >
                    Lihat semua kursus gratis →
                  </Link>
                </div>

                {/* Paid Courses Mobile */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-[#005EB8] rounded-full"></div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        Kursus Berbayar
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Akses konten premium lengkap
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 ml-4">
                    {paidCourses.map((course, index) => (
                      <Link
                        key={index}
                        href={`/courses`}
                        className="bg-[#005EB8]/5 dark:bg-[#005EB8]/10 rounded-lg p-2 border border-[#005EB8]/20 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-[#005EB8] transition-colors"
                        onClick={handleMobileLinkClick}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="w-1 h-1 bg-[#005EB8] rounded-full"></div>
                          <span className="line-clamp-1">{course}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/courses"
                    className="block text-xs font-medium text-[#005EB8] hover:text-[#004A93] ml-4 transition-colors"
                    onClick={handleMobileLinkClick}
                  >
                    Lihat semua kursus berbayar →
                  </Link>
                </div>
              </div>

              {/* Mobile Jadi Instruktur */}
              <Link href="/register" onClick={handleMobileLinkClick}>
                <DrawOutlineButton className="w-full text-[#005EB8] text-sm">
                  Jadi Mentor
                </DrawOutlineButton>
              </Link>

              {/* Mobile Auth Links */}
              <div className="flex flex-col gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Link href="/login" onClick={handleMobileLinkClick}>
                  <DrawOutlineButton className="w-full text-[#005EB8] text-sm">
                    Masuk
                  </DrawOutlineButton>
                </Link>

                <Link href="/register" onClick={handleMobileLinkClick}>
                  <DrawOutlineButton className="w-full bg-[#005EB8] text-white border-[#005EB8] text-sm hover:bg-[#004A93] hover:border-[#004A93]">
                    Daftar
                  </DrawOutlineButton>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
