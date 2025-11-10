import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, MapPin, Calendar } from "lucide-react";

interface OrderShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  shipments: any[];
}

export const OrderShipmentDialog = ({ open, onOpenChange, order, shipments }: OrderShipmentDialogProps) => {
  if (!order) return null;

  const relatedShipments = shipments.filter(
    s => s.orderNumber === order.orderName || s.orderId === order.orderId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details: {order.orderName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{order.customerName || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{order.phone || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Province</p>
              <p className="font-medium">{order.province || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Product</p>
              <p className="font-medium">{order.product || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Value</p>
              <p className="font-medium">₹{order.orderValue?.toFixed(2) || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cost Price</p>
              <p className="font-medium">₹{order.costPrice?.toFixed(2) || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profit</p>
              <p className="font-medium text-success">₹{order.profit?.toFixed(2) || 0}</p>
            </div>
          </div>

          {/* Shipments */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Shipment Details ({relatedShipments.length})
            </h3>
            
            {relatedShipments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No shipment data available</p>
            ) : (
              <div className="space-y-4">
                {relatedShipments.map((shipment, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">AWB: {shipment.awb || "-"}</p>
                        <p className="text-sm text-muted-foreground">{shipment.courier || "-"}</p>
                      </div>
                      <Badge>{shipment.status || "Pending"}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Customer</p>
                        <p className="font-medium">{shipment.customerName || "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{shipment.customerPhone || "-"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Address
                        </p>
                        <p className="font-medium">
                          {shipment.customerAddress || "-"}, {shipment.customerState || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Weight</p>
                        <p className="font-medium">{shipment.weight} kg</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Dimensions</p>
                        <p className="font-medium">{shipment.dimensions || "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Freight Charges</p>
                        <p className="font-medium">₹{shipment.freightCharges?.toFixed(2) || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">COD Charges</p>
                        <p className="font-medium">₹{shipment.codCharges?.toFixed(2) || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Shipping</p>
                        <p className="font-medium">₹{shipment.shippingCharge?.toFixed(2) || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Other Charges</p>
                        <p className="font-medium">₹{shipment.otherCharges?.toFixed(2) || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Payment Method</p>
                        <p className="font-medium">{shipment.paymentMethod || "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          ETD
                        </p>
                        <p className="font-medium">{shipment.etd || "-"}</p>
                      </div>
                      {shipment.invoiceNo && (
                        <div>
                          <p className="text-muted-foreground">Invoice</p>
                          <p className="font-medium">{shipment.invoiceNo}</p>
                        </div>
                      )}
                      {shipment.brandName && (
                        <div>
                          <p className="text-muted-foreground">Brand</p>
                          <p className="font-medium">{shipment.brandName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
