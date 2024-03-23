const express = require("express");
const cors = require("cors");
const app = express();
var axios = require("axios");
const createUule = require("create-uule");
const multer = require("multer");
const path = require("path");
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

require("dotenv").config();

app.use(cors());
app.use("/static", express.static(path.join(__dirname, "uploads")));

app.get("/api/shopping/:country/:location/:product", (req, res) => {
  const uule = createUule(req.params.location);
  const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(
    req.params.product
  )}&uule=${uule}&hl=en&gl=${req.params.country}&api_key=${
    process.env.SerpApiKey
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
  (req, res) => {
    const uule = createUule(req.params.location);
    const url = `https://serpapi.com/search.json?engine=google_lens&url=${encodeURIComponent(
      process.env.BackendLink + "static/" + req.file.filename
    )}
    &uule=${uule}
    &hl=en&country=${req.params.country}&api_key=${process.env.SerpApiKey}`;
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
  }
);
app.listen(5000);
