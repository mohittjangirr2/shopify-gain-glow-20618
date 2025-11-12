import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Download, MapPin } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { DataTable } from "@/components/DataTable";
import { OrderShipmentDialog } from "@/components/OrderShipmentDialog";
import { toast } from "sonner";

const InTransit = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading } = useDashboardData(30, false);

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleTrackShipment = (trackingNumber: string) => {
    toast.success(`Tracking: ${trackingNumber}`);
    // TODO: Open tracking URL
  };

  const handleDownloadLabel = (shipmentId: string) => {
    toast.success(`Downloading label for ${shipmentId}...`);
    // TODO: Implement label download
  };

  if (isLoading) return <DashboardSkeleton />;

  const inTransitShipments = data?.shiprocket?.shipments?.filter((s: any) => 
    s.status?.toLowerCase().includes('transit') ||
    s.status?.toLowerCase().includes('shipped') ||
    s.status?.toLowerCase().includes('out for delivery')
  ) || [];

  const columns: any[] = [
    { header: 'Order #', accessor: 'orderNumber' },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Tracking', accessor: 'trackingNumber' },
    { header: 'Status', accessor: 'status' },
    { header: 'Courier', accessor: 'courierName' },
  ];

  const enrichedShipments = inTransitShipments.map((shipment: any) => ({
    ...shipment,
    actions: (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => handleTrackShipment(shipment.trackingNumber)}>
          <MapPin className="h-4 w-4 mr-1" />
          Track
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleDownloadLabel(shipment.id)}>
          <Download className="h-4 w-4 mr-1" />
          Label
        </Button>
      </div>
    )
  }));

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">In Transit</h1>
          <div className="text-sm text-muted-foreground">
            {inTransitShipments.length} shipments in transit
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Active Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable 
              data={enrichedShipments}
              columns={[...columns, { header: 'Actions', accessor: 'actions' }]}
            />
          </CardContent>
        </Card>

        <OrderShipmentDialog
          order={selectedOrder}
          shipments={data?.shiprocket?.shipments || []}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </div>
    </div>
  );
};

export default InTransit;
