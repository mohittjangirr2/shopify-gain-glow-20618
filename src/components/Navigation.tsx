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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "./Logo";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

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

  const primaryNavItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/products", label: "Products", icon: Package },
    { to: "/customers", label: "Customers", icon: Users },
  ];

  const ordersNavItems = [
    { to: "/delivered", label: "Delivered", icon: CheckCircle },
    { to: "/rto", label: "RTO", icon: TrendingDown },
    { to: "/ndr", label: "NDR", icon: AlertCircle },
  ];

  const otherNavItems = [
    { to: "/vendor-payments", label: "Vendor Payments", icon: DollarSign },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {primaryNavItems.map((item) => (
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
            
            {/* Orders Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  Orders
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {ordersNavItems.map((item) => (
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

            {otherNavItems.map((item) => (
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
                {primaryNavItems.map((item) => (
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
                
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">ORDERS</div>
                {ordersNavItems.map((item) => (
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
                
                {otherNavItems.map((item) => (
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
