import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { CheckCircle, TrendingUp, Package, Users, BarChart3, Shield, Zap, Clock, Code, Database, Cpu, Terminal } from "lucide-react";
import Footer from "@/components/Footer";
import { Logo } from "@/components/Logo";

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Track your Shopify sales, Facebook ad spend, and Shiprocket shipping costs in real-time with comprehensive dashboards."
    },
    {
      icon: TrendingUp,
      title: "Profit Tracking",
      description: "Calculate accurate profit margins by integrating order values, ad spend, and shipping costs automatically."
    },
    {
      icon: Package,
      title: "RTO Analysis",
      description: "Monitor Return to Origin rates, identify patterns, and reduce losses with detailed RTO analytics."
    },
    {
      icon: Users,
      title: "Customer Insights",
      description: "Get detailed customer analytics including order history, location data, and behavior patterns."
    },
    {
      icon: Shield,
      title: "Secure Integration",
      description: "Enterprise-grade security with encrypted API connections to Shopify, Facebook, and Shiprocket."
    },
    {
      icon: Zap,
      title: "Automated Sync",
      description: "Data syncs automatically across all platforms, ensuring you always have the latest information."
    }
  ];

  const benefits = [
    "Complete visibility into your e-commerce business",
    "Make data-driven decisions with accurate metrics",
    "Reduce RTO and improve delivery success rates",
    "Track product performance and profitability",
    "Optimize ad spend with ROI tracking",
    "Manage customer relationships effectively"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header without dashboard links */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Logo />
            <Button onClick={() => navigate("/auth")} size="sm">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <section className="relative py-20 px-4 bg-gradient-to-b from-primary/5 via-background to-accent/5">
        <div className="container mx-auto text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Code className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Enterprise-Grade E-commerce Intelligence</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            OVIX Analytics Platform
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-6 font-mono">
            <Terminal className="inline h-5 w-5 mr-2" />
            Real-time Multi-Platform Data Integration System
          </p>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Unified analytics engine connecting <span className="font-semibold text-foreground">Shopify</span>, <span className="font-semibold text-foreground">Facebook Ads</span>, and <span className="font-semibold text-foreground">Shiprocket</span> APIs. 
            Process order data, calculate profit margins, track RTO metrics, and optimize business operations with advanced data aggregation.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-10 font-semibold">
              <Cpu className="mr-2 h-5 w-5" />
              Initialize Dashboard
            </Button>
            <Button size="lg" variant="outline" onClick={() => {
              document.getElementById('docs')?.scrollIntoView({ behavior: 'smooth' });
            }} className="text-lg px-10 font-semibold">
              <Database className="mr-2 h-5 w-5" />
              Technical Docs
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to manage and grow your e-commerce business
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose OVIX?</h2>
            <p className="text-xl text-muted-foreground">
              Built specifically for e-commerce businesses that want to scale
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-card">
                <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                <p className="text-lg">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect Your Accounts</h3>
              <p className="text-muted-foreground">
                Link your Shopify store, Facebook Ads account, and Shiprocket credentials
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Sync Your Data</h3>
              <p className="text-muted-foreground">
                Automatically import and sync all your orders, ads, and shipments
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Analyze and Grow</h3>
              <p className="text-muted-foreground">
                Get insights, track performance, and make data-driven decisions
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="docs" className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Terminal className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium font-mono">SYSTEM DOCUMENTATION</span>
            </div>
            <h2 className="text-4xl font-bold mb-4 font-mono">Technical Implementation Guide</h2>
            <p className="text-xl text-muted-foreground">
              Comprehensive API integration and data processing documentation
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono">
                  <Code className="h-5 w-5 text-primary" />
                  System Architecture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-sm">
                <p><span className="text-primary">→</span> <strong>Frontend:</strong> React + TypeScript + Vite</p>
                <p><span className="text-primary">→</span> <strong>Backend:</strong> Supabase Edge Functions (Deno runtime)</p>
                <p><span className="text-primary">→</span> <strong>Database:</strong> PostgreSQL with RLS policies</p>
                <p><span className="text-primary">→</span> <strong>Auth:</strong> Supabase Auth with JWT tokens</p>
                <p><span className="text-primary">→</span> <strong>API Integration:</strong> REST endpoints for all platforms</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono">
                  <Database className="h-5 w-5 text-primary" />
                  API Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-sm">
                <p><span className="text-success">GET</span> /fetch-shopify-orders <span className="text-muted-foreground">- Order data sync</span></p>
                <p><span className="text-success">GET</span> /fetch-facebook-ads-v2 <span className="text-muted-foreground">- Ad spend with auto-refresh</span></p>
                <p><span className="text-success">GET</span> /fetch-shiprocket-shipments <span className="text-muted-foreground">- Shipping data</span></p>
                <p><span className="text-primary">→</span> All endpoints support date range filtering</p>
                <p><span className="text-primary">→</span> Responses cached for performance optimization</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono">
                  <Shield className="h-5 w-5 text-primary" />
                  Authentication Flow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-sm">
                <p><span className="text-primary">1.</span> User signup/login via Supabase Auth</p>
                <p><span className="text-primary">2.</span> JWT token issued and stored in localStorage</p>
                <p><span className="text-primary">3.</span> API credentials stored per user in database</p>
                <p><span className="text-primary">4.</span> Edge functions validate JWT on each request</p>
                <p><span className="text-primary">5.</span> RLS policies enforce data isolation</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono">
                  <Cpu className="h-5 w-5 text-primary" />
                  Data Processing Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-sm">
                <p><span className="text-primary">→</span> Orders fetched with pagination (250 per page)</p>
                <p><span className="text-primary">→</span> Cost prices pulled from Shopify inventory API</p>
                <p><span className="text-primary">→</span> Shipping data matched via order IDs</p>
                <p><span className="text-primary">→</span> Profit = Revenue - (Cost + Ads + Shipping + Fees)</p>
                <p><span className="text-primary">→</span> RTO calculated only on delivered orders</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono">
                  <Terminal className="h-5 w-5 text-primary" />
                  Configuration Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4 font-mono text-sm">
                  <div className="space-y-2">
                    <p className="font-semibold text-primary">Shopify Setup</p>
                    <p className="text-muted-foreground">Store URL: your-store.myshopify.com</p>
                    <p className="text-muted-foreground">Access Token: Admin API token</p>
                    <p className="text-muted-foreground">Permissions: read_orders, read_products</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-primary">Facebook Ads</p>
                    <p className="text-muted-foreground">Access Token: Long-lived user token</p>
                    <p className="text-muted-foreground">Ad Account ID: act_XXXXXXXXXX</p>
                    <p className="text-muted-foreground">Permissions: ads_read</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-primary">Shiprocket</p>
                    <p className="text-muted-foreground">Email: Your account email</p>
                    <p className="text-muted-foreground">Password: Account password</p>
                    <p className="text-muted-foreground">Auth: Bearer token (auto-refresh)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Metrics Calculation Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="font-mono text-sm space-y-2">
                <p><strong className="text-primary">RTO %:</strong> (RTO Orders / Delivered Orders) × 100 - Excludes NDR from calculation</p>
                <p><strong className="text-primary">Profit:</strong> Order Value - (Cost Price + Ad Spend + Shipping + Gateway Fees + Marketer Commission)</p>
                <p><strong className="text-primary">ROI:</strong> (Revenue / Ad Spend) × 100</p>
                <p><strong className="text-primary">AOV:</strong> Total Revenue / Total Orders</p>
                <p><strong className="text-primary">Marketer Fee:</strong> Calculated only on delivered orders (percentage or fixed per order)</p>
                <p><strong className="text-primary">Vendor Payment:</strong> Cost price paid only for delivered orders (RTO excluded)</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Advanced Features</h2>
            <p className="text-xl text-muted-foreground">
              Powerful tools to manage every aspect of your business
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <Clock className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Real-time Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Monitor NDR, Out for Delivery, and RTO orders in real-time with instant notifications and detailed tracking.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Profit Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Deep dive into product profitability, customer lifetime value, and ROI with comprehensive profit tracking.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Smart Forecasting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Predict future trends, identify growth opportunities, and make informed decisions with AI-powered insights.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-t from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of e-commerce businesses using OVIX to grow smarter
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-12">
            <Cpu className="mr-2 h-5 w-5" />
            Launch Dashboard
          </Button>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Home;
