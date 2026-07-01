const path = require("path");
const fs = require("fs");

// Platform env vars take precedence; .env fills gaps for local and VPS-style hosts.
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const createUule = require("create-uule");
const multer = require("multer");
const bodyParser = require("body-parser");

const app = express();
const isVercel = process.env.VERCEL === "1";
const PORT = process.env.PORT || 5000;
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function getApiBaseUrl() {
  if (process.env.APP_URL) {
    return `${process.env.APP_URL.replace(/\/$/, "")}/api`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api`;
  }
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  if (backendUrl && !backendUrl.startsWith("/")) {
    return backendUrl.replace(/\/$/, "");
  }
  return `http://localhost:${PORT}/api`;
}

function buildStaticImageUrl(filename) {
  return `${getApiBaseUrl()}/static/${filename}`;
}

function canUseVercelBlob() {
  return (
    isVercel ||
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.BLOB_STORE_ID
  );
}

const BLOB_SETUP_HINT =
  "Connect a Vercel Blob store to this project (Storage → Blob → Connect to Project), then redeploy.";

async function uploadToVercelBlob(buffer, filename, contentType) {
  const { put } = require("@vercel/blob");
  const options = {
    access: "public",
    contentType,
    addRandomSuffix: true,
  };
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    options.token = process.env.BLOB_READ_WRITE_TOKEN;
  }
  const blob = await put(filename, buffer, options);
  return blob.url;
}

async function uploadToDisk(buffer, filename) {
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, buffer);
  return buildStaticImageUrl(filename);
}

async function uploadPublicImage(buffer, filename, contentType) {
  if (canUseVercelBlob()) {
    try {
      return await uploadToVercelBlob(buffer, filename, contentType);
    } catch (error) {
      if (isVercel) {
        throw new Error(
          error.message?.includes("token")
            ? `Vercel Blob is not configured. ${BLOB_SETUP_HINT}`
            : error.message
        );
      }
      console.warn(
        "Vercel Blob upload failed, falling back to disk:",
        error.message
      );
    }
  }

  if (!process.env.APP_URL && process.env.NODE_ENV === "production") {
    throw new Error(
      "Set APP_URL to your public server URL (e.g. https://biyaab.com) so uploaded images are reachable for image search."
    );
  }

  return uploadToDisk(buffer, filename);
}

const upload = multer({
  storage: isVercel
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, uploadsDir);
        },
        filename: function (req, file, cb) {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          cb(
            null,
            file.fieldname +
              "-" +
              uniqueSuffix +
              "." +
              file.mimetype.split("/")[1]
          );
        },
      }),
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/api/static/:filename", (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.status(404).json({ error: "File not found" });
});

app.get("/api/rates", async (req, res) => {
  const appId = process.env.OPEN_EXCHANGE_APP_ID;
  if (!appId) {
    return res
      .status(500)
      .json({ error: "Missing OPEN_EXCHANGE_APP_ID in .env" });
  }
  try {
    const response = await axios.get(
      `https://openexchangerates.org/api/latest.json?app_id=${appId}`
    );
    res.json(response.data.rates);
  } catch (error) {
    console.error(
      "Failed to fetch exchange rates:",
      error.response?.data || error
    );
    res.status(500).json({ error: "Failed to fetch exchange rates" });
  }
});

app.get("/api/shopping/:country/:location/:product", (req, res) => {
  const uule = createUule(req.params.location);
  const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(
    req.params.product
  )}&uule=${uule}&hl=en&gl=${req.params.country}&api_key=${
    process.env.SERP_API_KEY
  }&start=${req.query.start}&num=${req.query.num}`;
  console.log(url);
  axios({
    method: "get",
    url: url,
  })
    .then(function (response) {
      res.json(response.data);
    })
    .catch((error) => {
      console.log(error.response?.data);
      res.status(400).json(error.response?.data);
    });
});

app.post(
  "/api/shopping/:country/:location",
  upload.single("object"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded." });
    }

    let localFilePath;

    try {
      const uule = createUule(req.params.location);
      let imageUrl;

      if (req.file.buffer) {
        const filename =
          req.file.originalname ||
          `upload-${Date.now()}.${req.file.mimetype.split("/")[1]}`;
        imageUrl = await uploadPublicImage(
          req.file.buffer,
          filename,
          req.file.mimetype
        );
      } else {
        localFilePath = req.file.path;
        imageUrl = buildStaticImageUrl(req.file.filename);
      }

      const url = `https://serpapi.com/search.json?engine=google_lens&url=${encodeURIComponent(
        imageUrl
      )}&uule=${uule}&hl=en&country=${req.params.country}&api_key=${
        process.env.SERP_API_KEY
      }`;
      console.log(url);

      const response = await axios.get(url);
      if (response.data.error) {
        return res.status(400).json(response.data);
      }
      res.json(response.data);
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.message ||
        "Image search failed.";
      console.log(error.response?.data || error.message);
      res.status(400).json({ error: message });
    } finally {
      if (localFilePath && fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    }
  }
);

app.post("/api/shopping/saveimage", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });

    const contentType = response.headers["content-type"] || "image/jpeg";
    const extension = contentType.split("/")[1] || "jpg";
    const imageName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
    const publicUrl = await uploadPublicImage(
      Buffer.from(response.data),
      imageName,
      contentType
    );

    res.json({ imagePath: publicUrl });
  } catch (error) {
    console.error("Error saving image:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Local production and VPS/Railway/Render/etc.: serve React build from Express.
// On Vercel, static files are served from /build via vercel.json.
if (!isVercel) {
  const buildPath = path.join(__dirname, "..", "build");
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(buildPath, "index.html"));
    });
  }
}

module.exports = app;
