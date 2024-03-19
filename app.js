const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const router = require("./routers");
const app = express();
const port = process.env.PORT || 4001;

app.use(cors());
// enabling the Helmet middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", router);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
