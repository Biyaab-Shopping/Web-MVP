const app = require("./app");

const PORT = process.env.PORT || 5000;
const path = require("path");
const fs = require("fs");
const buildPath = path.join(__dirname, "..", "build");

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (fs.existsSync(buildPath)) {
    console.log("Serving React build from /build");
  }
});
