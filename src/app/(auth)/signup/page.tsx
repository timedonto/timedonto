'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowRight, 
  CheckCircle2, 
  Moon, 
  Sun, 
  Loader2,
  Building2,
  User,
  Mail,
  Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    const data = {
      clinicName: formData.get('clinicName') as string,
      ownerName: formData.get('ownerName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Erro ao criar conta')
        return
      }

      router.push('/login?registered=true')
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-heading mb-1 tracking-tight">TimeDonto</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Sistema de Gestão para Clínicas Odontológicas</p>
      </div>

      <main className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-xl shadow-teal-900/5 dark:shadow-none border border-border-subtle dark:border-slate-800 p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-heading">Cadastro</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Dados da Conta</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-full rounded-full transition-all duration-500 ease-out"></div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-heading mb-2">Criar Conta</h2>
          <p className="text-slate-500 dark:text-slate-400">Informe os dados para configurarmos seu painel administrativo.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-1.5 relative">
            <Label className="text-sm font-bold text-heading dark:text-teal-400" htmlFor="clinicName">Nome da Clínica</Label>
            <div className="relative">
              <Input 
                className="block w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border border-border-subtle dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all outline-none h-12" 
                id="clinicName" 
                name="clinicName" 
                placeholder="Ex: Sorriso & Vida Odontologia" 
                required 
                type="text"
                disabled={isLoading}
              />
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1.5 relative">
            <Label className="text-sm font-bold text-heading dark:text-teal-400" htmlFor="ownerName">Nome do Responsável</Label>
            <div className="relative">
              <Input 
                className="block w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border border-border-subtle dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all outline-none h-12" 
                id="ownerName" 
                name="ownerName" 
                placeholder="Ex: Dr. João Silva" 
                required 
                type="text"
                disabled={isLoading}
              />
              <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1.5 relative">
            <Label className="text-sm font-bold text-heading dark:text-teal-400" htmlFor="email">E-mail Profissional</Label>
            <div className="relative">
              <Input 
                className="block w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border border-border-subtle dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all outline-none h-12" 
                id="email" 
                name="email" 
                placeholder="seu@email.com" 
                required 
                type="email"
                disabled={isLoading}
              />
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1.5 relative">
            <Label className="text-sm font-bold text-heading dark:text-teal-400" htmlFor="password">Senha de Acesso</Label>
            <div className="relative">
              <Input 
                className="block w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border border-border-subtle dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all outline-none h-12" 
                id="password" 
                name="password" 
                placeholder="Mínimo 6 caracteres" 
                required 
                type="password"
                minLength={6}
                disabled={isLoading}
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 w-5 h-5" />
            </div>
          </div>

          <Button 
            className="w-full bg-primary hover:bg-[#28B2A1] text-white font-bold py-6 px-4 rounded-lg shadow-lg shadow-primary/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 h-14 text-base" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Finalizar Cadastro</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border-subtle dark:border-slate-800 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Já tem uma conta? {' '}
            <Link className="text-heading font-bold hover:underline decoration-2 underline-offset-4" href="/login">Fazer login</Link>
          </p>
        </div>
      </main>

      <footer className="mt-8 text-center text-slate-400 dark:text-slate-500 text-xs">
        © 2026 TimeDonto - Todos os direitos reservados.
        <div className="mt-2 space-x-4">
          <Link className="hover:text-heading transition-colors" href="#">Termos de Uso</Link>
          <Link className="hover:text-heading transition-colors" href="#">Privacidade</Link>
        </div>
      </footer>

      {/* Theme Toggle Button */}
      <button 
        className="fixed bottom-6 right-6 p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-border-subtle dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:scale-110 transition-transform" 
        onClick={toggleDarkMode}
      >
        {isDarkMode ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6" />}
      </button>
    </div>
  )
}
