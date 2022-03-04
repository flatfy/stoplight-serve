import path from "path";
import Fastify from "fastify";
import fs from "fs-extra";
import SpecStore from "./spec-store.js";

const DIR = new URL(".", import.meta.url).pathname;
const STATIC_DIR = path.resolve(DIR, "static");

async function loadPage({ baseDir }) {
  return await fs.readFile(path.resolve(baseDir, "./index.html"));
}

async function start({
  filename,
  watch,
  logger = console,
  staticDir = STATIC_DIR,
}) {
  const spec = SpecStore(filename, { logger });
  await spec.bundle();

  const fastify = Fastify();

  fastify.addHook("onClose", function (fastify, done) {
    spec.close().finally(done);
  });

  fastify.get("/openapi.yaml", function (request, reply) {
    reply.type("text/yaml");
    return spec.yaml();
  });

  fastify.get("/openapi.json", function (request, reply) {
    reply.type("application/json");
    return spec.json();
  });

  fastify.get("/", async function (request, reply) {
    const page = await loadPage({ baseDir: staticDir });
    reply.type("text/html");
    return page;
  });

  fastify.get("*", function (request, reply) {
    reply.redirect(302, "/");
  });

  await fastify.listen(1111);
  logger.log("Server started on http://127.0.0.1:1111");

  if (watch) {
    spec.watch();
    logger.log("Watching for changes ...");
  }
}

export { start };
