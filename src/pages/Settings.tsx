import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, DollarSign, Users, Percent, Key } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const [loading, setLoading] = useState(false);
  
  // API Settings
  const [facebookAccessToken, setFacebookAccessToken] = useState("");
  const [facebookAdAccountId, setFacebookAdAccountId] = useState("");
  const [facebookAppId, setFacebookAppId] = useState("");
  const [facebookAppSecret, setFacebookAppSecret] = useState("");
  const [shiprocketEmail, setShiprocketEmail] = useState("");
  const [shiprocketPassword, setShiprocketPassword] = useState("");
  const [shopifyStoreUrl, setShopifyStoreUrl] = useState("");
  const [shopifyAccessToken, setShopifyAccessToken] = useState("");
  
  // Payment Gateway Settings
  const [paymentGatewayEnabled, setPaymentGatewayEnabled] = useState(true);
  const [paymentGatewayFee, setPaymentGatewayFee] = useState("2");
  
  // Marketer Commission Settings
  const [marketerEnabled, setMarketerEnabled] = useState(false);
  const [marketerType, setMarketerType] = useState<"percentage" | "fixed">("percentage");
  const [marketerValue, setMarketerValue] = useState("");
  
  // COD Remittance Fee
  const [codRemittanceFee, setCodRemittanceFee] = useState("0.49");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to view settings");
        return;
      }

      const { data, error } = await supabase
        .from('api_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setFacebookAccessToken(data.facebook_access_token || "");
        setFacebookAdAccountId(data.facebook_ad_account_id || "");
        setFacebookAppId(data.facebook_app_id || "");
        setFacebookAppSecret(data.facebook_app_secret || "");
        setShiprocketEmail(data.shiprocket_email || "");
        setShiprocketPassword(data.shiprocket_password || "");
        setShopifyStoreUrl(data.shopify_store_url || "");
        setShopifyAccessToken(data.shopify_access_token || "");
        setPaymentGatewayEnabled(data.payment_gateway_enabled ?? true);
        setPaymentGatewayFee(data.payment_gateway_fee?.toString() || "2");
        setCodRemittanceFee(data.cod_remittance_fee?.toString() || "0.49");
        setMarketerEnabled(data.marketer_enabled ?? false);
        setMarketerType((data.marketer_type as "percentage" | "fixed") || "percentage");
        setMarketerValue(data.marketer_value?.toString() || "");
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error("Failed to load settings");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to save settings");
        return;
      }

      const settings = {
        user_id: user.id,
        facebook_access_token: facebookAccessToken,
        facebook_ad_account_id: facebookAdAccountId,
        facebook_app_id: facebookAppId,
        facebook_app_secret: facebookAppSecret,
        shiprocket_email: shiprocketEmail,
        shiprocket_password: shiprocketPassword,
        shopify_store_url: shopifyStoreUrl,
        shopify_access_token: shopifyAccessToken,
        payment_gateway_enabled: paymentGatewayEnabled,
        payment_gateway_fee: parseFloat(paymentGatewayFee),
        cod_remittance_fee: parseFloat(codRemittanceFee),
        marketer_enabled: marketerEnabled,
        marketer_type: marketerType,
        marketer_value: parseFloat(marketerValue || "0"),
      };

      const { error } = await supabase
        .from('api_settings')
        .upsert(settings, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your fees and commission settings</p>
          </div>
        </div>

        <Tabs defaultValue="api" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="api">
              <Key className="h-4 w-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="fees">
              <DollarSign className="h-4 w-4 mr-2" />
              Fees
            </TabsTrigger>
            <TabsTrigger value="marketer">
              <Users className="h-4 w-4 mr-2" />
              Marketer
            </TabsTrigger>
            <TabsTrigger value="other">
              <Percent className="h-4 w-4 mr-2" />
              Other
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Facebook Ads API</CardTitle>
                <CardDescription>
                  Configure your Facebook Ads API credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fb-access-token">Access Token</Label>
                  <Input
                    id="fb-access-token"
                    type="password"
                    value={facebookAccessToken}
                    onChange={(e) => setFacebookAccessToken(e.target.value)}
                    placeholder="Enter Facebook Access Token"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb-ad-account">Ad Account ID</Label>
                  <Input
                    id="fb-ad-account"
                    value={facebookAdAccountId}
                    onChange={(e) => setFacebookAdAccountId(e.target.value)}
                    placeholder="Enter Ad Account ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb-app-id">App ID (Optional)</Label>
                  <Input
                    id="fb-app-id"
                    value={facebookAppId}
                    onChange={(e) => setFacebookAppId(e.target.value)}
                    placeholder="Enter Facebook App ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb-app-secret">App Secret (Optional)</Label>
                  <Input
                    id="fb-app-secret"
                    type="password"
                    value={facebookAppSecret}
                    onChange={(e) => setFacebookAppSecret(e.target.value)}
                    placeholder="Enter Facebook App Secret"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shiprocket API</CardTitle>
                <CardDescription>
                  Configure your Shiprocket credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shiprocket-email">Email</Label>
                  <Input
                    id="shiprocket-email"
                    type="email"
                    value={shiprocketEmail}
                    onChange={(e) => setShiprocketEmail(e.target.value)}
                    placeholder="Enter Shiprocket Email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shiprocket-password">Password</Label>
                  <Input
                    id="shiprocket-password"
                    type="password"
                    value={shiprocketPassword}
                    onChange={(e) => setShiprocketPassword(e.target.value)}
                    placeholder="Enter Shiprocket Password"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shopify API</CardTitle>
                <CardDescription>
                  Configure your Shopify store credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shopify-store">Store URL</Label>
                  <Input
                    id="shopify-store"
                    value={shopifyStoreUrl}
                    onChange={(e) => setShopifyStoreUrl(e.target.value)}
                    placeholder="yourstore.myshopify.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopify-token">Access Token</Label>
                  <Input
                    id="shopify-token"
                    type="password"
                    value={shopifyAccessToken}
                    onChange={(e) => setShopifyAccessToken(e.target.value)}
                    placeholder="Enter Shopify Access Token"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Gateway Fees</CardTitle>
                <CardDescription>
                  Configure payment gateway fees for prepaid orders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Payment Gateway Fee (Prepaid Only)</Label>
                    <p className="text-sm text-muted-foreground">
                      Apply fee only to prepaid orders
                    </p>
                  </div>
                  <Switch
                    checked={paymentGatewayEnabled}
                    onCheckedChange={setPaymentGatewayEnabled}
                  />
                </div>
                
                {paymentGatewayEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="gateway-fee">Fee Percentage (%)</Label>
                    <Input
                      id="gateway-fee"
                      type="number"
                      step="0.01"
                      value={paymentGatewayFee}
                      onChange={(e) => setPaymentGatewayFee(e.target.value)}
                      placeholder="2.00"
                    />
                    <p className="text-sm text-muted-foreground">
                      Current: {paymentGatewayFee}% of order value
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>COD Remittance Fee</CardTitle>
                <CardDescription>
                  Fee charged for COD order remittance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="cod-fee">Fixed Fee (₹)</Label>
                <Input
                  id="cod-fee"
                  type="number"
                  step="0.01"
                  value={codRemittanceFee}
                  onChange={(e) => setCodRemittanceFee(e.target.value)}
                  placeholder="0.49"
                />
                <p className="text-sm text-muted-foreground">
                  Flat fee per COD order: ₹{codRemittanceFee}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Marketer Commission</CardTitle>
                <CardDescription>
                  Configure commission for marketing team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Marketer Commission</Label>
                    <p className="text-sm text-muted-foreground">
                      Deduct commission from profits
                    </p>
                  </div>
                  <Switch
                    checked={marketerEnabled}
                    onCheckedChange={setMarketerEnabled}
                  />
                </div>

                {marketerEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Commission Type</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={marketerType === "percentage" ? "default" : "outline"}
                          onClick={() => setMarketerType("percentage")}
                          className="flex-1"
                        >
                          Percentage (%)
                        </Button>
                        <Button
                          variant={marketerType === "fixed" ? "default" : "outline"}
                          onClick={() => setMarketerType("fixed")}
                          className="flex-1"
                        >
                          Fixed (₹)
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="marketer-value">
                        {marketerType === "percentage" ? "Percentage (%)" : "Fixed Amount (₹)"}
                      </Label>
                      <Input
                        id="marketer-value"
                        type="number"
                        step="0.01"
                        value={marketerValue}
                        onChange={(e) => setMarketerValue(e.target.value)}
                        placeholder={marketerType === "percentage" ? "10" : "100"}
                      />
                      <p className="text-sm text-muted-foreground">
                        {marketerType === "percentage"
                          ? `${marketerValue}% of profit`
                          : `₹${marketerValue} per order`}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="other" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Other Settings</CardTitle>
                <CardDescription>
                  Additional configuration options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  More settings coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} size="lg" disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
