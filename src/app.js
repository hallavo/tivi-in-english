const express = require("express");
const path = require("path");
const { PORT } = require("./config/constants");
const routes = require("./routes");

const app = express();

app.use(express.static("public"));
app.use("/", routes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
