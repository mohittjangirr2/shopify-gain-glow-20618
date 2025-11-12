import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Download, Send } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { DataTable } from "@/components/DataTable";
import { OrderShipmentDialog } from "@/components/OrderShipmentDialog";
import { toast } from "sonner";

const NewOrders = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading } = useDashboardData(30, false);

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleShipOrder = async (orderId: string) => {
    toast.success(`Shipping order ${orderId}...`);
    // TODO: Implement Shiprocket ship order API call
  };

  const handleDownloadLabel = async (orderId: string) => {
    toast.success(`Downloading label for ${orderId}...`);
    // TODO: Implement Shiprocket label download
  };

  if (isLoading) return <DashboardSkeleton />;

  const newOrders = data?.shopify?.orders?.filter((order: any) => 
    !data?.shiprocket?.shipments?.find((s: any) => 
      s.orderNumber === order.orderNumber || s.orderId === order.id
    )
  ) || [];

  const columns: any[] = [
    { header: 'Order #', accessor: 'orderNumber' },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Amount', accessor: 'totalPrice' },
    { header: 'Date', accessor: 'createdAt' },
  ];

  const enrichedOrders = newOrders.map((order: any) => ({
    ...order,
    actions: (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => handleShipOrder(order.id)}>
          <Send className="h-4 w-4 mr-1" />
          Ship
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleDownloadLabel(order.id)}>
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
          <h1 className="text-4xl font-bold">New Orders</h1>
          <div className="text-sm text-muted-foreground">
            {newOrders.length} pending orders
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Orders Awaiting Shipment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable 
              data={enrichedOrders}
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

export default NewOrders;
