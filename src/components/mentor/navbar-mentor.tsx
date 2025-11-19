// NavbarMentor.tsx
'use client';

import Link from 'next/link';
import { 
  UserCircle, 
  LayoutGrid, 
  Settings,
  LogOut,
  Menu
} from 'lucide-react';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavbarMentorProps {
  toggleSidebar: () => void;
}

export default function NavbarMentor({ toggleSidebar }: NavbarMentorProps) {
  const handleLogout = () => {
    console.log('Logout clicked');
    // Tambahkan logic logout di sini
  };

  return (
    <header className="bg-transparent">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
          </div>

          <div className="flex items-center gap-3">
            <AnimatedThemeToggler />

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                <UserCircle className="h-8 w-8 text-[#005EB8]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <DropdownMenuItem asChild className="focus:bg-gray-100 dark:focus:bg-gray-700">
                  <Link href="/mentor/profile" className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                    <UserCircle className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-gray-100 dark:focus:bg-gray-700">
                  <Link href="/mentor/courses" className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                    <LayoutGrid className="h-4 w-4" />
                    <span>My Courses</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-gray-100 dark:focus:bg-gray-700">
                  <Link href="/mentor/settings" className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
    </header>
  );
}