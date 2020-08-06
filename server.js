const express = require("express");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
const fileupload = require("express-fileupload");
const path = require("path");
const morgan = require("morgan");
const users = require("./routes/users");
const photo = require("./routes/photo");
const follow = require("./routes/follow");

const app = express();

app.use(express.json());
app.use(fileupload());

app.use(express.static(path.join(__dirname, "public")));

app.use(morgan("combined"));

app.use("/api/v1/users", users);
app.use("/api/v1/photo", photo);
app.use("/api/v1/follow", follow);

const PORT = process.env.PORT || 5700;

app.get("/", (req, res, next) => {
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log("App listening on port 5700!");
});
