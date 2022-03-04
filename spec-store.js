import path from "path";
import chokidar from "chokidar";
import {
  Config,
  bundle as bundleOpenApi,
  stringifyYaml,
} from "@redocly/openapi-core";

function SpecStore(filename, { logger }) {
  let _bundle;
  let _watcher;

  function yaml() {
    return stringifyYaml(_bundle.bundle.parsed, {
      noRefs: false,
    });
  }

  function json() {
    try {
      return JSON.stringify(_bundle.bundle.parsed, null, 2);
    } catch (e) {
      if (e.message.indexOf("circular") > -1) {
        throw new CircularJSONNotSupportedError(e);
      }
      throw e;
    }
  }

  async function bundle() {
    logger.log("Bundling...");
    const config = new Config({});
    _bundle = await bundleOpenApi({ ref: filename, config, dereference: true });

    if (_watcher) {
      updateWatcherDependencies();
    }
    logger.log("Done.");
  }

  function watch() {
    _watcher = chokidar.watch(filename);
    _watcher.on("change", function () {
      bundle();
    });
    updateWatcherDependencies();
  }

  function updateWatcherDependencies() {
    const dependencies = new Set(_bundle.fileDependencies);
    const shouldUnwatch = new Set();
    const shouldWatch = new Set(dependencies);
    const watchedFileList = Object.entries(_watcher.getWatched()).flatMap(
      ([dir, files]) => files.map((file) => path.join(dir, file))
    );

    watchedFileList.forEach(function (watchedFilename) {
      if (!dependencies.has(watchedFilename)) {
        shouldUnwatch.add(watchedFilename);
      } else {
        shouldWatch.delete(watchedFilename);
      }
    });

    _watcher.unwatch(Array.from(shouldUnwatch.values()));
    _watcher.add(Array.from(shouldWatch.values()));
  }

  async function close() {
    if (!_watcher) {
      return;
    }
    await _watcher.close();
  }

  return {
    yaml,
    json,
    bundle,
    watch,
    close,
  };
}

export default SpecStore;
