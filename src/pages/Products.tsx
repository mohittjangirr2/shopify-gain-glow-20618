import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { AdvancedDataTable } from "@/components/AdvancedDataTable";
import { OrderShipmentDialog } from "@/components/OrderShipmentDialog";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const Products = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['shopify-orders', 30],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-shopify-orders', {
        body: { dateRange: 30 }
      });
      if (error) throw error;
      return data;
    },
  });

  const { data: shipmentsData } = useQuery({
    queryKey: ['shiprocket-shipments', 30],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-shiprocket-shipments', {
        body: { dateRange: 30 }
      });
      if (error) throw error;
      return data;
    },
  });

  const productMetrics = useMemo(() => {
    if (!ordersData?.orders) return null;

    const productMap = new Map();
    ordersData.orders.forEach((order: any) => {
      if (!order.product) return;

      const existing = productMap.get(order.product) || {
        product: order.product,
        quantity: 0,
        revenue: 0,
        cost: 0,
        orders: 0,
        vendor: order.vendor,
      };

      productMap.set(order.product, {
        ...existing,
        quantity: existing.quantity + (order.quantity || 0),
        revenue: existing.revenue + (order.orderValue || 0),
        cost: existing.cost + (order.costPrice || 0),
        orders: existing.orders + 1,
      });
    });

    const products = Array.from(productMap.values())
      .map(p => ({
        ...p,
        profit: p.revenue - p.cost,
        margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0,
        avgOrderValue: p.orders > 0 ? p.revenue / p.orders : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const totalProducts = products.length;
    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
    const totalProfit = products.reduce((sum, p) => sum + p.profit, 0);
    const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);

    return {
      products,
      totalProducts,
      totalRevenue,
      totalProfit,
      totalQuantity,
    };
  }, [ordersData]);

  const columns = [
    { header: "Product", accessor: "product", cell: (v: string | null) => v || "N/A" },
    { header: "Vendor", accessor: "vendor", cell: (v: string | null) => v || "N/A" },
    { header: "Orders", accessor: "orders" },
    { header: "Quantity", accessor: "quantity" },
    { header: "Revenue", accessor: "revenue", cell: (v: number) => `₹${v.toFixed(2)}` },
    { header: "Cost", accessor: "cost", cell: (v: number) => `₹${v.toFixed(2)}` },
    { header: "Profit", accessor: "profit", cell: (v: number) => <span className={v >= 0 ? "text-success" : "text-destructive"}>₹{v.toFixed(2)}</span> },
    { header: "Margin", accessor: "margin", cell: (v: number) => `${v.toFixed(1)}%` },
    { header: "AOV", accessor: "avgOrderValue", cell: (v: number) => `₹${v.toFixed(2)}` },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="container mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Product Analytics</h1>
            <p className="text-muted-foreground">Performance by product</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <MetricCard
            title="Total Products"
            value={productMetrics?.totalProducts || 0}
            icon={Package}
          />
          <MetricCard
            title="Total Revenue"
            value={`₹${productMetrics?.totalRevenue.toFixed(0) || 0}`}
            icon={DollarSign}
          />
          <MetricCard
            title="Total Profit"
            value={`₹${productMetrics?.totalProfit.toFixed(0) || 0}`}
            icon={TrendingUp}
            variant={productMetrics && productMetrics.totalProfit >= 0 ? "success" : "destructive"}
          />
          <MetricCard
            title="Total Units Sold"
            value={productMetrics?.totalQuantity || 0}
            icon={ShoppingCart}
          />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Top 10 Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productMetrics?.products.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" angle={-45} textAnchor="end" height={120} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" />
                <Bar dataKey="profit" fill="hsl(var(--chart-2))" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Products</CardTitle>
          </CardHeader>
          <CardContent>
            <AdvancedDataTable
              data={productMetrics?.products || []}
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

export default Products;
