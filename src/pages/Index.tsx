import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricCard } from "@/components/MetricCard";
import { AdvancedDataTable, StatusBadge } from "@/components/AdvancedDataTable";
import { ApiStatus } from "@/components/ApiStatus";
import { OrderShipmentDialog } from "@/components/OrderShipmentDialog";
import { getDefaultSettings, calculateTotalFees } from "@/lib/feeCalculations";
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  AlertCircle, 
  RefreshCw,
  ShoppingCart,
  Truck,
  Target,
  Calendar,
  TrendingDown
} from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const Index = () => {
  const [dateRange, setDateRange] = useState<number | 'today'>(30);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [apiErrors, setApiErrors] = useState<Array<{ service: string; error: string; status: "error" | "success" | "warning" }>>([]);
  const [disabledApis, setDisabledApis] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch Shopify Orders
  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders, error: ordersError } = useQuery({
    queryKey: ['shopify-orders', dateRange],
    queryFn: async () => {
      if (disabledApis.has('shopify')) throw new Error('Shopify API temporarily disabled');
      const { data, error } = await supabase.functions.invoke('fetch-shopify-orders', {
        body: { dateRange }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: autoRefresh && !disabledApis.has('shopify') ? 10000 : false,
    retry: false,
    enabled: !disabledApis.has('shopify'),
  });

  // Fetch Facebook Ads
  const { data: adsData, isLoading: adsLoading, refetch: refetchAds, error: adsError } = useQuery({
    queryKey: ['facebook-ads', dateRange],
    queryFn: async () => {
      if (disabledApis.has('facebook')) throw new Error('Facebook API temporarily disabled');
      const { data, error } = await supabase.functions.invoke('fetch-facebook-ads', {
        body: { dateRange }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: autoRefresh && !disabledApis.has('facebook') ? 10000 : false,
    retry: false,
    enabled: !disabledApis.has('facebook'),
  });

  // Fetch Shiprocket Shipments
  const { data: shipmentsData, isLoading: shipmentsLoading, refetch: refetchShipments, error: shipmentsError } = useQuery({
    queryKey: ['shiprocket-shipments', dateRange],
    queryFn: async () => {
      if (disabledApis.has('shiprocket')) throw new Error('Shiprocket API temporarily disabled');
      const { data, error } = await supabase.functions.invoke('fetch-shiprocket-shipments', {
        body: { dateRange }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: autoRefresh && !disabledApis.has('shiprocket') ? 10000 : false,
    retry: false,
    enabled: !disabledApis.has('shiprocket'),
  });

  // Track API errors
  useEffect(() => {
    const errors: Array<{ service: string; error: string; status: "error" | "success" | "warning" }> = [];
    const newDisabledApis = new Set(disabledApis);
    
    if (ordersError) {
      errors.push({ 
        service: "Shopify", 
        error: ordersError instanceof Error ? ordersError.message : "Connection failed",
        status: "error" 
      });
    }
    
    if (adsError) {
      const errorMsg = adsError instanceof Error ? adsError.message : "Connection failed";
      const cleanError = errorMsg.includes("error") ? errorMsg.split("error")[1]?.replace(/[":{}]/g, "").trim() || errorMsg : errorMsg;
      
      if (!disabledApis.has('facebook') && cleanError !== 'Facebook API temporarily disabled') {
        errors.push({ service: "Facebook Ads", error: cleanError, status: "warning" });
        newDisabledApis.add('facebook');
      }
    }
    
    if (shipmentsError) {
      const errorMsg = shipmentsError instanceof Error ? shipmentsError.message : "Connection failed";
      const cleanError = errorMsg.includes("error") ? errorMsg.split("error")[1]?.replace(/[":{}]/g, "").trim() || errorMsg : errorMsg;
      
      if (!disabledApis.has('shiprocket') && cleanError !== 'Shiprocket API temporarily disabled') {
        errors.push({ service: "Shiprocket", error: cleanError, status: "error" });
        if (cleanError.includes("blocked")) newDisabledApis.add('shiprocket');
      }
    }
    
    setApiErrors(errors);
    if (newDisabledApis.size !== disabledApis.size) {
      setDisabledApis(newDisabledApis);
      if (autoRefresh && newDisabledApis.size > 0) {
        setAutoRefresh(false);
        toast.info("Auto-refresh disabled due to API errors");
      }
    }
  }, [ordersError, adsError, shipmentsError]);

  const handleManualRefresh = () => {
    setDisabledApis(new Set());
    setApiErrors([]);
    setTimeout(() => {
      refetchOrders();
      refetchAds();
      refetchShipments();
      toast.success("Retrying all connections...");
    }, 100);
  };

  // Calculate analytics with fee calculations
  const analytics = useMemo(() => {
    const settings = getDefaultSettings();
    const totalRevenue = ordersData?.orders?.reduce((sum: number, order: any) => sum + order.orderValue, 0) || 0;
    const totalCost = ordersData?.orders?.reduce((sum: number, order: any) => sum + (order.costPrice || 0), 0) || 0;
    const totalOrders = ordersData?.total || 0;
    const totalAdSpend = adsData?.totalSpend || 0;
    const totalShippingCost = shipmentsData?.metrics?.totalShippingCost || 0;
    const rtoCount = shipmentsData?.metrics?.rtoCount || 0;
    const rtoPercentage = shipmentsData?.metrics?.rtoPercentage || 0;
    const deliveredCount = shipmentsData?.metrics?.deliveredCount || 0;
    const deliveredPercentage = shipmentsData?.metrics?.deliveredPercentage || 0;
    const outForDeliveryCount = shipmentsData?.metrics?.outForDeliveryCount || 0;
    const ndrCount = shipmentsData?.metrics?.ndrCount || 0;
    const walletBalance = shipmentsData?.walletBalance || 0;

    // Build set of delivered order IDs from shipments
    const deliveredOrderIds = new Set<string>();
    shipmentsData?.shipments?.forEach((shipment: any) => {
      if (shipment.status?.toLowerCase() === 'delivered') {
        if (shipment.orderNumber) deliveredOrderIds.add(shipment.orderNumber);
        if (shipment.orderId) deliveredOrderIds.add(shipment.orderId);
      }
    });

    // Calculate fees based on settings and delivered orders
    const { totalFees, breakdown } = calculateTotalFees(ordersData?.orders || [], settings, deliveredOrderIds);
    
    // Calculate RTO revenue loss (orders that were RTO'd)
    const rtoOrders = shipmentsData?.shipments?.filter((s: any) => {
      const status = s.status?.toLowerCase() || '';
      const rtoStatus = s.rtoStatus?.toLowerCase() || '';
      return (status.includes('rto') || rtoStatus.includes('rto')) && !status.includes('ndr');
    }) || [];
    
    const rtoRevenueLoss = rtoOrders.reduce((sum: number, shipment: any) => {
      const matchingOrder = ordersData?.orders?.find((o: any) => 
        o.orderNumber === shipment.orderNumber || o.orderId === shipment.orderId
      );
      return sum + (matchingOrder?.orderValue || 0);
    }, 0);
    
    const totalProfit = totalRevenue - (totalCost + totalAdSpend + totalShippingCost + totalFees + rtoRevenueLoss);
    const roi = totalAdSpend > 0 ? (totalRevenue / totalAdSpend) * 100 : 0;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue,
      totalCost,
      totalOrders,
      totalAdSpend,
      totalShippingCost,
      rtoCount,
      rtoPercentage,
      deliveredCount,
      deliveredPercentage,
      outForDeliveryCount,
      ndrCount,
      totalFees,
      feeBreakdown: breakdown,
      rtoRevenueLoss,
      walletBalance,
      totalProfit,
      roi,
      aov,
    };
  }, [ordersData, adsData, shipmentsData]);

  // Best selling products
  const bestSellers = useMemo(() => {
    if (!ordersData?.orders) return [];
    
    const productMap = new Map();
    ordersData.orders.forEach((order: any) => {
      if (!order.product) return;
      
      const existing = productMap.get(order.product) || {
        product: order.product,
        quantity: 0,
        revenue: 0,
        cost: 0,
        orders: 0,
      };
      
      productMap.set(order.product, {
        ...existing,
        quantity: existing.quantity + (order.quantity || 0),
        revenue: existing.revenue + (order.orderValue || 0),
        cost: existing.cost + (order.costPrice || 0),
        orders: existing.orders + 1,
      });
    });
    
    return Array.from(productMap.values())
      .map(p => ({ ...p, profit: p.revenue - p.cost }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [ordersData]);
  const columns = [
    { header: "Order Name", accessor: "name", cell: (v: string | null) => v || "N/A" },
    { header: "Customer", accessor: "customerName", cell: (v: string | null) => v || "N/A" },
    { header: "Phone", accessor: "phone", cell: (v: string | null) => v || "N/A" },
    { header: "Product", accessor: "product", cell: (v: string | null) => v || "N/A" },
    { header: "Order Value", accessor: "orderValue", cell: (v: number) => `₹${v.toFixed(2)}` },
    { header: "Cost", accessor: "costPrice", cell: (v: number) => v ? `₹${v.toFixed(2)}` : "N/A" },
    { header: "Profit", accessor: "profit", cell: (v: number) => <span className={v >= 0 ? "text-success" : "text-destructive"}>₹{v.toFixed(2)}</span> },
    { header: "Financial Status", accessor: "orderStatus", cell: (v: string | null) => v ? <StatusBadge status={v} /> : "N/A" },
    { header: "Fulfillment", accessor: "fulfillmentStatus", cell: (v: string | null) => v ? <StatusBadge status={v} /> : "N/A" },
  ];

  // Daily profit tracking
  const dailyProfitData = useMemo(() => {
    if (!ordersData?.orders) return [];
    
    const dailyMap = new Map();
    ordersData.orders.forEach((order: any) => {
      const date = new Date(order.createdAt).toLocaleDateString();
      const existing = dailyMap.get(date) || { date, revenue: 0, cost: 0, orders: 0 };
      
      dailyMap.set(date, {
        ...existing,
        revenue: existing.revenue + (order.orderValue || 0),
        cost: existing.cost + (order.costPrice || 0),
        orders: existing.orders + 1,
      });
    });
    
    return Array.from(dailyMap.values())
      .map(d => ({ ...d, profit: d.revenue - d.cost }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
  }, [ordersData]);

  // Updated columns - remove null values and make orders clickable
  const ordersColumns = [
    { header: "Order #", accessor: "orderName", cell: (value: string, row: any) => (
      <Button variant="link" className="p-0 h-auto font-medium" onClick={() => { setSelectedOrder(row); setDialogOpen(true); }}>
        {value}
      </Button>
    )},
    { header: "Date", accessor: "createdAt", cell: (value: string) => new Date(value).toLocaleDateString() },
    { header: "Customer", accessor: "customerName", cell: (v: string | null) => v || "-" },
    { header: "Phone", accessor: "phone", cell: (v: string | null) => v || "-" },
    { header: "Province", accessor: "province", cell: (v: string | null) => v || "-" },
    { header: "Product", accessor: "product", cell: (v: string | null) => v || "-" },
    { header: "Qty", accessor: "quantity" },
    { header: "Price", accessor: "price", cell: (v: string | null) => v ? `₹${parseFloat(v).toFixed(2)}` : "-" },
    { header: "Cost", accessor: "costPrice", cell: (v: number) => `₹${v.toFixed(2)}` },
    { header: "Total", accessor: "totalPrice", cell: (v: string | null) => v ? `₹${parseFloat(v).toFixed(2)}` : "-" },
    { header: "Profit", accessor: "profit", cell: (v: number) => <span className="text-success font-medium">₹{v.toFixed(2)}</span> },
    { header: "Payment", accessor: "orderStatus", cell: (v: string) => <StatusBadge status={v} /> },
    { header: "Fulfillment", accessor: "fulfillmentStatus", cell: (v: string | null) => v ? <StatusBadge status={v} /> : "-" },
    { header: "Vendor", accessor: "vendor", cell: (v: string | null) => v || "-" },
  ];

  const campaignsColumns = [
    { header: "Campaign", accessor: "campaignName" },
    { header: "Spend", accessor: "spend", cell: (v: number) => `₹${v.toFixed(2)}` },
    { header: "Impressions", accessor: "impressions" },
    { header: "Clicks", accessor: "clicks" },
    { header: "CTR", accessor: "ctr", cell: (v: number) => `${v.toFixed(2)}%` },
    { header: "CPC", accessor: "cpc", cell: (v: number) => `₹${v.toFixed(2)}` },
    { header: "Purchases", accessor: "purchases" },
    { header: "ROAS", accessor: "roas", cell: (v: number) => `${v.toFixed(2)}x` },
  ];

  const shipmentsColumns = [
    { header: "Order ID", accessor: "orderId", cell: (v: string | null) => v || "-" },
    { header: "Order #", accessor: "orderNumber", cell: (v: string | null) => v || "-" },
    { header: "Customer", accessor: "customerName", cell: (v: string | null) => v || "-" },
    { header: "Phone", accessor: "customerPhone", cell: (v: string | null) => v || "-" },
    { header: "Address", accessor: "customerAddress", cell: (v: string | null) => v || "-" },
    { header: "State", accessor: "customerState", cell: (v: string | null) => v || "-" },
    { header: "AWB", accessor: "awb", cell: (v: string | null) => v || "-" },
    { header: "Courier", accessor: "courier", cell: (v: string | null) => v || "-" },
    { header: "Weight", accessor: "weight", cell: (v: number) => `${v} kg` },
    { header: "Dimensions", accessor: "dimensions", cell: (v: string | null) => v || "-" },
    { header: "Shipping", accessor: "shippingCharge", cell: (v: number) => `₹${v.toFixed(2)}` },
    { header: "COD", accessor: "codCharges", cell: (v: number) => `₹${v.toFixed(2)}` },
    { header: "Status", accessor: "status", cell: (v: string | null) => v ? <StatusBadge status={v} /> : "-" },
    { header: "Payment", accessor: "paymentMethod", cell: (v: string | null) => v || "-" },
    { header: "ETD", accessor: "etd", cell: (v: string | null) => v && v !== "0000-00-00 00:00:00" ? new Date(v).toLocaleDateString() : "-" },
    { header: "Invoice", accessor: "invoiceNo", cell: (v: string | null) => v || "-" },
    { header: "Brand", accessor: "brandName", cell: (v: string | null) => v || "-" },
  ];

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-16 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-3 md:px-6 md:py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Analytics Overview</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <Select value={dateRange.toString()} onValueChange={(val) => setDateRange(val === 'today' ? 'today' : Number(val))}>
                <SelectTrigger className="w-[130px] md:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleManualRefresh} variant="outline" size="icon" className="flex-shrink-0">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button 
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? "default" : "outline"}
                disabled={disabledApis.size > 0}
                className="hidden md:flex"
              >
                Auto-Refresh {autoRefresh ? "ON" : "OFF"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:px-6 md:py-8">
        <ApiStatus errors={apiErrors} onRetry={handleManualRefresh} />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4 md:grid-cols-4 md:gap-4 md:mb-8">
          <MetricCard title="Revenue" value={`₹${analytics.totalRevenue.toFixed(0)}`} icon={DollarSign} variant="default" />
          <MetricCard title="Profit" value={`₹${analytics.totalProfit.toFixed(0)}`} icon={TrendingUp} variant={analytics.totalProfit >= 0 ? "success" : "destructive"} />
          <MetricCard title="Shipping Cost" value={`₹${analytics.totalShippingCost.toFixed(0)}`} icon={Package} variant="warning" />
          <MetricCard title="Ad Spend" value={`₹${analytics.totalAdSpend.toFixed(0)}`} icon={Target} variant="default" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6 md:grid-cols-5 md:gap-4 md:mb-8">
          <MetricCard title="Out for Delivery" value={analytics.outForDeliveryCount} icon={Truck} variant="success" />
          <MetricCard title="Total Orders" value={analytics.totalOrders} icon={ShoppingCart} />
          <MetricCard title="RTO %" value={`${analytics.rtoPercentage.toFixed(1)}%`} icon={TrendingDown} variant="destructive" />
          <MetricCard title="AOV" value={`₹${analytics.aov.toFixed(0)}`} icon={DollarSign} />
          <MetricCard title="Wallet Balance" value={`₹${analytics.walletBalance.toFixed(0)}`} icon={DollarSign} variant="success" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-4 mb-6 md:grid-cols-2 md:gap-6 md:mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Revenue vs Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: 'Revenue', value: analytics.totalRevenue },
                  { name: 'Cost', value: analytics.totalCost },
                  { name: 'Ads', value: analytics.totalAdSpend },
                  { name: 'Ship', value: analytics.totalShippingCost },
                  { name: 'Profit', value: analytics.totalProfit },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Delivered', value: analytics.deliveredCount },
                      { name: 'RTO', value: analytics.rtoCount },
                      { name: 'NDR', value: analytics.ndrCount },
                      { name: 'Processing', value: analytics.totalOrders - analytics.deliveredCount - analytics.rtoCount - analytics.ndrCount },
                    ]}
                    cx="50%" cy="50%" labelLine={false} label outerRadius={80} fill="#8884d8" dataKey="value"
                  >
                    {[0, 1, 2, 3].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Daily Profit & Best Sellers */}
        <div className="grid gap-4 mb-6 md:grid-cols-2 md:gap-6 md:mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Daily Profit Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyProfitData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                  <Line type="monotone" dataKey="cost" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Top 5 Best Sellers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bestSellers.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.product}</p>
                      <p className="text-xs text-muted-foreground">{item.orders} orders · {item.quantity} units</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold">₹{item.revenue.toFixed(0)}</p>
                      <p className="text-xs text-success">+₹{item.profit.toFixed(0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Balance Sheet */}
        <Card className="mb-6 md:mb-8">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Balance Sheet</CardTitle>
            <CardDescription>Detailed profit & loss breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-success">₹{analytics.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Product Cost</p>
                <p className="text-xl font-bold text-destructive">-₹{analytics.totalCost.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Ad Spend</p>
                <p className="text-xl font-bold text-destructive">-₹{analytics.totalAdSpend.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Shipping Cost</p>
                <p className="text-xl font-bold text-destructive">-₹{analytics.totalShippingCost.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Payment Gateway</p>
                <p className="text-xl font-bold text-destructive">-₹{(analytics.feeBreakdown.paymentGateway || 0).toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Marketer Commission</p>
                <p className="text-xl font-bold text-destructive">-₹{(analytics.feeBreakdown.marketer || 0).toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">COD Remittance</p>
                <p className="text-xl font-bold text-destructive">-₹{(analytics.feeBreakdown.codRemittance || 0).toFixed(2)}</p>
              </div>
              <div className="space-y-1 border-t pt-2">
                <p className="text-sm text-muted-foreground font-semibold">Net Profit</p>
                <p className={`text-2xl font-bold ${analytics.totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ₹{analytics.totalProfit.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Tables */}
        <Tabs defaultValue="orders" className="space-y-4 md:space-y-6">
          <TabsList className="w-full grid grid-cols-3 md:w-auto md:inline-grid">
            <TabsTrigger value="orders" className="text-xs md:text-sm">Orders</TabsTrigger>
            <TabsTrigger value="campaigns" className="text-xs md:text-sm">Ads</TabsTrigger>
            <TabsTrigger value="shipments" className="text-xs md:text-sm">Shipments</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Shopify Orders</CardTitle>
                <CardDescription>Click on any order to view shipment details</CardDescription>
              </CardHeader>
              <CardContent className="p-0 md:p-6">
                <AdvancedDataTable 
                  columns={ordersColumns} 
                  data={ordersData?.orders || []} 
                  isLoading={ordersLoading}
                  searchable
                  onRowClick={(row) => {
                    setSelectedOrder(row);
                    setDialogOpen(true);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Facebook Campaigns</CardTitle>
              </CardHeader>
              <CardContent className="p-0 md:p-6">
                <AdvancedDataTable 
                  columns={campaignsColumns} 
                  data={adsData?.campaigns || []} 
                  isLoading={adsLoading}
                  searchable
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipments">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Shiprocket Shipments</CardTitle>
              </CardHeader>
              <CardContent className="p-0 md:p-6">
                <AdvancedDataTable 
                  columns={shipmentsColumns} 
                  data={shipmentsData?.shipments || []} 
                  isLoading={shipmentsLoading}
                  searchable
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <OrderShipmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        order={selectedOrder}
        shipments={shipmentsData?.shipments || []}
      />
    </div>
  );
};

export default Index;
