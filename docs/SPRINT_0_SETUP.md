# =====================================================================
# SPRINT 0 — SETUP COMPLETO DO PROJETO TIMEDONTO
# =====================================================================
# 
# INSTRUÇÕES DE USO:
# 1. Crie um novo projeto no Cursor
# 2. Cole este prompt inteiro no chat do Cursor
# 3. Deixe o Cursor executar
# 4. Valide cada etapa antes de prosseguir
#
# =====================================================================

## CONTEXTO DO PROJETO

Estou criando o **TimeDonto**, um SaaS multi-tenant para gestão de clínicas odontológicas.

### Stack Tecnológica:
- **Framework:** Next.js 14+ (App Router)
- **Linguagem:** TypeScript strict
- **Banco de Dados:** PostgreSQL
- **ORM:** Prisma
- **Autenticação:** Auth.js (NextAuth v5)
- **UI:** Tailwind CSS + shadcn/ui
- **Validação:** Zod
- **Pagamentos:** Stripe (futuro)

### Arquitetura:
- Clean Architecture por módulos (Domain → Application → Infra)
- Multi-tenant com isolamento por `clinicId`
- 4 roles: OWNER, ADMIN, DENTIST, RECEPTIONIST

---

## TAREFA: CRIAR ESTRUTURA BASE DO PROJETO

Execute as seguintes etapas em ordem:

### ETAPA 1: Criar projeto Next.js

```bash
npx create-next-app@latest timedonto --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Configurações quando perguntado:
- Would you like to use TypeScript? → Yes
- Would you like to use ESLint? → Yes
- Would you like to use Tailwind CSS? → Yes
- Would you like to use `src/` directory? → Yes
- Would you like to use App Router? → Yes
- Would you like to customize the default import alias? → Yes (@/*)

---

### ETAPA 2: Instalar dependências

```bash
cd timedonto

# Prisma
npm install prisma --save-dev
npm install @prisma/client

# Auth.js (NextAuth v5)
npm install next-auth@beta

# Validação
npm install zod

# UI Components
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
npm install @radix-ui/react-slot
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-label
npm install @radix-ui/react-select
npm install @radix-ui/react-toast
npm install @radix-ui/react-avatar

# Utilitários
npm install bcryptjs
npm install --save-dev @types/bcryptjs
npm install date-fns

# Formulários
npm install react-hook-form @hookform/resolvers
```

---

### ETAPA 3: Configurar TypeScript strict

Atualize o `tsconfig.json` para garantir strict mode:

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    },
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

### ETAPA 4: Criar estrutura de pastas

Crie a seguinte estrutura:

```
/src
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── patients/
│   │   │   └── page.tsx
│   │   ├── appointments/
│   │   │   └── page.tsx
│   │   ├── dentists/
│   │   │   └── page.tsx
│   │   ├── treatment-plans/
│   │   │   └── page.tsx
│   │   ├── finance/
│   │   │   └── page.tsx
│   │   ├── inventory/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   └── health/
│   │       └── route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── modules/
│   ├── auth/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infra/
│   ├── clinics/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infra/
│   ├── users/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infra/
│   ├── dentists/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infra/
│   ├── patients/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infra/
│   ├── appointments/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infra/
│   ├── records/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infra/
│   ├── treatment-plans/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infra/
│   ├── finance/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infra/
│   ├── inventory/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infra/
│   ├── billing/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infra/
│   └── shared/
│       ├── domain/
│       └── utils/
├── components/
│   ├── ui/
│   │   └── button.tsx
│   └── layout/
│       ├── sidebar.tsx
│       ├── header.tsx
│       └── main-layout.tsx
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── utils.ts
│   └── validators/
│       └── index.ts
├── config/
│   ├── env.ts
│   ├── constants.ts
│   └── permissions.ts
└── types/
    └── index.ts
```

---

### ETAPA 5: Criar arquivo .env.local

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/timedonto?schema=public"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta-aqui-gere-com-openssl-rand-base64-32"

# Stripe (configurar depois)
# STRIPE_SECRET_KEY=""
# STRIPE_WEBHOOK_SECRET=""
```

---

### ETAPA 6: Inicializar Prisma e copiar schema

```bash
npx prisma init
```

Depois, substitua o conteúdo de `prisma/schema.prisma` pelo schema que forneci (está no arquivo separado).

---

### ETAPA 7: Criar arquivos base essenciais

#### /src/lib/db.ts
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

#### /src/lib/utils.ts
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

#### /src/config/env.ts
```typescript
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const env = envSchema.parse(process.env)
```

#### /src/config/constants.ts
```typescript
export const APP_NAME = 'TimeDonto'
export const APP_DESCRIPTION = 'Sistema de Gestão para Clínicas Odontológicas'

export const USER_ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  DENTIST: 'DENTIST',
  RECEPTIONIST: 'RECEPTIONIST',
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]
```

