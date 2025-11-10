import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { AdvancedDataTable, StatusBadge } from "@/components/AdvancedDataTable";
import { TrendingDown, Package, AlertCircle, DollarSign } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const RTO = () => {
  const { data: shipmentsData, isLoading } = useQuery({
    queryKey: ['shiprocket-shipments', 30],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-shiprocket-shipments', {
        body: { dateRange: 30 }
      });
      if (error) throw error;
      return data;
    },
  });

  const rtoMetrics = useMemo(() => {
    if (!shipmentsData?.shipments) return null;

    const shipments = shipmentsData.shipments;
    const rtoShipments = shipments.filter((s: any) => 
      s.status?.toLowerCase().includes('rto') || s.rtoStatus?.toLowerCase().includes('rto')
    );

    const totalShipments = shipments.length;
    const rtoCount = rtoShipments.length;
    const rtoPercentage = totalShipments > 0 ? (rtoCount / totalShipments) * 100 : 0;

    const rtoLoss = rtoShipments.reduce((sum: number, s: any) => 
      sum + (s.shippingCharge || 0), 0
    );

    // RTO by reason
    const rtoReasons: Record<string, number> = {};
    rtoShipments.forEach((s: any) => {
      const reason = s.rtoReason || 'Unknown';
      rtoReasons[reason] = (rtoReasons[reason] || 0) + 1;
    });

    const rtoByReason = Object.entries(rtoReasons).map(([name, value]) => ({
      name,
      value,
    }));

    // RTO by state
    const rtoByState: Record<string, number> = {};
    rtoShipments.forEach((s: any) => {
      const state = s.customerState || 'Unknown';
      rtoByState[state] = (rtoByState[state] || 0) + 1;
    });

    const rtoByStateData = Object.entries(rtoByState)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRTO: rtoCount,
      rtoPercentage,
      rtoLoss,
      deliveredCount: shipments.filter((s: any) => s.status?.toLowerCase() === 'delivered').length,
      rtoByReason,
      rtoByStateData,
      rtoShipments,
    };
  }, [shipmentsData]);

  const columns = [
    { header: "Order #", accessor: "orderNumber", cell: (v: string | null) => v || "-" },
    { header: "AWB", accessor: "awb", cell: (v: string | null) => v || "-" },
    { header: "Customer", accessor: "customerName", cell: (v: string | null) => v || "-" },
    { header: "State", accessor: "customerState", cell: (v: string | null) => v || "-" },
    { header: "Status", accessor: "status", cell: (v: string | null) => v ? <StatusBadge status={v} /> : "-" },
    { header: "RTO Reason", accessor: "rtoReason", cell: (v: string | null) => v || "-" },
    { header: "Shipping Cost", accessor: "shippingCharge", cell: (v: number) => `₹${v.toFixed(2)}` },
    { header: "RTO Initiated", accessor: "rtoInitiatedDate", cell: (v: string | null) => 
      v ? new Date(v).toLocaleDateString() : "-" 
    },
    { header: "RTO Delivered", accessor: "rtoDeliveredDate", cell: (v: string | null) => 
      v ? new Date(v).toLocaleDateString() : "-" 
    },
  ];

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="container mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <TrendingDown className="h-8 w-8 text-destructive" />
          <div>
            <h1 className="text-3xl font-bold">RTO Analysis</h1>
            <p className="text-muted-foreground">Return to Origin shipments tracking</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <MetricCard
            title="Total RTO"
            value={rtoMetrics?.totalRTO || 0}
            icon={Package}
          />
          <MetricCard
            title="RTO Percentage"
            value={`${rtoMetrics?.rtoPercentage.toFixed(1)}%`}
            icon={TrendingDown}
            variant="destructive"
          />
          <MetricCard
            title="Delivered Orders"
            value={rtoMetrics?.deliveredCount || 0}
            icon={Package}
            variant="success"
          />
          <MetricCard
            title="RTO Loss"
            value={`₹${rtoMetrics?.rtoLoss.toFixed(2)}`}
            icon={DollarSign}
            variant="destructive"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>RTO by Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={rtoMetrics?.rtoByReason}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {rtoMetrics?.rtoByReason.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>RTO by State (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rtoMetrics?.rtoByStateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="state" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--destructive))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              RTO Shipments Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdvancedDataTable
              data={rtoMetrics?.rtoShipments || []}
              columns={columns}
              searchable={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RTO;
