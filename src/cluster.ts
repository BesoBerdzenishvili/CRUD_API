import * as os from "os";
import dotenv from "dotenv";
import * as http from "http";
import { database } from "./db/db";
import { createServer } from "./server";
import cluster, { Worker } from "cluster";
import { Status } from "./types/statusCodes";

dotenv.config();

const PORT = parseInt(process.env.PORT || "4000", 10);
const numWorkers = os.availableParallelism() - 1;

if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} is running`);
  console.log(`Starting ${numWorkers} workers...`);

  const workers: Worker[] = [];
  let currentWorkerIndex = 0;

  for (let i = 0; i < numWorkers; i++) {
    const worker = cluster.fork({ WORKER_PORT: String(PORT + i + 1) });
    workers.push(worker);
    console.log(`Worker ${worker.process.pid} started on port ${PORT + i + 1}`);
  }

  cluster.on("message", (worker, message) => {
    if (message.type === "STATE_UPDATE") {
      for (const w of workers) {
        if (w.id !== worker.id) {
          w.send({ type: "SYNC_STATE", state: message.state });
        }
      }
    }
  });

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    const index = workers.findIndex((w) => w.id === worker.id);
    if (index !== -1) {
      workers.splice(index, 1);
    }

    const newWorker = cluster.fork({ WORKER_PORT: String(PORT + index + 1) });
    workers.push(newWorker);
  });

  const loadBalancer = http.createServer((req, res) => {
    const worker = workers[currentWorkerIndex];
    currentWorkerIndex = (currentWorkerIndex + 1) % workers.length;

    const workerPort = PORT + workers.indexOf(worker) + 1;

    const options = {
      hostname: "localhost",
      port: workerPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(
        proxyRes.statusCode || Status.INTERNAL_SERVER_ERROR,
        proxyRes.headers
      );
      proxyRes.pipe(res);
    });

    proxyReq.on("error", (error) => {
      console.error("Proxy error:", error);
      res.writeHead(Status.INTERNAL_SERVER_ERROR, {
        "Content-Type": "application/json",
      });
      res.end(JSON.stringify({ message: "Load balancer error" }));
    });

    req.pipe(proxyReq);
  });

  loadBalancer.listen(PORT, () => {
    console.log(`Load balancer is running on port ${PORT}`);
  });
} else {
  const workerPort = parseInt(process.env.WORKER_PORT || String(PORT), 10);
  const server = createServer();

  process.on("message", (message: any) => {
    if (message.type === "SYNC_STATE") {
      database.setState(message.state);
    }
  });

  const originalCreate = database.createUser.bind(database);
  const originalUpdate = database.updateUser.bind(database);
  const originalDelete = database.deleteUser.bind(database);

  database.createUser = async (...args) => {
    const result = await originalCreate(...args);
    if (process.send) {
      process.send({ type: "STATE_UPDATE", state: database.getState() });
    }
    return result;
  };

  database.updateUser = async (...args) => {
    const result = await originalUpdate(...args);
    if (process.send && result) {
      process.send({ type: "STATE_UPDATE", state: database.getState() });
    }
    return result;
  };

  database.deleteUser = async (...args) => {
    const result = await originalDelete(...args);
    if (process.send && result) {
      process.send({ type: "STATE_UPDATE", state: database.getState() });
    }
    return result;
  };

  server.listen(workerPort, () => {
    console.log(`Worker ${process.pid} is running on port ${workerPort}`);
  });
}
