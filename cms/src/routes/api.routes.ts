import { Router } from "express";
import {
  getNews,
  getNewsById,
  getTopStory,
  searchNews,
} from "../controllers/api.controller";
import { ingestNews } from "../controllers/ingest.controller";
const router = Router();
// Automated news task (key-protected, see ingest.controller.ts)
router.post("/ingest/news", ingestNews);

router.get("/news/search", searchNews);
router.get("/news/top-story", getTopStory);
router.get("/news/:id", getNewsById);
router.get("/news", getNews);
export default router;
