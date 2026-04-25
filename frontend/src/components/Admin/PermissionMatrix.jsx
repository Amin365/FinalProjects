/**
 * Phase 8 - Permission Matrix Component
 * Manage roles and their permissions
 */

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Save,
  RefreshCw,
  Lock,
  Users,
  Key,
  Check,
  X,
} from "lucide-react";

export default function PermissionMatrix() {
  const qc = useQueryClient();
  const [selectedRole, setSelectedRole] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePlural, setNewRolePlural] = useState("");
  const [newRoleColor, setNewRoleColor] = useState("#3b82f6");
  const [pendingPermissions, setPendingPermissions] = useState(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch permission matrix data
  const { data: matrixData, isLoading: matrixLoading, refetch } = useQuery({
    queryKey: ["permission-matrix"],
    queryFn: async () => {
      const res = await api.get("/permission-matrix");
      return res.data?.data;
    },
    staleTime: 30000,
  });

  // Fetch roles with permissions
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await api.get("/roles", { params: { includePermissions: true } });
      return res.data?.data || res.data || [];
    },
  });

  // Get role details when selected
  const { data: roleDetails, isLoading: roleDetailsLoading } = useQuery({
    queryKey: ["role-details", selectedRole?._id],
    queryFn: async () => {
      const res = await api.get(`/roles/${selectedRole._id}`);
      return res.data?.data;
    },
    enabled: !!selectedRole?._id,
    onSuccess: (data) => {
      setPendingPermissions(new Set(data.permissions?.map((p) => p._id) || []));
      setHasChanges(false);
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/roles", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Role created successfully");
      qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["permission-matrix"] });
      setIsCreateDialogOpen(false);
      setNewRoleName("");
      setNewRolePlural("");
      setNewRoleColor("#3b82f6");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to create role");
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`/roles/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Role updated successfully");
      qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["permission-matrix"] });
      setEditingRole(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update role");
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/roles/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Role deleted successfully");
      qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["permission-matrix"] });
      setSelectedRole(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to delete role");
    },
  });

  // Bulk update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissionIds }) => {
      const res = await api.put(`/roles/${roleId}/permissions/bulk`, { permissionIds });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Permissions updated: ${data.added} added, ${data.removed} removed`);
      qc.invalidateQueries({ queryKey: ["role-details", selectedRole?._id] });
      qc.invalidateQueries({ queryKey: ["permission-matrix"] });
      setHasChanges(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update permissions");
    },
  });

  const roles = rolesData || matrixData?.roles || [];
  const groupedPermissions = matrixData?.groupedPermissions || {};

  // Initialize pending permissions when role details load
  React.useEffect(() => {
    if (roleDetails?.permissions) {
      setPendingPermissions(new Set(roleDetails.permissions.map((p) => p._id)));
      setHasChanges(false);
    }
  }, [roleDetails]);

  const handlePermissionToggle = (permissionId) => {
    const newPending = new Set(pendingPermissions);
    if (newPending.has(permissionId)) {
      newPending.delete(permissionId);
    } else {
      newPending.add(permissionId);
    }
    setPendingPermissions(newPending);
    setHasChanges(true);
  };

  const handleSavePermissions = () => {
    if (!selectedRole?._id) return;
    updatePermissionsMutation.mutate({
      roleId: selectedRole._id,
      permissionIds: Array.from(pendingPermissions),
    });
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      toast.error("Role name is required");
      return;
    }
    createRoleMutation.mutate({
      role: newRoleName.trim(),
      plural: newRolePlural.trim(),
      color: newRoleColor,
    });
  };

  const handleDeleteRole = (role) => {
    if (role.system) {
      toast.error("Cannot delete system roles");
      return;
    }
    if (confirm(`Are you sure you want to delete the "${role.role}" role?`)) {
      deleteRoleMutation.mutate(role._id);
    }
  };

  return (
    <div className="min-h-screen p-4  ">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
              Permission Matrix
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              Manage roles and their permissions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Role
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roles List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Roles
              </CardTitle>
              <CardDescription>Select a role to manage permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div
                      key={role._id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedRole?._id === role._id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-slate-200 dark:border-gray-700 hover:border-slate-300"
                      }`}
                      onClick={() => setSelectedRole(role)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: role.color || "#3b82f6" }}
                          />
                          <span className="font-medium text-slate-800 dark:text-white">
                            {role.role}
                          </span>
                          {role.system && (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              System
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {role.permissionCount || 0} perms
                        </Badge>
                      </div>
                      {role.plural && (
                        <p className="text-xs text-slate-500 mt-1">{role.plural}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permission Editor */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    {selectedRole ? `Permissions for "${selectedRole.role}"` : "Select a Role"}
                  </CardTitle>
                  {selectedRole && (
                    <CardDescription className="mt-1">
                      Toggle permissions and click Save to apply changes
                    </CardDescription>
                  )}
                </div>
                {selectedRole && hasChanges && (
                  <Button onClick={handleSavePermissions} disabled={updatePermissionsMutation.isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedRole ? (
                <div className="text-center py-12 text-slate-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a role from the list to manage its permissions</p>
                </div>
              ) : roleDetailsLoading || matrixLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                  {Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <div key={category} className="space-y-3">
                      <h4 className="font-semibold text-slate-800 dark:text-white border-b pb-2">
                        {category}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissions.map((perm) => {
                          const isChecked = pendingPermissions.has(perm._id);
                          return (
                            <div
                              key={perm._id}
                              className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                                isChecked
                                  ? "bg-green-50 dark:bg-green-900/20"
                                  : "hover:bg-slate-50 dark:hover:bg-gray-800"
                              }`}
                            >
                              <Checkbox
                                id={perm._id}
                                checked={isChecked}
                                onCheckedChange={() => handlePermissionToggle(perm._id)}
                                disabled={selectedRole?.system && perm.system}
                              />
                              <Label
                                htmlFor={perm._id}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {perm.permission}
                              </Label>
                              {perm.system && (
                                <Lock className="h-3 w-3 text-slate-400" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Role Actions */}
        {selectedRole && !selectedRole.system && (
          <Card>
            <CardHeader>
              <CardTitle>Role Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setEditingRole(selectedRole)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Role Details
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteRole(selectedRole)}
                disabled={deleteRoleMutation.isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Role
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role Name *</Label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g., Editor"
              />
            </div>
            <div className="space-y-2">
              <Label>Plural Name</Label>
              <Input
                value={newRolePlural}
                onChange={(e) => setNewRolePlural(e.target.value)}
                placeholder="e.g., Editors"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newRoleColor}
                  onChange={(e) => setNewRoleColor(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  value={newRoleColor}
                  onChange={(e) => setNewRoleColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={createRoleMutation.isLoading}>
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          {editingRole && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Role Name *</Label>
                <Input
                  value={editingRole.role}
                  onChange={(e) =>
                    setEditingRole({ ...editingRole, role: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Plural Name</Label>
                <Input
                  value={editingRole.plural || ""}
                  onChange={(e) =>
                    setEditingRole({ ...editingRole, plural: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingRole.color || "#3b82f6"}
                    onChange={(e) =>
                      setEditingRole({ ...editingRole, color: e.target.value })
                    }
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={editingRole.color || "#3b82f6"}
                    onChange={(e) =>
                      setEditingRole({ ...editingRole, color: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRole(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                updateRoleMutation.mutate({
                  id: editingRole._id,
                  data: {
                    role: editingRole.role,
                    plural: editingRole.plural,
                    color: editingRole.color,
                  },
                })
              }
              disabled={updateRoleMutation.isLoading}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
