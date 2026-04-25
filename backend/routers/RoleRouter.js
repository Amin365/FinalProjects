import express from 'express'
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
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

// All permission/role management routes require admin role
const adminOnly = [protect, requireRole(["Super Admin", "Admin"])];

// Permission routes
RoleRouter.get('/permissions', adminOnly, apiLimiter, getPermissions);
RoleRouter.get('/permission-categories', adminOnly, apiLimiter, getPermissionCategories);
RoleRouter.get('/permission-matrix', adminOnly, apiLimiter, getPermissionMatrix);

// Role routes
RoleRouter.get('/roles', getRoles);
RoleRouter.get('/roles/:id', adminOnly, apiLimiter, getRoleById);
RoleRouter.post('/roles', adminOnly, apiLimiter, createRole);
RoleRouter.put('/roles/:id', adminOnly, apiLimiter, updateRole);
RoleRouter.delete('/roles/:id', adminOnly, apiLimiter, deleteRole);

// Role-permission management
RoleRouter.post('/roles/:id/permissions', adminOnly, apiLimiter, addPermissionToRole);
RoleRouter.put('/roles/:id/permissions/bulk', adminOnly, apiLimiter, bulkUpdateRolePermissions);
RoleRouter.delete('/roles/:id/permissions/:permissionId', adminOnly, apiLimiter, removePermissionFromRole);

export default RoleRouter;

