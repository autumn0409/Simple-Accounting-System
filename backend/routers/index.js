const categoryRouter = require("./category");
// const chartRouter = require("./router/chart");
// const recordRouter = require("./router/record");

module.exports = (app) => {
  app.use("/api/category", categoryRouter);
  // app.use("/api/chart", chartRouter);
  // app.use("/api/record", recordRouter);
};