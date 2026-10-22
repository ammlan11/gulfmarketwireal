import { Router } from "express";
import { login, loginPage, logout } from "../controllers/auth.controller";
const router = Router();
router.get("/login", loginPage);
router.post("/login", login);
router.post("/logout", logout);
export default router;
