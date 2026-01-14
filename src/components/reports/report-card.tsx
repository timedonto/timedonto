import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ReportCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string | number
  className?: string
}

export function ReportCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  className
}: ReportCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return TrendingUp
      case 'down':
        return TrendingDown
      case 'neutral':
        return Minus
      default:
        return null
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'neutral':
        return 'text-gray-500'
      default:
        return ''
    }
  }

  const TrendIcon = getTrendIcon()

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        
        {(description || (trend && trendValue)) && (
          <div className="flex items-center justify-between mt-2">
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            
            {trend && trendValue && TrendIcon && (
              <div className={cn("flex items-center gap-1 text-xs", getTrendColor())}>
                <TrendIcon className="h-3 w-3" />
                <span>{trendValue}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}