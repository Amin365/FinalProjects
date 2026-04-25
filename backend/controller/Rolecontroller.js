import mongoose from "mongoose";
import Role from "../models/Role.js";
import Permission from "../models/Permissions.js";
import PermissionCategory from "../models/PermissionCategory.js";
import RolePermission from "../models/RolePermission.js";
import UserPermission from "../models/UserPermission.js";
import { logRoleAction, logAudit, buildChanges } from "../utility/auditLog.js";

/**
 * Create a new role
 * POST /roles
 */
export async function createRole(req, res) {
  try {
    const { role, plural, color, system } = req.body;
    
    if (!role || !role.trim()) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const newRole = new Role({ 
      role: role.trim(), 
      plural: plural?.trim() || "",
      color: color || "#00000000",
      system: system || false,
    });
    
    const savedRole = await newRole.save();
    
    // Audit log
    await logRoleAction("created", savedRole, req.user, req, {
      description: `Role "${savedRole.role}" was created`,
    });

    res.status(201).json({ data: savedRole });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Role with this name already exists" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/**
 * Get all roles with optional permission counts
 * GET /roles
 */
export async function getRoles(req, res) {
  try {
    const { includePermissions } = req.query;

    let roles = await Role.find().lean().exec();

    if (includePermissions === "true") {
      // Get permission counts for each role
      const permissionCounts = await RolePermission.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]);

      const countMap = {};
      permissionCounts.forEach((pc) => {
        countMap[pc._id.toString()] = pc.count;
      });

      roles = roles.map((r) => ({
        ...r,
        permissionCount: countMap[r._id.toString()] || 0,
      }));
    }

    res.status(200).json({ data: roles });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/**
 * Get a single role by ID with its permissions
 * GET /roles/:id
 */
export async function getRoleById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid role ID" });
    }

    const role = await Role.findById(id).lean().exec();
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Get permissions for this role
    const rolePermissions = await RolePermission.find({ role: id })
      .populate({
        path: "permission",
        populate: { path: "category", select: "name" },
      })
      .lean()
      .exec();

    const permissions = rolePermissions
      .filter((rp) => rp.permission)
      .map((rp) => ({
        _id: rp.permission._id,
        permission: rp.permission.permission,
        category: rp.permission.category?.name || null,
        grouped_under: rp.permission.grouped_under,
        system: rp.system,
        addedAt: rp.createdAt,
      }));

    res.status(200).json({ data: { ...role, permissions } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/**
 * Update a role
 * PUT /roles/:id
 */
export async function updateRole(req, res) {
  try {
    const { id } = req.params;
    const { role, plural, color } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid role ID" });
    }

    const existing = await Role.findById(id).lean().exec();
    if (!existing) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Don't allow editing system roles
    if (existing.system) {
      return res.status(403).json({ message: "Cannot modify system roles" });
    }

    const updateData = {};
    if (role) updateData.role = role.trim();
    if (plural !== undefined) updateData.plural = plural?.trim() || "";
    if (color !== undefined) updateData.color = color;

    const updated = await Role.findByIdAndUpdate(id, updateData, { new: true }).lean().exec();

    // Audit log
    const changes = buildChanges(existing, updated, ["role", "plural", "color"]);
    await logRoleAction("updated", updated, req.user, req, {
      changes,
      description: `Role "${updated.role}" was updated`,
    });

    res.status(200).json({ data: updated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Role with this name already exists" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/**
 * Delete a role
 * DELETE /roles/:id
 */
export async function deleteRole(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid role ID" });
    }

    const role = await Role.findById(id).lean().exec();
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Don't allow deleting system roles
    if (role.system) {
      return res.status(403).json({ message: "Cannot delete system roles" });
    }

    // Delete role-permission mappings
    await RolePermission.deleteMany({ role: id });

    // Delete the role
    await Role.findByIdAndDelete(id);

    // Audit log
    await logRoleAction("deleted", role, req.user, req, {
      description: `Role "${role.role}" was deleted`,
    });

    res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/**
 * Add permission to role
 * POST /roles/:id/permissions
 */
export async function addPermissionToRole(req, res) {
  try {
    const { id } = req.params;
    const { permissionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid role ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(permissionId)) {
      return res.status(400).json({ message: "Invalid permission ID" });
    }

    const role = await Role.findById(id).lean().exec();
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    const permission = await Permission.findById(permissionId).lean().exec();
    if (!permission) {
      return res.status(404).json({ message: "Permission not found" });
    }

    // Check if mapping already exists
    const existing = await RolePermission.findOne({ role: id, permission: permissionId });
    if (existing) {
      return res.status(409).json({ message: "Permission already assigned to role" });
    }

    await RolePermission.create({
      role: id,
      permission: permissionId,
      added_by: req.user?._id || null,
    });

    // Audit log
    await logAudit({
      user: req.user,
      action: "role.permission_added",
      entityType: "Role",
      entityId: role._id,
      entityLabel: role.role,
      req,
      meta: { permissionId, permissionName: permission.permission },
      description: `Permission "${permission.permission}" added to role "${role.role}"`,
    });

    res.status(201).json({ message: "Permission added to role" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/**
 * Remove permission from role
 * DELETE /roles/:id/permissions/:permissionId
 */
export async function removePermissionFromRole(req, res) {
  try {
    const { id, permissionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid role ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(permissionId)) {
      return res.status(400).json({ message: "Invalid permission ID" });
    }

    const role = await Role.findById(id).lean().exec();
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    const permission = await Permission.findById(permissionId).lean().exec();

    const deleted = await RolePermission.findOneAndDelete({ role: id, permission: permissionId });
    if (!deleted) {
      return res.status(404).json({ message: "Role-permission mapping not found" });
    }

    // Audit log
    await logAudit({
      user: req.user,
      action: "role.permission_removed",
      entityType: "Role",
      entityId: role._id,
      entityLabel: role.role,
      req,
      meta: { permissionId, permissionName: permission?.permission },
      description: `Permission "${permission?.permission}" removed from role "${role.role}"`,
    });

    res.status(200).json({ message: "Permission removed from role" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/**
 * Get all permissions grouped by category
 * GET /permissions
 */
export async function getPermissions(req, res) {
  try {
    const permissions = await Permission.find()
      .populate("category", "name")
      .lean()
      .exec();

    // Group by category
    const grouped = {};
    permissions.forEach((p) => {
      const catName = p.category?.name || "Uncategorized";
      if (!grouped[catName]) {
        grouped[catName] = [];
      }
      grouped[catName].push(p);
    });

    res.status(200).json({ data: { permissions, grouped } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/**
 * Get permission categories
 * GET /permission-categories
 */
export async function getPermissionCategories(req, res) {
  try {
    const categories = await PermissionCategory.find().lean().exec();
    res.status(200).json({ data: categories });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/**
 * Get permission matrix (all roles with their permissions)
 * GET /permission-matrix
 */
export async function getPermissionMatrix(req, res) {
  try {
    // Get all roles
    const roles = await Role.find().lean().exec();

    // Get all permissions grouped by category
    const permissions = await Permission.find()
      .populate("category", "name")
      .lean()
      .exec();

    // Get all role-permission mappings
    const rolePermissions = await RolePermission.find().lean().exec();

    // Build matrix
    const matrix = {};
    roles.forEach((role) => {
      matrix[role._id.toString()] = {
        role,
        permissions: new Set(),
      };
    });

    rolePermissions.forEach((rp) => {
      const roleId = rp.role.toString();
      if (matrix[roleId]) {
        matrix[roleId].permissions.add(rp.permission.toString());
      }
    });

    // Convert Sets to arrays and group permissions by category
    const result = roles.map((role) => ({
      ...role,
      permissions: Array.from(matrix[role._id.toString()].permissions),
    }));

    // Group permissions by category
    const groupedPermissions = {};
    permissions.forEach((p) => {
      const catName = p.category?.name || "Uncategorized";
      if (!groupedPermissions[catName]) {
        groupedPermissions[catName] = [];
      }
      groupedPermissions[catName].push(p);
    });

    res.status(200).json({
      data: {
        roles: result,
        permissions,
        groupedPermissions,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/**
 * Bulk update role permissions
 * PUT /roles/:id/permissions/bulk
 */
export async function bulkUpdateRolePermissions(req, res) {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid role ID" });
    }

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ message: "permissionIds must be an array" });
    }

    const role = await Role.findById(id).lean().exec();
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Get current permissions
    const currentPermissions = await RolePermission.find({ role: id }).lean();
    const currentPermIds = new Set(currentPermissions.map((rp) => rp.permission.toString()));
    const newPermIds = new Set(permissionIds.filter((pid) => mongoose.Types.ObjectId.isValid(pid)));

    // Permissions to add
    const toAdd = [...newPermIds].filter((pid) => !currentPermIds.has(pid));
    
    // Permissions to remove
    const toRemove = [...currentPermIds].filter((pid) => !newPermIds.has(pid));

    // Remove old permissions
    if (toRemove.length > 0) {
      await RolePermission.deleteMany({ role: id, permission: { $in: toRemove } });
    }

    // Add new permissions
    if (toAdd.length > 0) {
      const newMappings = toAdd.map((pid) => ({
        role: id,
        permission: pid,
        added_by: req.user?._id || null,
      }));
      await RolePermission.insertMany(newMappings);
    }

    // Audit log
    await logAudit({
      user: req.user,
      action: "role.updated",
      entityType: "Role",
      entityId: role._id,
      entityLabel: role.role,
      req,
      meta: { added: toAdd.length, removed: toRemove.length },
      description: `Role "${role.role}" permissions updated: ${toAdd.length} added, ${toRemove.length} removed`,
    });

    res.status(200).json({
      message: "Role permissions updated",
      added: toAdd.length,
      removed: toRemove.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

export default {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  addPermissionToRole,
  removePermissionFromRole,
  getPermissions,
  getPermissionCategories,
  getPermissionMatrix,
  bulkUpdateRolePermissions,
};

