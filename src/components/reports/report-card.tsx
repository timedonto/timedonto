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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-xs sm:text-sm font-medium leading-tight">{title}</CardTitle>
        {Icon && <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />}
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="text-lg sm:text-2xl font-bold truncate">{value}</div>
        
        {(description || (trend && trendValue)) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-1 sm:gap-0">
            {description && (
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight line-clamp-2">{description}</p>
            )}
            
            {trend && trendValue && TrendIcon && (
              <div className={cn("flex items-center gap-1 text-[10px] sm:text-xs flex-shrink-0", getTrendColor())}>
                <TrendIcon className="h-2 w-2 sm:h-3 sm:w-3" />
                <span>{trendValue}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}