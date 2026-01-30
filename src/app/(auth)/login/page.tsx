'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { 
  Stethoscope, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Moon, 
  Sun,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const registered = searchParams.get('registered')
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou senha inválidos')
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background-teal dark:bg-background-dark min-h-screen flex items-center justify-center p-0 md:p-4 transition-colors duration-200">
      <div className="flex w-full max-w-6xl h-full md:h-[800px] bg-white dark:bg-slate-900 rounded-none md:rounded-3xl shadow-2xl overflow-hidden">
        {/* Left Side - Image & Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <img 
            alt="Modern calming dental office environment" 
            className="absolute inset-0 w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD37unq4CJN10eFwZSPHnBTru9sKcTbkOmIC_c51HPVJelMOiFwjmpV6Txdxy9MnpY54Tkj5QaigckPdlg1kCq-pfUlnKNRR6PCDwECiDKYxiiPKceFsHFkL-bEDP8B9Uju89ndORwdPlA6boQ6CPsJYUefPEwjKhLydiCyaMSu_4QhQWBhStefNrHHpla3SMeYIBsSGpOt9zgQsdBPdgfvcULezbY1rIF8BdjYRWWezehgwiyGAUUDSAfionz6kRZVJfbSTAB4Hzj3"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#117C6F]/85 to-[#2FC4B2]/90 flex flex-col justify-between p-12 text-white">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-8 h-8" />
              <span className="text-2xl font-bold tracking-tight">TimeDonto</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold leading-tight mb-4">A gestão da sua clínica em um só lugar.</h1>
              <p className="text-teal-50 text-lg opacity-90">Simplifique agendamentos, prontuários e o financeiro com a plataforma mais moderna do mercado odontológico.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <img alt="Doctor avatar" className="w-10 h-10 rounded-full border-2 border-[#2FC4B2]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIqpXeIx4p2nKidBlZ4VJvD7werfILJDzTZLfkbvmh_rE5YRcq1-j5sLBdigj_SINLyd1_kC-oePI2vTLvwwyL7a5HBTUhNsSLtBVdCns8Vg0Lj48iGRlgA7yA3ibBEHOAoQDEBCJaJjbxgF_zoPIcwEyzM0a2xzPvOCx9SGnM1UCCxS1nomfjccqNijC40bbfiHPndJ_drslzMUcGK_TTPFUYy8u5PElza0HOg6v_j8yxeeW3TImOn4Mu_2G19BTF4UHeBOEQSHii"/>
                <img alt="Dentist avatar" className="w-10 h-10 rounded-full border-2 border-[#2FC4B2]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRShkQgt2l5Wx5unGzPMDK6KJYkS9hvpg-O63wdqTfN-99AyGpJgUKCsFE6Hlppn9fbxB1Z_6izUiLIIdVwqPyrhihiP8Ln-l12pW5JfPd13UXgAZ8t1nuXvpACAu9SFikFXYSxZeWxO2Q5dpDjiGeFTW9RkyHEgKUlX0-wBRM6liJd6kuZfTyulT-NVfD0UycB5Pe6fcPLeAFPq8oLaNN1V5cwWBgwQWhZmT1A0eSOea9TTxerCp2MkyyO7ul8e8DZ8RS4SBPh6CU"/>
              </div>
              <p className="text-sm font-medium text-teal-50 w-48 opacity-90">+2.000 dentistas já otimizaram sua rotina</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 bg-white dark:bg-slate-900">
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden flex justify-center items-center gap-2 mb-8">
              <Stethoscope className="w-8 h-8 text-heading" />
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">TimeDonto</span>
            </div>
            <h2 className="text-3xl font-bold text-heading dark:text-teal-400 mb-2">Bem-vindo de volta!</h2>
            <p className="text-slate-500 dark:text-slate-400">Acesse sua conta para gerenciar sua clínica.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {registered && (
              <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg border border-green-100 dark:border-green-900/50">
                Conta criada com sucesso! Faça login para continuar.
              </div>
            )}
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                {error}
              </div>
            )}

            <div>
              <Label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-lg ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary dark:text-white transition-all shadow-sm h-12" 
                  id="email" 
                  name="email" 
                  placeholder="seu@email.com" 
                  required 
                  type="email" 
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">Senha</Label>
                <Link className="text-xs font-semibold text-heading hover:text-teal-700 dark:hover:text-teal-400 transition-colors" href="#">Esqueceu a senha?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input 
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-lg ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary dark:text-white transition-all shadow-sm h-12" 
                  id="password" 
                  name="password" 
                  placeholder="Sua senha" 
                  required 
                  type={showPassword ? "text" : "password"} 
                  disabled={isLoading}
                />
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input 
                className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded cursor-pointer" 
                id="remember-me" 
                name="remember-me" 
                type="checkbox" 
              />
              <label className="ml-2 block text-sm text-slate-600 dark:text-slate-400 cursor-pointer" htmlFor="remember-me">
                Lembrar de mim
              </label>
            </div>

            <Button 
              className="w-full bg-primary hover:brightness-95 text-white font-bold py-6 px-4 rounded-lg transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 group h-14 text-base" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Entrar na plataforma</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              Ainda não tem uma conta? {' '}
              <Link className="text-heading font-bold hover:underline" href="/signup">Criar conta grátis</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Theme Toggle Button */}
      <button 
        className="fixed bottom-6 right-6 p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg text-slate-600 dark:text-slate-300 hover:scale-110 transition-transform z-50 border border-slate-200 dark:border-slate-700" 
        onClick={toggleDarkMode}
      >
        {isDarkMode ? <Sun className="w-6 h-6 text-yellow-500" /> : <Moon className="w-6 h-6" />}
      </button>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="bg-background-teal dark:bg-background-dark min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
