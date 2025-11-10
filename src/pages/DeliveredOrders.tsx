import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { AdvancedDataTable, StatusBadge } from "@/components/AdvancedDataTable";
import { OrderShipmentDialog } from "@/components/OrderShipmentDialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, TrendingUp } from "lucide-react";

const DeliveredOrders = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const deliveredMetrics = useMemo(() => {
    if (!shipmentsData?.shipments) return null;

    const shipments = shipmentsData.shipments;
    const deliveredShipments = shipments.filter((s: any) => 
      s.status?.toLowerCase() === 'delivered'
    ).sort((a: any, b: any) => {
      const dateA = new Date(a.deliveredDate || a.pickupScheduledDate || 0).getTime();
      const dateB = new Date(b.deliveredDate || b.pickupScheduledDate || 0).getTime();
      return dateB - dateA;
    });

    const totalDelivered = deliveredShipments.length;
    const totalRevenue = deliveredShipments.reduce((sum: number, s: any) => 
      sum + (parseFloat(s.orderValue) || 0), 0
    );
    const totalShippingCost = deliveredShipments.reduce((sum: number, s: any) => 
      sum + (parseFloat(s.shippingCharge) || 0), 0
    );

    return {
      totalDelivered,
      totalRevenue,
      totalShippingCost,
      deliveredShipments,
    };
  }, [shipmentsData]);

  const columns = [
    { header: "Order #", accessor: "orderNumber", cell: (v: string | null) => v || "-" },
    { header: "AWB", accessor: "awb", cell: (v: string | null) => v || "-" },
    { header: "Customer", accessor: "customerName", cell: (v: string | null) => v || "-" },
    { header: "State", accessor: "customerState", cell: (v: string | null) => v || "-" },
    { header: "Status", accessor: "status", cell: (v: string | null) => v ? <StatusBadge status={v} /> : "-" },
    { header: "Order Value", accessor: "orderValue", cell: (v: any) => v ? `₹${parseFloat(v).toFixed(2)}` : "-" },
    { header: "Shipping Cost", accessor: "shippingCharge", cell: (v: any) => v ? `₹${parseFloat(v).toFixed(2)}` : "-" },
    { header: "Delivered Date", accessor: "deliveredDate", cell: (v: string | null) => 
      v ? new Date(v).toLocaleDateString() : "-" 
    },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="container mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle className="h-8 w-8 text-success" />
          <div>
            <h1 className="text-3xl font-bold">Delivered Orders</h1>
            <p className="text-muted-foreground">Successfully delivered shipments</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <MetricCard
            title="Total Delivered"
            value={deliveredMetrics?.totalDelivered || 0}
            icon={CheckCircle}
            variant="success"
          />
          <MetricCard
            title="Total Revenue"
            value={`₹${(deliveredMetrics?.totalRevenue || 0).toFixed(2)}`}
            icon={TrendingUp}
            variant="success"
          />
          <MetricCard
            title="Shipping Cost"
            value={`₹${(deliveredMetrics?.totalShippingCost || 0).toFixed(2)}`}
            icon={Package}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Delivered Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdvancedDataTable
              data={deliveredMetrics?.deliveredShipments || []}
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

export default DeliveredOrders;
