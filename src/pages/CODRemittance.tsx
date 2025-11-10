import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { AdvancedDataTable, StatusBadge } from "@/components/AdvancedDataTable";
import { DollarSign, Package, Clock, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getDefaultSettings } from "@/lib/feeCalculations";

const CODRemittance = () => {
  const settings = getDefaultSettings();

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['shopify-orders', 30],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-shopify-orders', {
        body: { dateRange: 30 }
      });
      if (error) throw error;
      return data;
    },
  });

  const { data: shipmentsData, isLoading: shipmentsLoading } = useQuery({
    queryKey: ['shiprocket-shipments', 30],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-shiprocket-shipments', {
        body: { dateRange: 30 }
      });
      if (error) throw error;
      return data;
    },
  });

  const codMetrics = useMemo(() => {
    if (!ordersData?.orders || !shipmentsData?.shipments) return null;

    const orders = ordersData.orders;
    const shipments = shipmentsData.shipments;

    // Filter COD orders
    const codOrders = orders.filter((o: any) => 
      o.paymentMethod?.toLowerCase() === 'cod' || 
      o.paymentMethod?.toLowerCase().includes('cash')
    );

    // Create a map of delivered shipments
    const deliveredShipments = new Set(
      shipments
        .filter((s: any) => s.status?.toLowerCase() === 'delivered')
        .map((s: any) => s.orderNumber)
    );

    // Separate delivered and pending COD orders
    const deliveredCOD = codOrders.filter((o: any) => 
      deliveredShipments.has(o.orderNumber)
    );
    
    const pendingCOD = codOrders.filter((o: any) => 
      !deliveredShipments.has(o.orderNumber)
    );

    // Calculate metrics
    const totalCODValue = codOrders.reduce((sum: number, o: any) => sum + (o.orderValue || 0), 0);
    const deliveredCODValue = deliveredCOD.reduce((sum: number, o: any) => sum + (o.orderValue || 0), 0);
    const pendingCODValue = pendingCOD.reduce((sum: number, o: any) => sum + (o.orderValue || 0), 0);

    // Calculate COD remittance fees
    const codRemittanceFees = deliveredCOD.length * settings.codRemittance.fee;
    const netCODAmount = deliveredCODValue - codRemittanceFees;

    // COD by status
    const codByStatus = [
      { name: 'Delivered', value: deliveredCOD.length, amount: deliveredCODValue },
      { name: 'Pending', value: pendingCOD.length, amount: pendingCODValue },
    ];

    // COD by state
    const codByState: Record<string, { count: number; amount: number }> = {};
    deliveredCOD.forEach((o: any) => {
      const state = o.state || 'Unknown';
      if (!codByState[state]) {
        codByState[state] = { count: 0, amount: 0 };
      }
      codByState[state].count++;
      codByState[state].amount += o.orderValue || 0;
    });

    const codByStateData = Object.entries(codByState)
      .map(([state, data]) => ({ state, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return {
      totalCODOrders: codOrders.length,
      deliveredCODOrders: deliveredCOD.length,
      pendingCODOrders: pendingCOD.length,
      totalCODValue,
      deliveredCODValue,
      pendingCODValue,
      codRemittanceFees,
      netCODAmount,
      codByStatus,
      codByStateData,
      deliveredCODDetails: deliveredCOD.map((o: any) => ({
        ...o,
        remittanceFee: settings.codRemittance.fee,
        netAmount: (o.orderValue || 0) - settings.codRemittance.fee,
      })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }, [ordersData, shipmentsData, settings]);

  const columns = [
    { header: "Order #", accessor: "orderNumber", cell: (v: string | null) => v || "Unknown" },
    { header: "Date", accessor: "date", cell: (v: string | null) => 
      v ? new Date(v).toLocaleDateString() : "Unknown"
    },
    { header: "Customer", accessor: "customerName", cell: (v: string | null) => v || "Unknown" },
    { header: "Phone", accessor: "phone", cell: (v: string | null) => v || "No Phone" },
    { header: "State", accessor: "state", cell: (v: string | null) => v || "Unknown" },
    { header: "Order Value", accessor: "orderValue", cell: (v: number) => `₹${v?.toFixed(2) || 0}` },
    { header: "Remittance Fee", accessor: "remittanceFee", cell: (v: number) => `₹${v?.toFixed(2) || 0}` },
    { header: "Net Amount", accessor: "netAmount", cell: (v: number) => `₹${v?.toFixed(2) || 0}` },
    { header: "Status", accessor: "orderStatus", cell: (v: string | null) => 
      v ? <StatusBadge status={v} /> : <StatusBadge status="unknown" />
    },
  ];

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

  if (ordersLoading || shipmentsLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="container mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">COD Remittance</h1>
            <p className="text-muted-foreground">Cash on Delivery order tracking and remittance</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <MetricCard
            title="Total COD Orders"
            value={codMetrics?.totalCODOrders || 0}
            icon={Package}
          />
          <MetricCard
            title="Delivered COD"
            value={codMetrics?.deliveredCODOrders || 0}
            icon={CheckCircle}
            variant="success"
          />
          <MetricCard
            title="Pending COD"
            value={codMetrics?.pendingCODOrders || 0}
            icon={Clock}
            variant="warning"
          />
          <MetricCard
            title="Net COD Amount"
            value={`₹${codMetrics?.netCODAmount?.toFixed(2) || 0}`}
            icon={DollarSign}
            variant="success"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total COD Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                ₹{codMetrics?.totalCODValue?.toFixed(2) || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                All COD orders (delivered + pending)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivered COD Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ₹{codMetrics?.deliveredCODValue?.toFixed(2) || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Before remittance fees
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Remittance Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                ₹{codMetrics?.codRemittanceFees?.toFixed(2) || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                ₹{settings.codRemittance.fee} per delivered order
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>COD Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={codMetrics?.codByStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {codMetrics?.codByStatus.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string, props: any) => [
                    `${value} orders (₹${props.payload.amount.toFixed(2)})`,
                    name
                  ]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>COD by State (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={codMetrics?.codByStateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="state" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Delivered COD Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdvancedDataTable
              data={codMetrics?.deliveredCODDetails || []}
              columns={columns}
              searchable={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CODRemittance;
