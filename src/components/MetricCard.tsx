import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "destructive";
}

export const MetricCard = ({ title, value, icon: Icon, trend, variant = "default" }: MetricCardProps) => {
  const variantClasses = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  };

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 md:h-5 md:w-5 ${variantClasses[variant]}`} />
      </CardHeader>
      <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
        <div className="text-lg md:text-2xl font-bold">{value}</div>
        {trend && (
          <p className={`text-xs mt-1 ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
};
