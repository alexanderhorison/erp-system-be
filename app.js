require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const router = require("./routers");
const app = express();
const port = process.env.PORT;

app.use(cors());
// enabling the Helmet middleware
app.use(helmet());
app.use(express.json({limit: '10mb',}));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use("/api", router);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
