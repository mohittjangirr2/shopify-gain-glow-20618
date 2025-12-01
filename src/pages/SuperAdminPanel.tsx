import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdvancedDataTable } from "@/components/AdvancedDataTable";
import { toast } from "sonner";
import { Building2, UserPlus, Settings, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const SuperAdminPanel = () => {
  const queryClient = useQueryClient();
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [companyForm, setCompanyForm] = useState({ name: '', email: '', phone: '' });
  const [vendorForm, setVendorForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '',
    company_id: '',
    cost_per_order: 0 
  });

  // Fetch companies
  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch vendors
  const { data: vendors = [], isLoading: loadingVendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*, companies(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch modules
  const { data: modules = [] } = useQuery({
    queryKey: ['modules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('modules').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Fetch company modules for selected company
  const { data: companyModules = [] } = useQuery({
    queryKey: ['company-modules', selectedCompany?.id],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase
        .from('company_modules')
        .select('*, modules(*)')
        .eq('company_id', selectedCompany.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  // Create company mutation
  const createCompany = useMutation({
    mutationFn: async (newCompany: typeof companyForm) => {
      const { data, error } = await supabase
        .from('companies')
        .insert([newCompany])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company created successfully');
      setShowCompanyDialog(false);
      setCompanyForm({ name: '', email: '', phone: '' });
    },
    onError: () => {
      toast.error('Failed to create company');
    },
  });

  // Create vendor mutation
  const createVendor = useMutation({
    mutationFn: async (newVendor: typeof vendorForm) => {
      const { data, error } = await supabase.functions.invoke('create-vendor-user', {
        body: { 
          vendorData: {
            name: newVendor.name,
            email: newVendor.email,
            phone: newVendor.phone,
            company_id: newVendor.company_id,
            cost_per_order: newVendor.cost_per_order,
          },
          password: newVendor.password 
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor created successfully with login credentials');
      setShowVendorDialog(false);
      setVendorForm({ 
        name: '', 
        email: '', 
        phone: '', 
        password: '',
        company_id: '',
        cost_per_order: 0 
      });
    },
    onError: (error: any) => {
      toast.error(`Failed to create vendor: ${error.message}`);
    },
  });

  // Toggle module permission
  const toggleModulePermission = useMutation({
    mutationFn: async ({ moduleId, permission }: { moduleId: string; permission: keyof typeof permissions }) => {
      const existing = companyModules.find((cm: any) => cm.module_id === moduleId);
      
      if (existing) {
        const { error } = await supabase
          .from('company_modules')
          .update({ [permission]: !existing[permission] })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_modules')
          .insert([{
            company_id: selectedCompany.id,
            module_id: moduleId,
            [permission]: true,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-modules'] });
      toast.success('Permission updated');
    },
  });

  const companyColumns = [
    { header: 'Company Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    {
      header: 'Status',
      accessor: 'is_active',
      cell: (row: any) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: (row: any) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedCompany(row);
            setShowModuleDialog(true);
          }}
        >
          <Settings className="h-4 w-4 mr-1" />
          Manage Modules
        </Button>
      ),
    },
  ];

  const vendorColumns = [
    { header: 'Vendor Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone', cell: (v: string) => v || 'N/A' },
    { header: 'Company', accessor: 'companies', cell: (v: any) => v?.name || 'N/A' },
    { header: 'Cost/Order', accessor: 'cost_per_order', cell: (v: number) => `₹${v?.toFixed(2) || '0.00'}` },
    {
      header: 'Status',
      accessor: 'is_active',
      cell: (row: any) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  const permissions = { can_read: 'Read', can_write: 'Write', can_delete: 'Delete' };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Super Admin Panel</h1>
      </div>

      <Tabs defaultValue="companies">
        <TabsList>
          <TabsTrigger value="companies">
            <Building2 className="h-4 w-4 mr-2" />
            Companies
          </TabsTrigger>
          <TabsTrigger value="vendors">
            <Users className="h-4 w-4 mr-2" />
            Vendors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Companies Management</CardTitle>
              <Button onClick={() => setShowCompanyDialog(true)}>
                <Building2 className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </CardHeader>
            <CardContent>
              <AdvancedDataTable
                columns={companyColumns}
                data={companies}
                isLoading={loadingCompanies}
                searchable
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vendors Management</CardTitle>
              <Button onClick={() => setShowVendorDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </CardHeader>
            <CardContent>
              <AdvancedDataTable
                columns={vendorColumns}
                data={vendors}
                isLoading={loadingVendors}
                searchable
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Company Dialog */}
      <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                placeholder="company@example.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                placeholder="+1234567890"
              />
            </div>
            <Button
              onClick={() => createCompany.mutate(companyForm)}
              disabled={createCompany.isPending}
              className="w-full"
            >
              Create Company
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Vendor Dialog */}
      <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Vendor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Vendor Name *</Label>
              <Input
                value={vendorForm.name}
                onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                placeholder="Enter vendor name"
              />
            </div>
            <div>
              <Label>Email * (Login Username)</Label>
              <Input
                type="email"
                value={vendorForm.email}
                onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                placeholder="vendor@example.com"
              />
            </div>
            <div>
              <Label>Password * (Initial Login Password)</Label>
              <Input
                type="password"
                value={vendorForm.password}
                onChange={(e) => setVendorForm({ ...vendorForm, password: e.target.value })}
                placeholder="Min 6 characters"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Vendor can change this after first login
              </p>
            </div>
            <div>
              <Label>Company *</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={vendorForm.company_id}
                onChange={(e) => setVendorForm({ ...vendorForm, company_id: e.target.value })}
              >
                <option value="">Select Company</option>
                {companies.map((company: any) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={vendorForm.phone}
                onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                placeholder="+1234567890"
              />
            </div>
            <div>
              <Label>Cost Per Order (₹)</Label>
              <Input
                type="number"
                value={vendorForm.cost_per_order}
                onChange={(e) => setVendorForm({ ...vendorForm, cost_per_order: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <Button
              onClick={() => createVendor.mutate(vendorForm)}
              disabled={createVendor.isPending || !vendorForm.name || !vendorForm.email || !vendorForm.password || !vendorForm.company_id}
              className="w-full"
            >
              Create Vendor with Login Access
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Module Permissions Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Manage Modules for {selectedCompany?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {modules.map((module: any) => {
              const existing = companyModules.find((cm: any) => cm.module_id === module.id);
              return (
                <div key={module.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{module.name}</div>
                    <div className="text-sm text-muted-foreground">{module.description}</div>
                  </div>
                  <div className="flex gap-4">
                    {Object.entries(permissions).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={existing?.[key] || false}
                          onCheckedChange={() =>
                            toggleModulePermission.mutate({
                              moduleId: module.id,
                              permission: key as keyof typeof permissions,
                            })
                          }
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};