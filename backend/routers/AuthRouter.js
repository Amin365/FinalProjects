
import express from 'express'
import { loginLimiter, loginUser,refreshToken,logout, registerUser,GetProfile, validateInviteToken, setupPasswordFromInvite, resendInvite } from '../controller/Authcontroller.js'
import { protect } from '../middleware/auth.js'
import { createUserFromMember, getUserById, getUsers, getAvailableMembersForUserCreation } from '../controller/UserController.js'
import { apiLimiter } from '../utility/rateLimiter.js'
const AuthRouter=express.Router()




AuthRouter.post('/auth/register',registerUser)
AuthRouter.post('/auth/login',loginLimiter,loginUser)

AuthRouter.post("/auth/refresh", refreshToken);
AuthRouter.post("/auth/logout", logout);

// Phase 8 - Invite-based password setup routes (rate limited)
AuthRouter.get("/auth/validate-invite/:token", apiLimiter, validateInviteToken);
AuthRouter.post("/auth/setup-password", apiLimiter, setupPasswordFromInvite);
AuthRouter.post("/auth/resend-invite", apiLimiter, resendInvite);

AuthRouter.get("/auth/me", protect, GetProfile);

AuthRouter.post('/users',createUserFromMember)
AuthRouter.get("/users/:id", getUserById);
AuthRouter.get("/users", getUsers);
AuthRouter.get("/users/available-members", protect, getAvailableMembersForUserCreation);


export default AuthRouter;