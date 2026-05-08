import express from "express"
import mongoose from "mongoose"
import { createMember, getMembers,getMemberById,getMemberIdCardById,updateMember,bulkCreateMembers ,deleteMember,archiveMember,restoreMember,getMemberByCode,getMembersList,JoinClub, getJoinClubs, getJoinClubById, updateJoinClubStatus, getMemberOverview, createMemberNote, getMemberNotes, deleteMemberNote} from "../controller/members.js"
import { sendMemberEmail } from "../controller/EmailController.js"
import { optionalProtect, protect } from "../middleware/auth.js"
import { requirePermission } from "../middleware/role.js"
import { apiLimiter } from "../utility/rateLimiter.js"
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from '../utility/cloudinary.js'

   
    const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Books", // folder in cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    public_id: (req, file) => Date.now() + "-" + file.originalname.split(".")[0],
  },
});

const upload = multer({ storage });

const MemberRouter = express.Router()

const manageMembers = [protect, requirePermission("Manage Members")];
const manageTeachers = [protect, requirePermission("Manage Teacher")];


MemberRouter.param("id", (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid member id" })
  }
  next()
})




// collection routes
MemberRouter.route("/members")
  .get(manageMembers, getMembers)
  .post(manageMembers, upload.single("profile_picture"), createMember)

// static/specific routes MUST come before dynamic :id
// Protect the members list so we can return scoped lists for moderators
MemberRouter.get("/members/list", manageMembers, getMembersList);
MemberRouter.get("/members/by-code/:code", getMemberByCode);

// archive / restore and other item-specific actions
MemberRouter.get("/members/:id/id-card", protect, getMemberIdCardById)
MemberRouter.post('/members/:id/send-email', manageMembers, sendMemberEmail)
MemberRouter.post("/members/:id/archive", manageMembers, archiveMember)
MemberRouter.post("/members/:id/restore", manageMembers, restoreMember)
MemberRouter.post("/members/bulk", manageMembers, bulkCreateMembers);

// Member overview (profile timeline)
MemberRouter.get("/members/:id/overview", manageMembers, apiLimiter, getMemberOverview);

// Member notes
MemberRouter.route("/members/:id/notes")
  .get(manageMembers, apiLimiter, getMemberNotes)
  .post(manageMembers, apiLimiter, createMemberNote);
MemberRouter.delete("/members/:id/notes/:noteId", manageMembers, apiLimiter, deleteMemberNote);

// generic item routes last
MemberRouter.route("/members/:id")
  .get(manageMembers, getMemberById)
  .put(manageMembers, upload.single("profile_picture"), updateMember)
  .delete(manageMembers, deleteMember)

MemberRouter.post("/join-club", optionalProtect, JoinClub)

MemberRouter.get("/join-club", manageTeachers, apiLimiter, getJoinClubs)
MemberRouter.get("/join-club/:id", manageTeachers, apiLimiter, getJoinClubById)
MemberRouter.patch("/join-club/:id/status", manageTeachers, apiLimiter, updateJoinClubStatus)
export default MemberRouter
