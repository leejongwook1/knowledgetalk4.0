const http = require("http");
const express = require("express");
const app = require("express")();
const path = require("path");
// const host = "127.0.0.1";
const port = 5500;
// const agent = new http.Agent({
//   keepAlive: true, //요청이 없는 경우에도 소켓유지
//   timeout: 60000,
// });

app.set("views", path.join(__dirname, "/"));
app.set("view engine", "html");

app.use(express.static("public"));

http.createServer(app).listen(port, host, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
