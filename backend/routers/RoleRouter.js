import express from 'express'
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/role.js';
import { apiLimiter } from '../utility/rateLimiter.js';
import { 
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
} from '../controller/Rolecontroller.js'

const RoleRouter = express.Router();

const viewRoles = [protect, requirePermission("View Role")];
const managePermissions = [protect, requirePermission("Manage Permissions")];
const addRole = [protect, requirePermission("Add Role")];
const editRole = [protect, requirePermission("Edit Role")];
const deleteRoleGuard = [protect, requirePermission("Delete Role")];

// Permission routes
RoleRouter.get('/permissions', managePermissions, apiLimiter, getPermissions);
RoleRouter.get('/permission-categories', managePermissions, apiLimiter, getPermissionCategories);
RoleRouter.get('/permission-matrix', managePermissions, apiLimiter, getPermissionMatrix);

// Role routes
RoleRouter.get('/roles', viewRoles, getRoles);
RoleRouter.get('/roles/:id', viewRoles, apiLimiter, getRoleById);
RoleRouter.post('/roles', addRole, apiLimiter, createRole);
RoleRouter.put('/roles/:id', editRole, apiLimiter, updateRole);
RoleRouter.delete('/roles/:id', deleteRoleGuard, apiLimiter, deleteRole);

// Role-permission management
RoleRouter.post('/roles/:id/permissions', managePermissions, apiLimiter, addPermissionToRole);
RoleRouter.put('/roles/:id/permissions/bulk', managePermissions, apiLimiter, bulkUpdateRolePermissions);
RoleRouter.delete('/roles/:id/permissions/:permissionId', managePermissions, apiLimiter, removePermissionFromRole);

export default RoleRouter;

