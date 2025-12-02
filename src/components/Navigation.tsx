import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { 
  Package, 
  Users, 
  Settings, 
  Menu,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  LogOut,
  LogIn,
  LayoutDashboard,
  ChevronDown,
  DollarSign,
  PackagePlus,
  PackageCheck,
  Truck as TruckIcon,
  Zap,
  Bell,
  Shield,
  Building2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "./Logo";
import { useUserRole } from "@/hooks/useUserRole";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { role, isLoading } = useUserRole();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully!");
    navigate("/auth");
  };

  // Define navigation items with role restrictions
  const primaryNavItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ['super_admin', 'company'] },
    { to: "/vendor-dashboard", label: "Vendor Dashboard", icon: Building2, roles: ['vendor'] },
    { to: "/products", label: "Products", icon: Package, roles: ['super_admin', 'company'] },
    { to: "/customers", label: "Customers", icon: Users, roles: ['super_admin', 'company'] },
  ];

  const ordersNavItems = [
    { to: "/orders/new", label: "New Orders", icon: PackagePlus, roles: ['super_admin', 'company'] },
    { to: "/orders/ready-to-ship", label: "Ready To Ship", icon: PackageCheck, roles: ['super_admin', 'company'] },
    { to: "/orders/in-transit", label: "In Transit", icon: TruckIcon, roles: ['super_admin', 'company'] },
    { to: "/delivered", label: "Delivered", icon: CheckCircle, roles: ['super_admin', 'company'] },
    { to: "/rto", label: "RTO", icon: TrendingDown, roles: ['super_admin', 'company', 'vendor'] },
    { to: "/ndr", label: "NDR", icon: AlertCircle, roles: ['super_admin', 'company'] },
  ];

  const otherNavItems = [
    { to: "/super-admin", label: "Super Admin", icon: Shield, roles: ['super_admin'] },
    { to: "/vendor-payments", label: "Vendor Payments", icon: DollarSign, roles: ['super_admin', 'company', 'vendor'] },
    { to: "/performance", label: "Performance", icon: Zap, roles: ['super_admin', 'company'] },
    { to: "/notifications", label: "Notifications", icon: Bell, roles: ['super_admin', 'company'] },
    { to: "/settings", label: "Settings", icon: Settings, roles: ['super_admin', 'company', 'vendor'] },
  ];

  // Filter navigation items based on user role
  const filterByRole = (items: typeof primaryNavItems) => {
    if (isLoading || !role) return [];
    return items.filter(item => item.roles.includes(role));
  };

  const filteredPrimaryNav = filterByRole(primaryNavItems);
  const filteredOrdersNav = filterByRole(ordersNavItems);
  const filteredOtherNav = filterByRole(otherNavItems);

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {filteredPrimaryNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                activeClassName="text-foreground bg-accent"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
            
            {/* Orders Dropdown - only show if there are filtered order items */}
            {filteredOrdersNav.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    Orders
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {filteredOrdersNav.map((item) => (
                    <DropdownMenuItem key={item.to} asChild>
                      <NavLink
                        to={item.to}
                        className="flex items-center gap-2 w-full cursor-pointer"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </NavLink>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {filteredOtherNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                activeClassName="text-foreground bg-accent"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
            
            {user ? (
              <Button onClick={handleLogout} variant="outline" size="sm" className="ml-2">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Button onClick={() => navigate("/auth")} variant="outline" size="sm" className="ml-2">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            )}
          </nav>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-8">
                {filteredPrimaryNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                    activeClassName="text-foreground bg-accent"
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                ))}
                
                {filteredOrdersNav.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">ORDERS</div>
                    {filteredOrdersNav.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                        activeClassName="text-foreground bg-accent"
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </NavLink>
                    ))}
                  </>
                )}
                
                {filteredOtherNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                    activeClassName="text-foreground bg-accent"
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                ))}
                
                {user ? (
                  <Button onClick={() => { handleLogout(); setIsOpen(false); }} variant="outline" className="w-full justify-start">
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                  </Button>
                ) : (
                  <Button onClick={() => { navigate("/auth"); setIsOpen(false); }} variant="outline" className="w-full justify-start">
                    <LogIn className="h-5 w-5 mr-3" />
                    Login
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
