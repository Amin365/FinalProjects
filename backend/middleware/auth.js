

import jwt from 'jsonwebtoken'
import User from '../models/user.js'
import RolePermission from '../models/RolePermission.js'
import UserPermission from '../models/UserPermission.js'

export const protect =async(req,res,next)=>{
    const token =  req.headers.authorization?.split(" ")[1]
    if(!token)return res.status(401).json({message:'No token provided'})
        try {
            const decoded= jwt.verify(token,process.env.JWT_SECRET)
            const user = await User.findById(decoded.id)
              .select('-password')
              .populate('role', 'role plural color system')

            if (!user) {
                return res.status(401).json({ message: 'User not found' })
            }

            const roleId = user.role?._id || user.role
            const [rolePermDocs, userPermDocs] = await Promise.all([
                roleId
                    ? RolePermission.find({ role: roleId }).populate('permission', 'permission')
                    : [],
                UserPermission.find({ user: user._id }).populate('permission', 'permission'),
            ])

            const permissionSet = new Set()
            rolePermDocs.forEach((rp) => {
                if (rp.permission?.permission) permissionSet.add(rp.permission.permission)
            })
            userPermDocs.forEach((up) => {
                if (up.permission?.permission) permissionSet.add(up.permission.permission)
            })

            req.user = {
                ...user.toObject(),
                permissions: Array.from(permissionSet),
            }
            next()
        } catch (error) {
            res.status(401).json({message:'Invalid or Expired Token'})
        }


}