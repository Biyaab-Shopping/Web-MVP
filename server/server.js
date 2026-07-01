const express = require("express");
const cors = require("cors");
const app = express();
var axios = require("axios");
const createUule = require("create-uule");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");

function buildStaticImageUrl(filename) {
  const base = (
    process.env.REACT_APP_BACKEND_URL || "http://localhost:5000/api"
  ).replace(/\/$/, "");
  return `${base}/static/${filename}`;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + "." + file.mimetype.split("/")[1]
    );
  },
});
const upload = multer({ storage: storage });

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

app.use(cors());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use("/api/static", express.static(path.join(__dirname, "uploads")));

app.get("/api/rates", async (req, res) => {
  const appId =
    process.env.OPEN_EXCHANGE_APP_ID;
  if (!appId) {
    return res.status(500).json({ error: "Missing OPEN_EXCHANGE_APP_ID in .env" });
  }
  try {
    const response = await axios.get(
      `https://openexchangerates.org/api/latest.json?app_id=${appId}`
    );
    res.json(response.data.rates);
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error.response?.data || error);
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
      console.log(error.response.data);
      res.status(400).json(error.response.data);
    });
});

app.post(
  "/api/shopping/:country/:location",
  upload.single("object"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded." });
    }

    try {
      const uule = createUule(req.params.location);
      const imageUrl = buildStaticImageUrl(req.file.filename);
      console.log(imageUrl);
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
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  }
);

app.post("/api/shopping/saveimage", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const response = await axios.get(imageUrl, {
      responseType: "stream",
    });

    const imageName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const imagePath = path.join(__dirname, "uploads", imageName); // Path to save the image

    // Create a writable stream and pipe the image data to it
    const writer = fs.createWriteStream(imagePath);
    response.data.pipe(writer);

    // Wait for the writer to finish writing the image
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
    res.json({ imagePath: buildStaticImageUrl(imageName) });
  } catch (error) {
    console.error("Error saving image:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.listen(5000);
