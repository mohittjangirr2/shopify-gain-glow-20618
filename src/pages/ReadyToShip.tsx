import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PackageCheck, Download, Send } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { DataTable } from "@/components/DataTable";
import { OrderShipmentDialog } from "@/components/OrderShipmentDialog";
import { toast } from "sonner";

const ReadyToShip = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading } = useDashboardData(30, false);

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleShipOrder = async (shipmentId: string) => {
    toast.success(`Dispatching shipment ${shipmentId}...`);
    // TODO: Implement Shiprocket dispatch API
  };

  const handleDownloadLabel = async (shipmentId: string) => {
    toast.success(`Downloading label for ${shipmentId}...`);
    // TODO: Implement label download
  };

  if (isLoading) return <DashboardSkeleton />;

  const readyToShipOrders = data?.shiprocket?.shipments?.filter((s: any) => 
    s.status?.toLowerCase().includes('ready') || 
    s.status?.toLowerCase().includes('pickup')
  ) || [];

  const columns: any[] = [
    { header: 'Order #', accessor: 'orderNumber' },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Status', accessor: 'status' },
    { header: 'Date', accessor: 'createdAt' },
  ];

  const enrichedShipments = readyToShipOrders.map((shipment: any) => ({
    ...shipment,
    actions: (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => handleShipOrder(shipment.id)}>
          <Send className="h-4 w-4 mr-1" />
          Dispatch
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
          <h1 className="text-4xl font-bold">Ready To Ship</h1>
          <div className="text-sm text-muted-foreground">
            {readyToShipOrders.length} shipments ready
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5" />
              Shipments Ready for Dispatch
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

export default ReadyToShip;
