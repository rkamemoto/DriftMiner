const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = 8080;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".xlsx": "application/octet-stream",
};

http
  .createServer((request, response) => {
    const url = new URL(request.url, `http://localhost:${port}`);
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = path.resolve(root, `.${decodeURIComponent(pathname)}`);
    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      response.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
      response.end(data);
    });
  })
  .listen(port, "0.0.0.0", () => {
    console.log(`LAN-accessible DriftMiner server running at http://0.0.0.0:${port}`);
  });
