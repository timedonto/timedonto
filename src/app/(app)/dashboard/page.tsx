import { getSessionUser } from '@/modules/auth/application'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const user = await getSessionUser()

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-heading">Dashboard</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-base sm:text-lg">
          Bem-vindo de volta, {user?.name}!
        </p>
      </div>

      <DashboardClient />
    </div>
  )
}
