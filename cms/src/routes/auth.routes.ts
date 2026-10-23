import { Router } from "express";
import { login, loginPage, logout } from "../controllers/auth.controller";
import { requireSameOrigin } from "../middleware/security";
const router = Router();
router.get("/login", loginPage);
router.post("/login", requireSameOrigin, login);
router.post("/logout", requireSameOrigin, logout);
export default router;
