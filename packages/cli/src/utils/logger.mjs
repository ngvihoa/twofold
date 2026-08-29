// packages/cli/src/utils/logger.mjs

export const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgCyan: "\x1b[46m",
  bgBlue: "\x1b[44m",
};

export const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✔${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}✖${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.cyan}=== ${msg} ===${colors.reset}\n`),
  badge: (label, text) => console.log(`${colors.bgCyan}${colors.black} ${label} ${colors.reset} ${text}`),
};

export function renderTable(headers, rows) {
  const colWidths = headers.map((h, i) => {
    const maxRowLen = rows.reduce((max, row) => Math.max(max, (row[i] || "").toString().length), 0);
    return Math.max(h.length, maxRowLen);
  });

  const separator = colWidths.map((w) => "─".repeat(w + 2)).join("┼");
  const topBorder = colWidths.map((w) => "─".repeat(w + 2)).join("┬");
  const botBorder = colWidths.map((w) => "─".repeat(w + 2)).join("┴");

  const formatRow = (cells, isHeader = false) =>
    cells
      .map((cell, i) => {
        const str = (cell || "").toString();
        const pad = " ".repeat(colWidths[i] - str.length);
        return isHeader
          ? ` ${colors.bold}${colors.cyan}${str}${colors.reset}${pad} `
          : ` ${str}${pad} `;
      })
      .join("│");

  console.log(`┌${topBorder}┐`);
  console.log(`│${formatRow(headers, true)}│`);
  console.log(`├${separator}┤`);
  for (const row of rows) {
    console.log(`│${formatRow(row)}│`);
  }
  console.log(`└${botBorder}┘`);
}

