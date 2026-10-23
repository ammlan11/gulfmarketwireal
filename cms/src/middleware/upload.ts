import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";

const uploadDirectory = path.join(process.cwd(), "public", "uploads", "news");

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

/*
 * Matches the "Max 8 MB" shown on the article form.
 */
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function uploadError(message: string) {
  return Object.assign(new Error(message), { status: 400, expose: true });
}

/*
 * The file is first saved under a random name with NO extension, so nothing
 * the browser claims (file name or type) decides how it is served.
 * verifyUploadedImage() then checks the real file contents and gives it the
 * matching extension.
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (_req, _file, cb) => {
    cb(null, `${Date.now()}-${crypto.randomUUID()}.upload`);
  },
});

export const upload = multer({
  storage,

  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
  },

  // A quick first filter on the declared type; the real check is below.
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(uploadError("Only JPG, PNG, WEBP and GIF images are allowed."));
    }

    cb(null, true);
  },
});

/*
 * Identify an image from its first bytes ("magic numbers").
 * Returns the extension to use, or null if it isn't one of our formats.
 */
function detectImageType(head: Buffer): "jpg" | "png" | "webp" | "gif" | null {
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return "jpg";
  }

  if (
    head.length >= 8 &&
    head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "png";
  }

  if (head.length >= 6) {
    const sig = head.subarray(0, 6).toString("ascii");
    if (sig === "GIF87a" || sig === "GIF89a") return "gif";
  }

  if (
    head.length >= 12 &&
    head.subarray(0, 4).toString("ascii") === "RIFF" &&
    head.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

/*
 * Runs right after upload.single("image"). Rejects anything that isn't
 * really a JPG/PNG/WEBP/GIF (for example an HTML or SVG file renamed to
 * .jpg, which could otherwise run scripts on the CMS domain), and renames
 * real images to the extension that matches their contents.
 */
export async function verifyUploadedImage(req: Request, _res: Response, next: NextFunction) {
  const file = req.file;
  if (!file) return next();

  try {
    const handle = await fs.promises.open(file.path, "r");
    const head = Buffer.alloc(16);
    const { bytesRead } = await handle.read(head, 0, 16, 0);
    await handle.close();

    const type = detectImageType(head.subarray(0, bytesRead));

    if (!type) {
      await fs.promises.unlink(file.path).catch(() => {});
      return next(uploadError("That file isn't a valid JPG, PNG, WEBP or GIF image."));
    }

    const finalName = file.filename.replace(/\.upload$/, `.${type}`);
    const finalPath = path.join(uploadDirectory, finalName);

    await fs.promises.rename(file.path, finalPath);

    file.filename = finalName;
    file.path = finalPath;

    next();
  } catch (error) {
    await fs.promises.unlink(file.path).catch(() => {});
    next(error);
  }
}
