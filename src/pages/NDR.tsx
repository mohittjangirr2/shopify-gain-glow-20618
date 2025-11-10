import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/MetricCard";
import { AdvancedDataTable, StatusBadge } from "@/components/AdvancedDataTable";
import { OrderShipmentDialog } from "@/components/OrderShipmentDialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Package, TrendingUp, Phone } from "lucide-react";

const NDR = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: shipmentsData, isLoading } = useQuery({
    queryKey: ['shiprocket-shipments-ndr'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-shiprocket-shipments', {
        body: { dateRange: 90 }
      });
      if (error) throw error;
      return data;
    },
  });

  const ndrOrders = useMemo(() => {
    if (!shipmentsData?.shipments) return [];
    
    return shipmentsData.shipments.filter((shipment: any) => {
      const status = shipment.status?.toLowerCase() || '';
      return status.includes('ndr') || status === 'pending';
    });
  }, [shipmentsData]);

  const ndrMetrics = useMemo(() => {
    const totalNDR = ndrOrders.length;
    const totalValue = ndrOrders.reduce((sum: number, s: any) => 
      sum + (parseFloat(s.orderValue) || 0), 0
    );
    const totalShippingCost = ndrOrders.reduce((sum: number, s: any) => 
      sum + (parseFloat(s.shippingCharge) || 0), 0
    );

    return {
      totalNDR,
      totalValue,
      totalShippingCost,
    };
  }, [ndrOrders]);

  const columns = [
    { header: "AWB", accessor: "awb", cell: (v: string | null) => v || "-" },
    { header: "Order #", accessor: "orderNumber", cell: (v: string | null) => v || "-" },
    { header: "Customer", accessor: "customerName", cell: (v: string | null) => v || "-" },
    { header: "Phone", accessor: "customerPhone", cell: (v: string | null) => v || "-" },
    { header: "State", accessor: "customerState", cell: (v: string | null) => v || "-" },
    { header: "Status", accessor: "status", cell: (v: string | null) => v ? <StatusBadge status={v} /> : "-" },
    { header: "Order Value", accessor: "orderValue", cell: (v: any) => v ? `₹${parseFloat(v).toFixed(2)}` : "-" },
    { header: "Shipping Cost", accessor: "shippingCharge", cell: (v: any) => v ? `₹${parseFloat(v).toFixed(2)}` : "-" },
    { header: "Courier", accessor: "courier", cell: (v: string | null) => v || "-" },
    { header: "ETD", accessor: "etd", cell: (v: string | null) => 
      v && v !== "0000-00-00 00:00:00" ? new Date(v).toLocaleDateString() : "-" 
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-16 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 md:px-6">
          <div>
            <h1 className="text-2xl font-bold">NDR (Non-Delivery Report)</h1>
            <p className="text-sm text-muted-foreground">Orders requiring attention</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:px-6 md:py-8">
        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3 md:gap-6 md:mb-8">
          <MetricCard
            title="Total NDR Orders"
            value={ndrMetrics.totalNDR}
            icon={AlertCircle}
            variant="warning"
          />
          <MetricCard
            title="Total Value at Risk"
            value={`₹${ndrMetrics.totalValue.toFixed(2)}`}
            icon={TrendingUp}
            variant="destructive"
          />
          <MetricCard
            title="Shipping Cost"
            value={`₹${ndrMetrics.totalShippingCost.toFixed(2)}`}
            icon={Package}
          />
        </div>

        <AdvancedDataTable
          data={ndrOrders}
          columns={columns}
          searchable={true}
          isLoading={isLoading}
        />

        <div className="mt-6 p-6 bg-muted/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Phone className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-2">NDR Follow-up Guide</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Contact customers immediately to verify delivery address and availability</li>
                <li>• Confirm phone numbers are correct and reachable</li>
                <li>• Reschedule delivery for a convenient time if customer is unavailable</li>
                <li>• Update customer address if incorrect in the shipping system</li>
                <li>• Monitor courier updates and follow up regularly to prevent RTO</li>
              </ul>
            </div>
          </div>
        </div>

        <OrderShipmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          order={selectedOrder}
          shipments={shipmentsData?.shipments || []}
        />
      </main>
    </div>
  );
};

export default NDR;
