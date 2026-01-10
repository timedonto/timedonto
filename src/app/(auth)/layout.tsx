import { APP_NAME } from '@/config/constants'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">{APP_NAME}</h1>
          <p className="text-sm text-muted-foreground">
            Sistema de Gestão para Clínicas Odontológicas
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}