#### /src/config/permissions.ts
```typescript
import { UserRole } from './constants'

type Permission = 
  | 'clinic:manage'
  | 'users:manage'
  | 'dentists:manage'
  | 'patients:view'
  | 'patients:manage'
  | 'appointments:view'
  | 'appointments:manage'
  | 'records:view'
  | 'records:manage'
  | 'treatment-plans:view'
  | 'treatment-plans:manage'
  | 'treatment-plans:approve'
  | 'finance:view'
  | 'finance:manage'
  | 'inventory:view'
  | 'inventory:manage'
  | 'billing:manage'
  | 'reports:view'

const rolePermissions: Record<UserRole, Permission[]> = {
  OWNER: [
    'clinic:manage',
    'users:manage',
    'dentists:manage',
    'patients:view',
    'patients:manage',
    'appointments:view',
    'appointments:manage',
    'records:view',
    'records:manage',
    'treatment-plans:view',
    'treatment-plans:manage',
    'treatment-plans:approve',
    'finance:view',
    'finance:manage',
    'inventory:view',
    'inventory:manage',
    'billing:manage',
    'reports:view',
  ],
  ADMIN: [
    'users:manage',
    'dentists:manage',
    'patients:view',
    'patients:manage',
    'appointments:view',
    'appointments:manage',
    'records:view',
    'records:manage',
    'treatment-plans:view',
    'treatment-plans:manage',
    'treatment-plans:approve',
    'finance:view',
    'finance:manage',
    'inventory:view',
    'inventory:manage',
    'reports:view',
  ],
  DENTIST: [
    'patients:view',
    'appointments:view',
    'records:view',
    'records:manage',
    'treatment-plans:view',
    'treatment-plans:manage',
    'treatment-plans:approve',
    'inventory:view',
  ],
  RECEPTIONIST: [
    'patients:view',
    'patients:manage',
    'appointments:view',
    'appointments:manage',
    'treatment-plans:view',
    'inventory:view',
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}

export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] ?? []
}
```

#### /src/app/api/health/route.ts
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', database: 'disconnected' },
      { status: 500 }
    )
  }
}
```

---

### ETAPA 8: Criar componente Button base (shadcn/ui style)

#### /src/components/ui/button.tsx
```typescript
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

---

### ETAPA 9: Atualizar globals.css com variáveis CSS

#### /src/app/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

### ETAPA 10: Criar páginas placeholder

#### /src/app/page.tsx (Landing)
```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">TimeDonto</h1>
        <p className="text-xl text-muted-foreground">
          Sistema de Gestão para Clínicas Odontológicas
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/signup">Criar Conta</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
```

#### /src/app/(auth)/layout.tsx
```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md p-6">
        {children}
      </div>
    </div>
  )
}
```

#### /src/app/(auth)/login/page.tsx
```typescript
export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Entrar</h1>
        <p className="text-muted-foreground">
          Acesse sua conta do TimeDonto
        </p>
      </div>
      <div className="bg-card p-6 rounded-lg border">
        <p className="text-center text-muted-foreground">
          Formulário de login será implementado na Sprint 1
        </p>
      </div>
    </div>
  )
}
```

#### /src/app/(auth)/signup/page.tsx
```typescript
export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Criar Conta</h1>
        <p className="text-muted-foreground">
          Cadastre sua clínica no TimeDonto
        </p>
      </div>
      <div className="bg-card p-6 rounded-lg border">
        <p className="text-center text-muted-foreground">
          Formulário de cadastro será implementado na Sprint 1
        </p>
      </div>
    </div>
  )
}
```

#### /src/app/(app)/layout.tsx
```typescript
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar placeholder */}
      <aside className="w-64 border-r bg-card p-4">
        <div className="font-bold text-xl mb-8">TimeDonto</div>
        <nav className="space-y-2">
          <p className="text-sm text-muted-foreground">Menu será implementado</p>
        </nav>
      </aside>
      
      {/* Main content */}
      <main className="flex-1">
        {/* Header placeholder */}
        <header className="h-16 border-b bg-card flex items-center px-6">
          <p className="text-sm text-muted-foreground">Header será implementado</p>
        </header>
        
        {/* Page content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
```

#### /src/app/(app)/dashboard/page.tsx
```typescript
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">
        Bem-vindo ao TimeDonto! O dashboard será implementado em sprints futuras.
      </p>
    </div>
  )
}
```

---

### ETAPA 11: Rodar migration

```bash
# Gerar migration inicial
npx prisma migrate dev --name init

# Gerar client
npx prisma generate
```

---

### ETAPA 12: Validar que tudo funciona

```bash
# Iniciar servidor de desenvolvimento
npm run dev
```

Depois acesse:
- http://localhost:3000 → Deve mostrar landing page
- http://localhost:3000/login → Página de login
- http://localhost:3000/dashboard → Layout do app
- http://localhost:3000/api/health → JSON com status

---

## VALIDAÇÃO FINAL

Confirme que:
- [ ] `npm run dev` roda sem erros
- [ ] Landing page aparece em localhost:3000
- [ ] `/api/health` retorna `{ status: "ok", database: "connected" }`
- [ ] Tabelas foram criadas no PostgreSQL (verifique no pgAdmin)
- [ ] Estrutura de pastas está correta

---

## PRÓXIMO PASSO

Após validar a Sprint 0, faremos a **Sprint 1: Autenticação + Multi-tenant + Onboarding da Clínica**.

---

# FIM DA SPRINT 0
