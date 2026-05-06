

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
                if (rp.permission?.permission) permissionSet.add(String(rp.permission.permission).trim())
            })
            userPermDocs.forEach((up) => {
                if (up.permission?.permission) permissionSet.add(String(up.permission.permission).trim())
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

// Like protect(), but does not require a token.
// If an Authorization header is present and valid, it populates req.user.
// If an Authorization header is present but invalid/expired, it returns 401.
export const optionalProtect = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) return next()

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
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
            if (rp.permission?.permission) permissionSet.add(String(rp.permission.permission).trim())
        })
        userPermDocs.forEach((up) => {
            if (up.permission?.permission) permissionSet.add(String(up.permission.permission).trim())
        })

        req.user = {
            ...user.toObject(),
            permissions: Array.from(permissionSet),
        }
        return next()
    } catch (error) {
        return res.status(401).json({message:'Invalid or Expired Token'})
    }
}
