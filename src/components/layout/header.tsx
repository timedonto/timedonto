'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { LogOut, User, Moon, Sun, CircleUser, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { roleLabels } from '@/components/auth/require-role'
import type { SessionUser } from '@/types'

interface HeaderProps {
  user: SessionUser
  onMenuClick?: () => void
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true)
    }
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shadow-sm transition-colors duration-200">
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 hidden sm:block truncate max-w-[200px] md:max-w-none">
          Unidade Principal - {user.clinicName}
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-6">
        <button 
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-500"
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <div className="flex items-center text-slate-700 dark:text-slate-300">
          <CircleUser className="h-6 w-6 md:mr-2 text-slate-400" />
          <span className="font-medium mr-2 hidden md:block">{user.name}</span>
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded font-bold hidden sm:block">
            {roleLabels[user.role] || user.role}
          </span>
        </div>

        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center text-slate-500 hover:text-red-600 transition-colors text-sm font-medium"
        >
          <LogOut className="h-4 w-4 md:mr-1" />
          <span className="hidden md:block">Sair</span>
        </button>
      </div>
    </header>
  )
}
