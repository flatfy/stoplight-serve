#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { start } from "../server.js";

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection", error);
  process.exit(1);
});

const argv = yargs(hideBin(process.argv))
  .scriptName("stoplight-serve")
  .command(
    "$0 <filename>",
    "serve api docs by open api spec",
    function (yargs) {
      return yargs.option("watch", { type: "boolean", alias: "w" });
    }
  )
  .help().argv;

start(argv);
