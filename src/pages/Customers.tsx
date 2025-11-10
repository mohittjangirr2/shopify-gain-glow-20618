import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { AdvancedDataTable } from "@/components/AdvancedDataTable";
import { OrderShipmentDialog } from "@/components/OrderShipmentDialog";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const Customers = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const customerMetrics = useMemo(() => {
    if (!ordersData?.orders) return null;

    // Create a map of Shiprocket customer data by order number
    const shiprocketCustomerMap = new Map();
    if (shipmentsData?.shipments) {
      shipmentsData.shipments.forEach((shipment: any) => {
        if (shipment.orderNumber) {
          shiprocketCustomerMap.set(shipment.orderNumber, {
            customerName: shipment.customerName,
            email: shipment.customerEmail,
            phone: shipment.customerPhone,
            state: shipment.customerState,
          });
        }
      });
    }

    const customerMap = new Map();
    ordersData.orders.forEach((order: any) => {
      // Get Shiprocket data if available
      const shiprocketData = shiprocketCustomerMap.get(order.orderNumber) || {};
      
      // Merge data, preferring Shopify but filling gaps with Shiprocket
      const customerName = order.customerName || shiprocketData.customerName || 'Unknown Customer';
      const email = order.email || shiprocketData.email || 'No Email';
      const phone = order.phone || shiprocketData.phone || 'No Phone';
      const province = order.province || shiprocketData.state || 'Unknown State';
      
      const customerKey = order.customerId || email || phone || customerName;
      if (!customerKey) return;

      const existing = customerMap.get(customerKey) || {
        customerId: order.customerId,
        customerName,
        email,
        phone,
        province,
        orders: 0,
        revenue: 0,
        profit: 0,
      };

      customerMap.set(customerKey, {
        ...existing,
        orders: existing.orders + 1,
        revenue: existing.revenue + (order.orderValue || 0),
        profit: existing.profit + (order.profit || 0),
      });
    });

    const customers = Array.from(customerMap.values())
      .map(c => ({
        ...c,
        avgOrderValue: c.orders > 0 ? c.revenue / c.orders : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.revenue, 0);
    const totalOrders = customers.reduce((sum, c) => sum + c.orders, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const repeatCustomers = customers.filter(c => c.orders > 1).length;
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    return {
      customers,
      totalCustomers,
      totalRevenue,
      avgOrderValue,
      repeatRate,
    };
  }, [ordersData, shipmentsData]);

  const columns = [
    { header: "Customer", accessor: "customerName" },
    { header: "Email", accessor: "email" },
    { header: "Phone", accessor: "phone" },
    { header: "Province", accessor: "province" },
    { header: "Orders", accessor: "orders" },
    { header: "Revenue", accessor: "revenue", cell: (v: number) => `₹${v.toFixed(2)}` },
    { header: "Profit", accessor: "profit", cell: (v: number) => <span className={v >= 0 ? "text-success" : "text-destructive"}>₹{v.toFixed(2)}</span> },
    { header: "AOV", accessor: "avgOrderValue", cell: (v: number) => `₹${v.toFixed(2)}` },
  ];

  if (ordersLoading || shipmentsLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="container mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Customer Analytics</h1>
            <p className="text-muted-foreground">Customer insights and lifetime value</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <MetricCard
            title="Total Customers"
            value={customerMetrics?.totalCustomers || 0}
            icon={Users}
          />
          <MetricCard
            title="Total Revenue"
            value={`₹${customerMetrics?.totalRevenue.toFixed(0) || 0}`}
            icon={DollarSign}
          />
          <MetricCard
            title="Avg Order Value"
            value={`₹${customerMetrics?.avgOrderValue.toFixed(0) || 0}`}
            icon={ShoppingCart}
          />
          <MetricCard
            title="Repeat Rate"
            value={`${customerMetrics?.repeatRate.toFixed(1) || 0}%`}
            icon={TrendingUp}
            variant="success"
          />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Top 10 Customers by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerMetrics?.customers.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="customerName" angle={-45} textAnchor="end" height={120} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" />
                <Bar dataKey="orders" fill="hsl(var(--chart-2))" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <AdvancedDataTable
              data={customerMetrics?.customers || []}
              columns={columns}
              searchable={true}
            />
          </CardContent>
        </Card>

        <OrderShipmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          order={selectedOrder}
          shipments={shipmentsData?.shipments || []}
        />
      </div>
    </div>
  );
};

export default Customers;
