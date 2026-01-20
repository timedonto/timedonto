import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    value: string | number
    icon?: LucideIcon
    trend?: {
        value: string
        direction: "up" | "down" | "neutral"
        label?: string
    }
    footer?: React.ReactNode
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
    ({ className, title, value, icon: Icon, trend, footer, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-lg p-5 shadow-sm",
                    className
                )}
                {...props}
            >
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-[#678380] text-xs font-bold uppercase tracking-wider mb-1">
                            {title}
                        </p>
                        <h3 className="text-2xl font-bold text-[#121716] dark:text-white">
                            {value}
                        </h3>
                    </div>
                    {Icon && (
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="w-5 h-5 text-primary" />
                        </div>
                    )}
                </div>
                {trend && (
                    <div className="flex items-end justify-between mt-4">
                        <div
                            className={cn(
                                "text-[10px] font-bold flex items-center",
                                trend.direction === "up" && "text-green-600",
                                trend.direction === "down" && "text-red-600",
                                trend.direction === "neutral" && "text-primary"
                            )}
                        >
                            {trend.label || trend.value}
                        </div>
                        {footer}
                    </div>
                )}
                {!trend && footer && <div className="mt-4">{footer}</div>}
            </div>
        )
    }
)
StatCard.displayName = "StatCard"

export { StatCard }
