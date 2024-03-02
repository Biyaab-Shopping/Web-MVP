const express = require("express");
const cors = require("cors");
const app = express();
var axios = require("axios");
require("dotenv").config();

app.use(cors());

app.get("/api/shopping/:country/:location/:product", (req, res) => {
  const url = `https://serpapi.com/search.json?engine=google_shopping&q=${req.params.product}&location=${req.params.location}&hl=en&gl=${req.params.country}&api_key=${process.env.SerpApiKey}&start=${req.query.start}&num=${req.query.num}`;
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

app.listen(5000);
