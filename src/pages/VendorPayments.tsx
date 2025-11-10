import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { AdvancedDataTable } from "@/components/AdvancedDataTable";
import { DollarSign, Package, CheckCircle, TrendingUp } from "lucide-react";

const VendorPayments = () => {
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

  const vendorMetrics = useMemo(() => {
    if (!ordersData?.orders || !shipmentsData?.shipments) return null;

    const deliveredOrderIds = new Set<string>();
    shipmentsData.shipments.forEach((shipment: any) => {
      if (shipment.status?.toLowerCase() === 'delivered') {
        if (shipment.orderNumber) deliveredOrderIds.add(shipment.orderNumber);
        if (shipment.orderId) deliveredOrderIds.add(shipment.orderId);
      }
    });

    // Calculate vendor costs only for delivered orders
    const vendorData = new Map();
    ordersData.orders.forEach((order: any) => {
      const isDelivered = deliveredOrderIds.has(order.orderId || order.orderNumber);
      if (!isDelivered) return; // Only count delivered orders

      const vendor = order.vendor || 'Unknown Vendor';
      const costPrice = order.costPrice || 0;

      const existing = vendorData.get(vendor) || {
        vendor,
        totalCost: 0,
        deliveredOrders: 0,
        revenue: 0,
      };

      vendorData.set(vendor, {
        ...existing,
        totalCost: existing.totalCost + costPrice,
        deliveredOrders: existing.deliveredOrders + 1,
        revenue: existing.revenue + (order.orderValue || 0),
      });
    });

    const vendorPayments = Array.from(vendorData.values()).sort((a, b) => b.totalCost - a.totalCost);
    const totalVendorCost = vendorPayments.reduce((sum, v) => sum + v.totalCost, 0);
    const totalDeliveredOrders = vendorPayments.reduce((sum, v) => sum + v.deliveredOrders, 0);

    return {
      vendorPayments,
      totalVendorCost,
      totalDeliveredOrders,
      vendorCount: vendorPayments.length,
    };
  }, [ordersData, shipmentsData]);

  const columns = [
    { header: "Vendor", accessor: "vendor", cell: (v: string) => v || "Unknown" },
    { header: "Delivered Orders", accessor: "deliveredOrders" },
    { header: "Total Cost to Pay", accessor: "totalCost", cell: (v: number) => `₹${v.toFixed(2)}` },
    { header: "Revenue from Orders", accessor: "revenue", cell: (v: number) => `₹${v.toFixed(2)}` },
    { header: "Margin", accessor: "margin", cell: (_: any, row: any) => {
      const margin = row.revenue - row.totalCost;
      return <span className={margin >= 0 ? "text-success font-medium" : "text-destructive font-medium"}>₹{margin.toFixed(2)}</span>;
    }},
  ];

  if (ordersLoading || shipmentsLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="container mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Vendor Payments</h1>
            <p className="text-muted-foreground">Track payments owed to vendors for delivered orders</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <MetricCard
            title="Total Owed to Vendors"
            value={`₹${(vendorMetrics?.totalVendorCost || 0).toFixed(2)}`}
            icon={DollarSign}
            variant="warning"
          />
          <MetricCard
            title="Delivered Orders"
            value={vendorMetrics?.totalDeliveredOrders || 0}
            icon={CheckCircle}
            variant="success"
          />
          <MetricCard
            title="Active Vendors"
            value={vendorMetrics?.vendorCount || 0}
            icon={Package}
          />
          <MetricCard
            title="Avg Cost per Order"
            value={`₹${vendorMetrics?.totalDeliveredOrders ? (vendorMetrics.totalVendorCost / vendorMetrics.totalDeliveredOrders).toFixed(2) : '0.00'}`}
            icon={TrendingUp}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Vendor Payment Details
            </CardTitle>
            <p className="text-sm text-muted-foreground">Payments calculated only for delivered orders</p>
          </CardHeader>
          <CardContent>
            <AdvancedDataTable
              data={vendorMetrics?.vendorPayments || []}
              columns={columns}
              searchable={true}
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Payment Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Important:</strong> Vendor payments are calculated only for successfully delivered orders.
            </p>
            <p className="text-sm text-muted-foreground">
              • Cost prices are fetched from Shopify product data
            </p>
            <p className="text-sm text-muted-foreground">
              • Payments are processed only after delivery confirmation
            </p>
            <p className="text-sm text-muted-foreground">
              • RTO and cancelled orders are excluded from payment calculations
            </p>
            <p className="text-sm text-muted-foreground">
              • Margin shown is (Revenue - Vendor Cost) for delivered orders
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorPayments;
