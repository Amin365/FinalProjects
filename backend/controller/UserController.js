import mongoose from "mongoose";
import User from "../models/user.js";

import Member from "../models/Members.js";
import bcrypt from "bcryptjs";
import { sendMail, buildEmailHtml } from "./EmailController.js";
import RefreshToken from "../models/RefreshToken.js";


export const createUserFromMember = async (req, res, next) => {
  try {
    const { member, username, password } = req.body;

    if (!member) return res.status(400).json({ message: "member is required" });
    if (!username) return res.status(400).json({ message: "username is required" });
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "password must be at least 6 characters" });
    }

    if (!mongoose.Types.ObjectId.isValid(member)) {
      return res.status(400).json({ message: "Invalid member id" });
    }

    // 1) fetch member (we need name/email/role)
    const m = await Member.findById(member).lean().exec();
    if (!m) return res.status(404).json({ message: "Member not found" });

    if (!m.email) {
      return res.status(400).json({ message: "Selected member must have an email to create a user." });
    }

    // 2) block duplicates (member already has user)
    const existingForMember = await User.findOne({ member: m._id }).lean().exec();
    if (existingForMember) {
      return res.status(409).json({ message: "This member already has a user account" });
    }

    // 3) block duplicate username/email
    const [existingUsername, existingEmail] = await Promise.all([
      User.findOne({ username }).lean().exec(),
      User.findOne({ email: m.email }).lean().exec(),
    ]);

    if (existingUsername) return res.status(409).json({ message: "Username already exists" });
    if (existingEmail) return res.status(409).json({ message: "Email already exists" });

    // 4) create user (password hashing happens in pre-save)
    const user = await User.create({
      first_name: m.first_name,
      middle_name: m.middle_name || "",
      last_name: m.last_name,
      username,
      email: m.email,
      password,                 // plaintext ok here -> will be hashed by pre-save
      member_id: m.code || String(m._id), // optional mapping
      role: m.role || null,      //  role copied from member
      status: m.status || 'Active', //  mirror member status
      member: m._id,             //  relation user -> member

      // optional audit fields (if you have auth middleware)
      added_by: req.user?._id || null,
      updated_by: req.user?._id || null,
    });

    // 5) return populated
    const populated = await User.findById(user._id)
      .populate("role", "role color plural system")
      .populate("member", "first_name middle_name last_name full_name Profile_picture email phone code role")
      .lean()
      .exec();

    return res.status(201).json({ data: populated });
  } catch (err) {
    // handle duplicate key nicely
    if (err && err.code === 11000) {
      const dupField = Object.keys(err.keyValue || {}).join(", ") || "unique field";
      return res.status(409).json({
        message: `Duplicate ${dupField}: already exists.`,
        details: err.keyValue || null,
      });
    }
    return next(err);
  }
};
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id)
      .populate("role", "role color plural system")
      .populate("member",  "first_name middle_name last_name Profile_picture full_name email phone Profile_picture code role")
      .lean()
      .exec();

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ data: user });
  } catch (err) {
    return next(err);
  }
};
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "-createdAt", q } = req.query;

    const filter = {};
    if (q) {
      const re = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { username: re },
        { email: re },
        { first_name: re },
        { middle_name: re },
        { last_name: re },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.max(1, Math.min(200, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * perPage;

    const [items, total] = await Promise.all([
      User.find(filter)
        .populate("role", "role color plural system")
        .populate("member", "first_name middle_name Profile_picture last_name full_name email phone code role")
        .sort(sort)
        .skip(skip)
        .limit(perPage)
        .lean()
        .exec(),
      User.countDocuments(filter).exec(),
    ]);

    return res.status(200).json({
      data: items,
      total,
      page: pageNum,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (err) {
    return next(err);
  }
};

// List members that do NOT yet have a user account
export const getAvailableMembersForUserCreation = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 50, sort = "-createdAt" } = req.query;

    // Collect all member ids that already have users
    const userMemberDocs = await User.find({}, "member").lean().exec();
    const usedMemberIds = new Set(
      userMemberDocs
        .map((u) => u.member)
        .filter(Boolean)
        .map((id) => String(id))
    );

    const filter = {};
    if (q) {
      const re = new RegExp(String(q).replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { first_name: re },
        { middle_name: re },
        { last_name: re },
        { email: re },
        { phone: re },
        { code: re },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * perPage;

    // Query members and filter out those with existing users
    const allMembers = await Member.find(filter)
      .select("_id first_name middle_name last_name Profile_picture full_name code email createdAt role")
      .sort(sort)
      .lean()
      .exec();

    const available = allMembers.filter((m) => !usedMemberIds.has(String(m._id)));

    const paged = available.slice(skip, skip + perPage);

    return res.status(200).json({
      data: paged,
      total: available.length,
      page: pageNum,
      limit: perPage,
      totalPages: Math.ceil(available.length / perPage),
    });
  } catch (err) {
    return next(err);
  }
};

// Update a user's status (Active, Inactive, pending)
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const allowed = ["Active", "Inactive", "pending"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(", ")}` });
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { status, updated_by: req.user?._id || null },
      { new: true }
    )
      .populate("role", "role color plural system")
      .populate("member", "first_name middle_name last_name full_name email phone code role")
      .lean()
      .exec();

    if (!updated) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ data: updated });
  } catch (err) {
    return next(err);
  }
};

// Admin: update any user's basic info
export const adminUpdateUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const {
      first_name,
      middle_name,
      last_name,
      username,
      email,
      status,
      role_id,
      Bio,
    } = req.body || {};

    const updateData = {};
    if (first_name !== undefined) updateData.first_name = String(first_name).trim();
    if (middle_name !== undefined) updateData.middle_name = String(middle_name).trim();
    if (last_name !== undefined) updateData.last_name = String(last_name).trim();
    if (username !== undefined) updateData.username = String(username).trim();
    if (email !== undefined) updateData.email = String(email).trim();
    if (Bio !== undefined) updateData.Bio = Bio;

    if (status !== undefined) {
      const allowed = ["Active", "Inactive", "pending"];
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: `status must be one of: ${allowed.join(", ")}` });
      }
      updateData.status = status;
    }

    if (role_id !== undefined) {
      if (role_id === null || role_id === "" || role_id === undefined) {
        updateData.role = null;
      } else if (!mongoose.Types.ObjectId.isValid(role_id)) {
        return res.status(400).json({ message: "Invalid role id" });
      } else {
        updateData.role = role_id;
      }
    }

    updateData.updated_by = req.user?._id || null;

    if (updateData.username) {
      const existing = await User.findOne({ username: updateData.username, _id: { $ne: id } }).lean().exec();
      if (existing) return res.status(409).json({ message: "Username already exists" });
    }
    if (updateData.email) {
      const existing = await User.findOne({ email: updateData.email, _id: { $ne: id } }).lean().exec();
      if (existing) return res.status(409).json({ message: "Email already exists" });
    }

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate("role", "role color plural system")
      .populate("member", "first_name middle_name last_name full_name Profile_picture email phone code role")
      .lean()
      .exec();

    if (!updated) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ data: updated });
  } catch (err) {
    if (err && err.code === 11000) {
      const dupField = Object.keys(err.keyValue || {}).join(", ") || "unique field";
      return res.status(409).json({ message: `Duplicate ${dupField}: already exists.`, details: err.keyValue || null });
    }
    return next(err);
  }
};

// Admin: set/reset a user's password
export const adminSetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const { newPassword, confirmPassword, mustChangePassword } = req.body || {};

    if (!newPassword) {
      return res.status(400).json({ message: "newPassword is required" });
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findById(id).exec();
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword;
    if (typeof mustChangePassword === "boolean") {
      user.mustChangePassword = mustChangePassword;
    }
    user.updated_by = req.user?._id || null;

    await user.save({ validateBeforeSave: false });

    // revoke all refresh tokens so the user is forced to re-auth
    await RefreshToken.updateMany({ user: user._id, revoked: false }, { revoked: true }).exec();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    return next(err);
  }
};




// Get current user's profile
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("role", "role color plural system")
      .populate("member", "first_name middle_name last_name full_name Profile_picture email student_id department join_date phone code role")
      .lean()
      .exec();

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ data: user });
  } catch (err) {
    return next(err);
  }
};

// Update current user's profile
export const updateProfile = async (req, res, next) => {
  try {
//  console.log("------------ PROFILE UPDATE REQUEST ------------");
//     console.log("req.headers:", req.headers);
//     console.log("req.file:", req.file);
//     console.log("req.body:", req.body);

    const userId = req.user._id;
    const { name, bio, phone } = req.body || {};
    const profilePicture = req.file ? req.file.path : undefined; // Cloudinary URL

    const updateData = {};
    if (name) {
      const [firstName, ...lastNameParts] = name.split(' ');
      updateData.first_name = firstName || '';
      updateData.last_name = lastNameParts.join(' ') || '';
    }
    if (bio !== undefined) updateData.Bio = bio;
    if (phone !== undefined) updateData.phone = phone;
    if (profilePicture) updateData.profile_picture = profilePicture;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    )
      .populate("role", "role color plural system")
      .populate("member", "first_name middle_name last_name full_name Profile_picture email phone code role")
      .lean()
      .exec();

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ data: updatedUser });
  } catch (err) {
    return next(err);
  }
};

// Change current user's password
// Change current user's password
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All password fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New password and confirmation do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update only the password field to avoid full validation
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    return next(err);
  }
};

// Delete current user's account
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    return next(err);
  }
};




export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    // Generate 6-digit OTP
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Replace old OTP automatically
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save({ validateBeforeSave: false });

    await sendMail({
      to: user.email,
      subject: "Password Reset Code",
      text: `Your password reset code is ${resetCode}. This code expires in 10 minutes. If you did not request a reset, you can ignore this email.`,
      html: buildEmailHtml({
        title: "Password Reset Code",
        preheader: `Your reset code is ${resetCode}`,
        greeting: `Hello ${user.first_name || ""} ${user.last_name || ""}`.trim(),
        bodyLines: [
          `Use the following code to reset your password: <strong>${resetCode}</strong>.`,
          "This code expires in 10 minutes for your security.",
          "If you did not request this password reset, you can safely ignore this email.",
        ],
        footerNote: `Stay safe, ${process.env.APP_NAME || "Reading Club"}`,
      }),
    });

    return res.status(200).json({
      message: "OTP sent to email",
    });
  } catch (err) {
    next(err);
  }
};

export const verifyResetCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code)
      return res.status(400).json({ message: "Email and code are required" });

    const user = await User.findOne({
      email,
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({
        message: "Invalid or expired reset code",
      });

    return res.status(200).json({
      message: "OTP verified",
      userId: user._id, // frontend can store this temporarily
    });
  } catch (err) {
    next(err);
  }
};






export const resetPassword = async (req, res, next) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Strong password check
    // const strongPasswordRegex =
    //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    // if (!strongPasswordRegex.test(newPassword)) {
    //   return res.status(400).json({
    //     message:
    //       "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
    //   });
    // }

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    //  IMPORTANT: assign plain password
    user.password = newPassword;

    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;

    // pre('save') will hash it ONCE
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (err) {
    next(err);
  }
};




export const resendResetCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    // Generate new OTP (old one is overwritten automatically)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Send OTP email again
    await sendMail({
      to: user.email,
      subject: "Password Reset Code",
      text: `Your new password reset code is ${resetCode}. This code expires in 10 minutes. If you did not request a reset, you can ignore this email.`,
      html: buildEmailHtml({
        title: "Password Reset Code",
        preheader: `Your reset code is ${resetCode}`,
        greeting: `Hello ${user.first_name || ""} ${user.last_name || ""}`.trim(),
        bodyLines: [
          `Here is your new reset code: <strong>${resetCode}</strong>.`,
          "This code expires in 10 minutes for your security.",
          "If you did not request this password reset, you can safely ignore this email.",
        ],
        footerNote: `Stay safe, ${process.env.APP_NAME || "Reading Club"}`,
      }),
    });

    return res.status(200).json({
      message: "New verification code sent to email",
    });
  } catch (err) {
    next(err);
  }
};





// Existing controllers...

// ... existing controllers ...