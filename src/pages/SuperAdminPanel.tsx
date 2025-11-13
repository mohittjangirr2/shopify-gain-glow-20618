import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdvancedDataTable } from "@/components/AdvancedDataTable";
import { toast } from "sonner";
import { Building2, UserPlus, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export const SuperAdminPanel = () => {
  const queryClient = useQueryClient();
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [companyForm, setCompanyForm] = useState({ name: '', email: '', phone: '' });

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
        <span className={row.is_active ? 'text-green-600' : 'text-red-600'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
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

  const permissions = { can_read: 'Read', can_write: 'Write', can_delete: 'Delete' };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Super Admin Panel</h1>
        <Button onClick={() => setShowCompanyDialog(true)}>
          <Building2 className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Companies Management</CardTitle>
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