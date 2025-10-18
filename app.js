require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const router = require("./routers");
const schedulerReportCustomerWeekly = require('./helpers/schedulerReportCustomerWeekly');

const app = express();
const port = process.env.PORT;

app.use(cors());
// enabling the Helmet middleware
app.use(helmet());
app.use(express.json({ limit: '10mb', }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        port: port,
        env: process.env.NODE_ENV || "development"
    });
});

app.use("/api", router);

// SCHEDULER REPORT SALES ORDER WITH EMAIL
schedulerReportCustomerWeekly.start();

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
