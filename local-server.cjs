const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 8001);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function serveDirectoryListing(directory, url, response) {
  fs.readdir(directory, { withFileTypes: true }, (error, entries) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const panelOnly = url.searchParams.get("filter") === "secret-panel";
    const files = entries
      .filter(entry => entry.isFile())
      .map(entry => entry.name)
      .filter(name => !panelOnly || /secret-panel|crawlspace/i.test(name))
      .sort((left, right) => left.localeCompare(right));
    const cards = files.map(name => {
      const href = encodeURIComponent(name);
      return `<a class="asset" href="${href}" target="_blank" rel="noopener"><img src="${href}" alt="" loading="lazy"><span>${escapeHtml(name)}</span></a>`;
    }).join("");
    const title = panelOnly ? "Secret Panel Animation Assets" : "Room 4 · Alien Washroom Assets";
    const switchLink = panelOnly
      ? `<a class="switch" href="./">Show all Room 4 assets</a>`
      : `<a class="switch" href="?filter=secret-panel">Show only panel animation assets</a>`;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;padding:24px;background:#08101c;color:#f7edcf;font:15px system-ui,sans-serif}header{position:sticky;top:0;z-index:2;margin:-24px -24px 20px;padding:18px 24px;background:rgba(8,16,28,.96);border-bottom:1px solid #31546a}h1{margin:0 0 8px;color:#75f5ee;font-size:1.35rem}.switch{color:#ffd365}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}.asset{display:grid;grid-template-rows:180px auto;gap:8px;padding:10px;border:1px solid #31546a;border-radius:10px;background:#111d2b;color:#f7edcf;text-decoration:none}.asset:hover{border-color:#75f5ee}.asset img{width:100%;height:180px;object-fit:contain;background:#050a11;border-radius:6px;image-rendering:auto}.asset span{overflow-wrap:anywhere;font-size:.78rem}</style></head><body><header><h1>${title}</h1><div>${files.length} files · Click an image to open the original. ${switchLink}</div></header><main class="grid">${cards}</main></body></html>`;
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(html);
  });
}

http
  .createServer((request, response) => {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = path.resolve(root, `.${decodeURIComponent(pathname)}`);

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.stat(filePath, (statError, stats) => {
      if (!statError && stats.isDirectory()) {
        serveDirectoryListing(filePath, url, response);
        return;
      }
      fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      });
      response.end(data);
      });
    });
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`DriftMiner running at http://127.0.0.1:${port}`);
  });
