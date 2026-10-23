import { Router } from "express";

import * as admin from "../controllers/admin.controller";
import { requireAdmin } from "../middleware/auth";
import { upload, verifyUploadedImage } from "../middleware/upload";
import { requireSameOrigin } from "../middleware/security";

const router = Router();

router.use(requireAdmin);

// Refuse form posts that come from another website (CSRF).
router.use(requireSameOrigin);

// Dashboard
router.get("/news", admin.dashboard);

// Create
router.get("/news/new", admin.createPage);

router.post(
  "/news",
  upload.single("image"),
  verifyUploadedImage,
  admin.create,
);

// View
router.get(
  "/news/:id",
  admin.view,
);

// Edit
router.get(
  "/news/:id/edit",
  admin.editPage,
);

router.post(
  "/news/:id",
  upload.single("image"),
  verifyUploadedImage,
  admin.edit,
);

// One-click Publish / Move to draft
router.post(
  "/news/:id/status",
  admin.changeStatus,
);

// Delete
router.post(
  "/news/:id/delete",
  admin.remove,
);

export default router;