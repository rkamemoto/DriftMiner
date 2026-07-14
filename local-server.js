const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = 8765;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, "");
    const requested = path.resolve(root, safePath || "index.html");

    if (!requested.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(requested, (error, data) => {
      if (error) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      res.writeHead(200, {
        "Content-Type": types[path.extname(requested).toLowerCase()] || "application/octet-stream",
      });
      res.end(data);
    });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.log(`Drift Miner may already be running at http://127.0.0.1:${port}/index.html`);
    return;
  }
  console.error(error.message);
});

server.listen(port, "127.0.0.1", () => {
    console.log(`Drift Miner running at http://127.0.0.1:${port}/index.html`);
    console.log("Keep this window open while playing.");
  });
