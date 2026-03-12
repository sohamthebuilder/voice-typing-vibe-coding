const http = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const preferredPort = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port: preferredPort });
const handle = app.getRequestHandler();

const SARVAM_WS_PATH = "/api/sarvam-ws";
const SARVAM_ORIGIN = "wss://api.sarvam.ai";

function tryListen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      if (err.code === "EADDRINUSE" && port < 3010) {
        server.removeListener("error", onError);
        tryListen(server, port + 1).then(resolve).catch(reject);
      } else {
        server.removeListener("error", onError);
        reject(err);
      }
    };
    server.once("error", onError);
    server.listen(port, () => {
      server.removeListener("error", onError);
      resolve(port);
    });
  });
}

app.prepare().then(() => {
  const nextUpgradeHandler = app.getUpgradeHandler();
  const server = http.createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = parse(request.url, true);
    if (pathname === SARVAM_WS_PATH) {
      wss.handleUpgrade(request, socket, head, (clientWs) => {
        wss.emit("connection", clientWs, request);
      });
    } else {
      nextUpgradeHandler(request, socket, head);
    }
  });

  wss.on("connection", (clientWs, request) => {
    const idx = request.url?.indexOf("?");
    const queryStr = idx != null && idx >= 0 ? request.url.slice(idx + 1) : "";
    let sarvamWs = null;
    let authDone = false;

    clientWs.on("message", (data) => {
      if (!authDone) {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.apiKey && typeof msg.apiKey === "string") {
            authDone = true;
            const sarvamUrl = `${SARVAM_ORIGIN}/speech-to-text/ws?${queryStr}`;
            sarvamWs = new (require("ws"))(sarvamUrl, {
              headers: { "Api-Subscription-Key": msg.apiKey },
            });
            sarvamWs.on("open", () => {
              clientWs.send(JSON.stringify({ type: "proxy_ready" }));
            });
            sarvamWs.on("message", (d) => {
              const text = typeof d === 'string' ? d : d.toString();
              clientWs.send(text);
            });
            sarvamWs.on("close", () => {
              try {
                clientWs.close();
              } catch (_) {}
            });
            sarvamWs.on("error", () => {
              try {
                clientWs.close();
              } catch (_) {}
            });
          }
        } catch (_) {
          clientWs.close();
        }
        return;
      }
      const text = typeof data === 'string' ? data : data.toString();
      if (sarvamWs && sarvamWs.readyState === 1) {
        sarvamWs.send(text);
      }
    });

    clientWs.on("close", () => {
      if (sarvamWs) sarvamWs.close();
    });
    clientWs.on("error", () => {
      if (sarvamWs) sarvamWs.close();
    });
  });

  tryListen(server, preferredPort).then((port) => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
