import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Users, 
  FileText, 
  DollarSign, 
  Shield, 
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { APP_NAME } from '@/config/constants'

const features = [
  {
    icon: Calendar,
    title: 'Agenda Inteligente',
    description: 'Gerencie consultas, evite conflitos de horário e envie lembretes automáticos.',
  },
  {
    icon: Users,
    title: 'Gestão de Pacientes',
    description: 'Cadastro completo com histórico, prontuário e odontograma integrado.',
  },
  {
    icon: FileText,
    title: 'Orçamentos',
    description: 'Crie orçamentos profissionais e acompanhe aprovações em tempo real.',
  },
  {
    icon: DollarSign,
    title: 'Financeiro',
    description: 'Controle de caixa, pagamentos e relatórios financeiros completos.',
  },
  {
    icon: Shield,
    title: 'Segurança',
    description: 'Dados protegidos com criptografia e controle de acesso por perfil.',
  },
  {
    icon: Clock,
    title: 'Prontuário Digital',
    description: 'Registro de atendimentos com histórico completo e odontograma.',
  },
]

const benefits = [
  'Acesso de qualquer lugar',
  'Múltiplos usuários por clínica',
  'Backup automático',
  'Suporte técnico incluso',
  'Atualizações gratuitas',
  'Sem instalação necessária',
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-primary">{APP_NAME}</span>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/signup">
              <Button>Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Gerencie sua clínica odontológica
            <br />
            <span className="text-primary">de forma simples e eficiente</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sistema completo para gestão de pacientes, agenda, prontuários, 
            orçamentos e financeiro. Tudo em um só lugar.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Criar Conta Grátis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Tudo que sua clínica precisa
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Funcionalidades pensadas para otimizar o dia a dia da sua clínica
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Por que escolher o {APP_NAME}?
            </h2>
            <p className="text-muted-foreground mb-8">
              Desenvolvido especialmente para clínicas odontológicas brasileiras
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-left">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-muted-foreground mb-8">
            Crie sua conta em menos de 1 minuto e comece a usar hoje mesmo.
          </p>
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Criar Conta Grátis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}