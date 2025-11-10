import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, DollarSign, Users, Percent } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  // Payment Gateway Settings
  const [paymentGatewayEnabled, setPaymentGatewayEnabled] = useState(true);
  const [paymentGatewayFee, setPaymentGatewayFee] = useState("2");
  
  // Marketer Commission Settings
  const [marketerEnabled, setMarketerEnabled] = useState(false);
  const [marketerType, setMarketerType] = useState<"percentage" | "fixed">("percentage");
  const [marketerValue, setMarketerValue] = useState("");
  
  // COD Remittance Fee
  const [codRemittanceFee, setCodRemittanceFee] = useState("0.49");

  const handleSave = () => {
    // Save to localStorage or backend
    const settings = {
      paymentGateway: {
        enabled: paymentGatewayEnabled,
        fee: parseFloat(paymentGatewayFee),
      },
      marketer: {
        enabled: marketerEnabled,
        type: marketerType,
        value: parseFloat(marketerValue || "0"),
      },
      codRemittance: {
        fee: parseFloat(codRemittanceFee),
      },
    };
    
    localStorage.setItem("dashboardSettings", JSON.stringify(settings));
    toast.success("Settings saved successfully!");
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

        <Tabs defaultValue="fees" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
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
          <Button onClick={handleSave} size="lg">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
