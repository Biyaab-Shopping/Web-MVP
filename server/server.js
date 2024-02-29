const express = require("express");
const cors = require("cors");
const app = express();
var axios = require("axios");
require("dotenv").config();

app.use(cors());

app.get("/api/shopping/:location/:product", (req, res) => {
  axios({
    method: "get",
    url: `https://serpapi.com/search.json?engine=google_shopping&q=${req.params.product}&location=${req.params.location}&hl=en&api_key=${process.env.SerpApiKey}&start=${req.query.start}&num=${req.query.num}`,
  })
    .then(function (response) {
      res.json(response.data);
    })
    .catch((error) => {
      // console.log(error);
      res.status(400).json(error);
    });
});

app.listen(5000);
