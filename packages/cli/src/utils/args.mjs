// packages/cli/src/utils/args.mjs

/**
 * Parse CLI arguments with standard format:
 * pnpm tf <feat> [--filter <project>] [-F <project>] [-f <project>] [-<shorten>]
 */
export function parseCliArgs(rawArgs = process.argv.slice(2)) {
  let feature = null;
  let filter = null;
  const positional = [];
  const flags = {};

  let i = 0;
  while (i < rawArgs.length) {
    const arg = rawArgs[i];

    if (!feature && !arg.startsWith("-")) {
      feature = arg;
      i++;
      continue;
    }

    if (arg === "--filter" || arg === "-F" || arg === "-f") {
      filter = rawArgs[i + 1] || null;
      i += 2;
      continue;
    }

    if (arg.startsWith("--filter=")) {
      filter = arg.split("=")[1];
      i++;
      continue;
    }

    if (arg.startsWith("-") && arg.length > 1 && !arg.startsWith("--")) {
      // Single dash argument like -sr, -gc, -web, etc.
      const flagVal = arg.slice(1);
      if (!["h", "v", "d", "a", "i"].includes(flagVal)) {
        filter = flagVal;
      } else {
        flags[flagVal] = true;
      }
      i++;
      continue;
    }

    if (arg.startsWith("--")) {
      const flagName = arg.slice(2);
      flags[flagName] = true;
      i++;
      continue;
    }

    positional.push(arg);
    i++;
  }

  // Fallback: If no explicit filter was passed with --filter/-F/-f/-<shorten>, but we have a positional argument
  // for commands like `dev` or `check` where positional specifies project target:
  if (
    !filter &&
    positional.length > 0 &&
    ["dev", "start", "check", "test", "build", "routes", "route", "routes:generate"].includes(feature)
  ) {
    filter = positional.shift();
  }

  return {
    feature,
    filter,
    positional,
    flags,
    raw: rawArgs,
  };
}
