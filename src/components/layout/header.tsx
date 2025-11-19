// components/header.tsx
"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Menu, X, BookOpen, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import CoursesDropdown from "@/components/ui/courses-dropdown";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import DrawOutlineButton from "@/components/ui/draw-outline-button";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const dropdownTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/80">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo dan Menu */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 transition-transform hover:scale-105"
            >
              <BookOpen className="h-8 w-8 text-[#005EB8]" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                EduAccess
              </span>
            </Link>

            {/* Desktop Navigation - Hanya untuk lg ke atas */}
            <div className="hidden lg:flex items-center gap-6">
              {/* Courses Dropdown */}
              <div className="relative">
                <button
                  ref={dropdownTriggerRef}
                  onClick={handleCoursesToggle}
                  className="flex items-center gap-1 px-4 py-2 font-medium text-[#005EB8] transition-colors duration-300 group"
                >
                  Kursus
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${
                      coursesDropdownOpen ? "rotate-180" : ""
                    } group-hover:translate-y-0.5`}
                  />
                </button>

                <CoursesDropdown
                  isOpen={coursesDropdownOpen}
                  onClose={() => setCoursesDropdownOpen(false)}
                />
              </div>
            </div>
          </div>

          {/* Search Bar - Desktop - Hanya untuk lg ke atas */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Cari kursus..."
                className="w-full pl-10 pr-4 transition-all duration-300 focus:ring-2 focus:ring-[#005EB8] focus:border-[#005EB8]"
              />
            </div>
          </div>

          {/* Right Side Actions - Desktop - Hanya untuk lg ke atas */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Daftar sebagai Instruktur */}
            <Link href="/instructor/apply">
              <DrawOutlineButton className="text-[#005EB8]">
                Jadi Instruktur
              </DrawOutlineButton>
            </Link>

            {/* Theme Toggle */}
            <AnimatedThemeToggler />

            <Link href="/login">
              <DrawOutlineButton className="text-[#005EB8]">
                Masuk
              </DrawOutlineButton>
            </Link>

            {/* Tombol Daftar dengan background dan tetap menggunakan DrawOutlineButton */}
            <Link href="/register">
              <DrawOutlineButton className="bg-[#005EB8] text-white border-[#005EB8] rounded-none hover:bg-[#004A93] hover:border-[#004A93] hover:text-white">
                Daftar
              </DrawOutlineButton>
            </Link>
          </div>

          {/* Mobile Menu Button - Tampil untuk md dan di bawah (tablet & mobile) */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu - Tampil untuk md dan di bawah (tablet & mobile) */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-700 animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <div className="flex flex-col gap-4">
              {/* Mobile Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Cari kursus..."
                  className="w-full pl-10 pr-4 transition-all duration-300 focus:ring-2 focus:ring-[#005EB8]"
                />
              </div>

              {/* Mobile Courses */}
              <div className="space-y-6">
                {/* Free Courses Mobile */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-[#008A00] rounded-full"></div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        Kursus Gratis
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Mulai belajar tanpa biaya
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 ml-2">
                    {freeCourses.map((course, index) => (
                      <Link
                        key={index}
                        href={`/courses/free/${course
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                        className="bg-gradient-to-r from-[#008A00]/5 to-[#008A00]/10 dark:from-[#008A00]/10 dark:to-[#008A00]/15 rounded-lg p-2 border border-[#008A00]/20 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-[#008A00] transition-colors duration-300"
                        onClick={handleMobileLinkClick}
                      >
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-[#008A00] rounded-full"></div>
                          <span className="line-clamp-1">{course}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/courses/free"
                    className="block text-xs font-semibold text-[#008A00] hover:text-[#006600] ml-2 transition-colors duration-300"
                    onClick={handleMobileLinkClick}
                  >
                    Lihat semua kursus gratis →
                  </Link>
                </div>

                {/* Paid Courses Mobile */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-[#005EB8] rounded-full"></div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        Kursus Berbayar
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Akses konten premium lengkap
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 ml-2">
                    {paidCourses.map((course, index) => (
                      <Link
                        key={index}
                        href={`/courses/paid/${course
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                        className="bg-gradient-to-r from-[#005EB8]/5 to-[#005EB8]/10 dark:from-[#005EB8]/10 dark:to-[#005EB8]/15 rounded-lg p-2 border border-[#005EB8]/20 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-[#005EB8] transition-colors duration-300"
                        onClick={handleMobileLinkClick}
                      >
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-[#005EB8] rounded-full"></div>
                          <span className="line-clamp-1">{course}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/courses/paid"
                    className="block text-xs font-semibold text-[#005EB8] hover:text-[#004A93] ml-2 transition-colors duration-300"
                    onClick={handleMobileLinkClick}
                  >
                    Lihat semua kursus berbayar →
                  </Link>
                </div>
              </div>

              {/* Mobile Daftar sebagai Instruktur */}
              <Link href="/instructor/apply">
                <DrawOutlineButton
                  className="w-full text-[#005EB8]"
                  onClick={handleMobileLinkClick}
                >
                  Jadi Instruktur
                </DrawOutlineButton>
              </Link>

              {/* Mobile Theme Toggle - Dipindahkan ke tengah */}
              <div className="flex justify-center py-2">
                <AnimatedThemeToggler />
              </div>

              {/* Mobile Auth Links */}
              <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link href="/login">
                  <DrawOutlineButton
                    className="w-full text-[#005EB8]"
                    onClick={handleMobileLinkClick}
                  >
                    Masuk
                  </DrawOutlineButton>
                </Link>

                {/* Tombol Daftar Mobile dengan background dan tetap menggunakan DrawOutlineButton */}
                <Link href="/register">
                  <DrawOutlineButton
                    className="w-full bg-[#005EB8] text-white border-[#005EB8] rounded-none hover:bg-[#004A93] hover:border-[#004A93] hover:text-white"
                    onClick={handleMobileLinkClick}
                  >
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
