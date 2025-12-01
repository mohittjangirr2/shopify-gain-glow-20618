import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/MetricCard";
import { AdvancedDataTable, StatusBadge } from "@/components/AdvancedDataTable";
import { 
  DollarSign, 
  Package, 
  AlertCircle, 
  Download,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const VendorDashboard = () => {
  const { role, vendorId, isLoading: roleLoading } = useUserRole();
  const [selectedRTO, setSelectedRTO] = useState<any>(null);
  const [rtoDialogOpen, setRtoDialogOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>("received");
  const [vendorNotes, setVendorNotes] = useState<string>("");

  // Fetch vendor details
  const { data: vendorData } = useQuery({
    queryKey: ['vendor-details', vendorId],
    queryFn: async () => {
      if (!vendorId) return null;
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });

  // Fetch orders and shipments
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['vendor-orders', 30],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-shopify-orders', {
        body: { dateRange: 30 }
      });
      if (error) throw error;
      return data;
    },
  });

  const { data: shipmentsData, isLoading: shipmentsLoading } = useQuery({
    queryKey: ['vendor-shipments', 30],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-shiprocket-shipments', {
        body: { dateRange: 30 }
      });
      if (error) throw error;
      return data;
    },
  });

  // Fetch vendor payments
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['vendor-payments', vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const { data, error } = await supabase
        .from('vendor_payments')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });

  // Fetch RTO verifications
  const { data: rtoVerifications, isLoading: rtoLoading, refetch: refetchRTO } = useQuery({
    queryKey: ['rto-verifications', vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const { data, error } = await supabase
        .from('rto_verifications')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });

  // Calculate vendor-specific metrics
  const vendorMetrics = useMemo(() => {
    if (!ordersData?.orders || !shipmentsData?.shipments || !vendorData) {
      return { 
        totalOrders: 0, 
        deliveredOrders: 0, 
        pendingPayment: 0, 
        totalPaid: 0,
        rtosPending: 0,
        vendorOrders: [],
        rtoOrders: []
      };
    }

    const vendorName = vendorData.name;
    
    // Filter orders by vendor
    const vendorOrders = ordersData.orders.filter((order: any) => {
      const lineItems = order.lineItems || [];
      return lineItems.some((item: any) => {
        const itemVendor = item.vendor || order.vendor || '';
        return itemVendor.toLowerCase() === vendorName.toLowerCase();
      });
    });

    // Create shipment lookup
    const shipmentMap = new Map();
    shipmentsData.shipments.forEach((shipment: any) => {
      const key = shipment.orderNumber || shipment.orderId;
      if (key) shipmentMap.set(key, shipment);
    });

    // Enrich vendor orders with shipment data
    const enrichedOrders = vendorOrders.map((order: any) => {
      const shipment = shipmentMap.get(order.orderNumber) || 
                       shipmentMap.get(order.orderName) || 
                       shipmentMap.get(String(order.orderId));
      
      return {
        ...order,
        awbCode: shipment?.awbCode || 'N/A',
        shipmentStatus: shipment?.status || 'Pending',
        courierName: shipment?.courierName || 'N/A',
        labelUrl: shipment?.label_url || null,
      };
    });

    // Calculate delivered orders
    const deliveredOrders = enrichedOrders.filter((order: any) => 
      order.shipmentStatus?.toLowerCase() === 'delivered'
    );

    // Calculate RTO orders
    const rtoOrders = enrichedOrders.filter((order: any) => 
      order.shipmentStatus?.toLowerCase()?.includes('rto')
    );

    // Calculate payment metrics
    const totalPaid = payments?.filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    const pendingPayment = deliveredOrders.reduce((sum, order) => {
      const lineItems = order.lineItems || [];
      const vendorCost = lineItems
        .filter((item: any) => {
          const itemVendor = item.vendor || order.vendor || '';
          return itemVendor.toLowerCase() === vendorName.toLowerCase();
        })
        .reduce((s: number, item: any) => s + ((item.cost || 0) * (item.quantity || 1)), 0);
      return sum + vendorCost;
    }, 0) - totalPaid;

    // Count pending RTOs
    const rtosPending = rtoVerifications?.filter(r => r.verification_status === 'pending').length || 0;

    return {
      totalOrders: vendorOrders.length,
      deliveredOrders: deliveredOrders.length,
      pendingPayment,
      totalPaid,
      rtosPending,
      vendorOrders: enrichedOrders,
      rtoOrders
    };
  }, [ordersData, shipmentsData, vendorData, payments, rtoVerifications]);

  // Handle label download
  const handleDownloadLabel = (order: any) => {
    if (order.labelUrl) {
      window.open(order.labelUrl, '_blank');
      toast.success('Opening shipping label');
    } else {
      toast.error('Label not available for this order');
    }
  };

  // Handle RTO verification
  const handleVerifyRTO = (order: any) => {
    setSelectedRTO(order);
    setVerificationStatus('received');
    setVendorNotes('');
    setRtoDialogOpen(true);
  };

  const submitRTOVerification = async () => {
    if (!selectedRTO || !vendorId || !vendorData) return;

    try {
      const { error } = await supabase
        .from('rto_verifications')
        .upsert({
          vendor_id: vendorId,
          company_id: vendorData.company_id,
          order_id: selectedRTO.orderId || selectedRTO.orderNumber,
          awb_code: selectedRTO.awbCode,
          shipment_id: selectedRTO.shipmentId || null,
          verification_status: verificationStatus,
          vendor_notes: vendorNotes,
          verified_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('RTO verification submitted successfully');
      setRtoDialogOpen(false);
      refetchRTO();
    } catch (error) {
      console.error('Error submitting RTO verification:', error);
      toast.error('Failed to submit verification');
    }
  };

  // Table columns
  const orderColumns = [
    { header: "Order", accessor: "orderNumber", cell: (v: string) => <span className="font-medium">{v}</span> },
    { header: "AWB", accessor: "awbCode" },
    { header: "Customer", accessor: "customerName", cell: (v: string) => v || 'N/A' },
    { header: "Status", accessor: "shipmentStatus", cell: (v: string) => <StatusBadge status={v} /> },
    { header: "Value", accessor: "orderValue", cell: (v: number) => `₹${v?.toFixed(2) || '0.00'}` },
    { 
      header: "Actions", 
      accessor: "actions",
      cell: (_: any, row: any) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownloadLabel(row)}
            disabled={!row.labelUrl}
          >
            <Download className="h-4 w-4 mr-1" />
            Label
          </Button>
          {row.shipmentStatus?.toLowerCase()?.includes('rto') && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleVerifyRTO(row)}
            >
              Verify
            </Button>
          )}
        </div>
      )
    },
  ];

  const paymentColumns = [
    { header: "Order", accessor: "order_number" },
    { header: "Amount", accessor: "amount", cell: (v: number) => `₹${v?.toFixed(2)}` },
    { header: "Status", accessor: "status", cell: (v: string) => (
      <Badge variant={v === 'paid' ? 'default' : 'secondary'}>{v}</Badge>
    )},
    { header: "Date", accessor: "payment_date", cell: (v: string) => v ? new Date(v).toLocaleDateString() : 'Pending' },
  ];

  const rtoColumns = [
    { header: "Order", accessor: "order_id" },
    { header: "AWB", accessor: "awb_code" },
    { header: "Status", accessor: "verification_status", cell: (v: string) => (
      <Badge variant={v === 'received' ? 'default' : v === 'not_received' ? 'destructive' : 'secondary'}>
        {v?.replace('_', ' ')}
      </Badge>
    )},
    { header: "Notes", accessor: "vendor_notes", cell: (v: string) => v || 'N/A' },
    { header: "Verified", accessor: "verified_at", cell: (v: string) => v ? new Date(v).toLocaleDateString() : 'Pending' },
  ];

  if (roleLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (role !== 'vendor') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Access denied. This page is only for vendors.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = ordersLoading || shipmentsLoading || paymentsLoading || rtoLoading;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
            <p className="text-muted-foreground">{vendorData?.name || 'Vendor Panel'}</p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <MetricCard
            title="Total Orders"
            value={vendorMetrics.totalOrders}
            icon={Package}
          />
          <MetricCard
            title="Delivered Orders"
            value={vendorMetrics.deliveredOrders}
            icon={CheckCircle}
            variant="success"
          />
          <MetricCard
            title="Pending Payment"
            value={`₹${vendorMetrics.pendingPayment.toFixed(2)}`}
            icon={Clock}
            variant="warning"
          />
          <MetricCard
            title="Total Paid"
            value={`₹${vendorMetrics.totalPaid.toFixed(2)}`}
            icon={DollarSign}
            variant="success"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">
              <Package className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="payments">
              <DollarSign className="h-4 w-4 mr-2" />
              Payment History
            </TabsTrigger>
            <TabsTrigger value="rto">
              <AlertCircle className="h-4 w-4 mr-2" />
              RTO Verification
              {vendorMetrics.rtosPending > 0 && (
                <Badge variant="destructive" className="ml-2">{vendorMetrics.rtosPending}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>My Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading orders...</div>
                ) : (
                  <AdvancedDataTable
                    data={vendorMetrics.vendorOrders}
                    columns={orderColumns}
                    searchable={true}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading payments...</div>
                ) : (
                  <AdvancedDataTable
                    data={payments || []}
                    columns={paymentColumns}
                    searchable={true}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rto">
            <Card>
              <CardHeader>
                <CardTitle>RTO Verification</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Verify returned orders to ensure accurate payment processing
                </p>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading RTO data...</div>
                ) : (
                  <>
                    {vendorMetrics.rtoOrders.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4">Pending RTO Orders</h3>
                        <AdvancedDataTable
                          data={vendorMetrics.rtoOrders}
                          columns={orderColumns}
                          searchable={true}
                        />
                      </div>
                    )}
                    <h3 className="text-lg font-semibold mb-4">Verification History</h3>
                    <AdvancedDataTable
                      data={rtoVerifications || []}
                      columns={rtoColumns}
                      searchable={true}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* RTO Verification Dialog */}
      <Dialog open={rtoDialogOpen} onOpenChange={setRtoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify RTO Order</DialogTitle>
            <DialogDescription>
              Order: {selectedRTO?.orderNumber} | AWB: {selectedRTO?.awbCode}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Verification Status</Label>
              <RadioGroup value={verificationStatus} onValueChange={setVerificationStatus}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="received" id="received" />
                  <Label htmlFor="received" className="cursor-pointer">Received (Product returned in good condition)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not_received" id="not_received" />
                  <Label htmlFor="not_received" className="cursor-pointer">Not Received (Product not returned)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="received_broken" id="received_broken" />
                  <Label htmlFor="received_broken" className="cursor-pointer">Received Broken (Product damaged)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="received_wrong" id="received_wrong" />
                  <Label htmlFor="received_wrong" className="cursor-pointer">Received Wrong Item</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about this RTO..."
                value={vendorNotes}
                onChange={(e) => setVendorNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRtoDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRTOVerification}>
              Submit Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorDashboard;
