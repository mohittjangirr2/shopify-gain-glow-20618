import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { CheckCircle, TrendingUp, Package, Users, BarChart3, Shield, Zap } from "lucide-react";

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
      <section className="relative py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            OVIX Analytics
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Complete E-commerce Analytics Platform
          </p>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Integrate Shopify, Facebook Ads, and Shiprocket data in one powerful dashboard. 
            Track profits, analyze RTO, and grow your business with actionable insights.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }} className="text-lg px-8">
              Learn More
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

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Documentation</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know to get the most out of OVIX
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>1. Create Account:</strong> Sign up with your email and create a secure password</p>
                <p><strong>2. Configure Settings:</strong> Navigate to Settings and add your API credentials</p>
                <p><strong>3. Connect Shopify:</strong> Enter your Shopify store URL and access token</p>
                <p><strong>4. Add Facebook Ads:</strong> Connect your Facebook ad account for spend tracking</p>
                <p><strong>5. Setup Shiprocket:</strong> Enter your Shiprocket email and password</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Dashboard:</strong> View key metrics including orders, RTO rate, and ad spend</p>
                <p><strong>Products:</strong> Analyze product performance, revenue, and profit margins</p>
                <p><strong>Customers:</strong> Track customer data and order history</p>
                <p><strong>RTO Analysis:</strong> Monitor return rates and identify issues</p>
                <p><strong>Delivered Orders:</strong> View all successfully delivered shipments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Shopify:</strong> Requires store URL and access token with read permissions</p>
                <p><strong>Facebook Ads:</strong> Needs access token and ad account ID</p>
                <p><strong>Shiprocket:</strong> Uses email and password for authentication</p>
                <p><strong>Data Sync:</strong> Automatic sync every 5 minutes for real-time updates</p>
                <p><strong>Security:</strong> All credentials encrypted and stored securely</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Connection Issues:</strong> Verify API credentials in Settings</p>
                <p><strong>Missing Data:</strong> Check date range and ensure integrations are active</p>
                <p><strong>Sync Delays:</strong> Data syncs may take 2-5 minutes to reflect</p>
                <p><strong>RTO Calculation:</strong> Excludes NDR orders for accurate metrics</p>
                <p><strong>Support:</strong> Contact support team for technical assistance</p>
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
            Start Free Today
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
