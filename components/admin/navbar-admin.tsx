// NavbarAdmin.tsx
'use client';

import Link from 'next/link';
import { 
  UserCircle, 
  Users,
  Users2, // Alternative untuk UserGroup
  Settings,
  LogOut,
  Search
} from 'lucide-react';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavbarAdminProps {
  toggleSidebar: () => void;
}

export default function NavbarAdmin({ toggleSidebar }: NavbarAdminProps) {
  const handleLogout = () => {
    console.log('Logout clicked');
    // Tambahkan logic logout di sini
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-xl font-bold text-gray-900 dark:text-white">
              AdminPanel
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari data..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent"
              />
            </div>

            <AnimatedThemeToggler />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                <UserCircle className="h-8 w-8 text-[#005EB8]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <DropdownMenuItem asChild className="focus:bg-gray-100 dark:focus:bg-gray-700">
                  <Link href="/admin/users" className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                    <Users className="h-4 w-4" />
                    <span>Users</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-gray-100 dark:focus:bg-gray-700">
                  <Link href="/admin/mentors" className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                    <Users2 className="h-4 w-4" />
                    <span>Mentors</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-gray-100 dark:focus:bg-gray-700">
                  <Link href="/admin/settings" className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
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