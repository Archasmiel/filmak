/**
 * Error log analyzer.
 * Usage:
 *   node scripts/analyzeErrors.js            (defaults to 'today')
 *   node scripts/analyzeErrors.js today
 *   node scripts/analyzeErrors.js week       (last 7 days including today)
 *   node scripts/analyzeErrors.js month      (last 30 days including today)
 *
 * Output: JSON summary to stdout.
 *
 * Log line assumption:
 *   Starts with: YYYY-MM-DD HH:mm:ss LEVEL ...
 *   Error lines contain: "ERROR"
 */
import fs from 'fs';
import path from 'path';

const PERIOD = (process.argv[2] || 'today').toLowerCase();
const VALID = new Set(['today', 'week', 'month']);
if (!VALID.has(PERIOD)) {
  console.error(`Invalid period "${PERIOD}". Use: today | week | month`);
  process.exit(1);
}

const logFile = path.join(process.cwd(), 'logs', 'error.log');
if (!fs.existsSync(logFile)) {
  console.error('No error.log found.');
  process.exit(1);
}

const raw = fs.readFileSync(logFile, 'utf8');
const allLines = raw.split('\n').filter(l => l.trim().length);

function extractDate(line) {
  return line.slice(0, 10);
}

const todayISO = new Date().toISOString().slice(0, 10);

function computeRange(period) {
  const end = new Date(todayISO);
  let days;
  if (period === 'today') days = 1;
  else if (period === 'week') days = 7;
  else days = 30; // month
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
}

const { start, end } = computeRange(PERIOD);

// Date comparison helper (string form works lexicographically for ISO date)
function inRange(dateStr) {
  return dateStr >= start && dateStr <= end;
}

const errorLines = allLines.filter(l => {
  if (!l.includes('ERROR')) return false;
  const d = extractDate(l);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && inRange(d);
});

if (!errorLines.length) {
  console.log(JSON.stringify({
    period: PERIOD,
    start,
    end,
    total: 0,
    message: 'No errors'
  }, null, 2));
  process.exit(0);
}

function deriveSignature(line) {
  const afterLevel = line.replace(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+ERROR\s+/, '');
  const withoutStack = afterLevel.split(' stack=')[0];
  return withoutStack
    .replace(/\b[0-9a-f]{24}\b/g, '<oid>')
    .replace(/\b[0-9a-f-]{36}\b/g, '<uuid>')
    .replace(/\b\d{10,}\b/g, '<num>');
}

// Aggregations
const bySignature = {};
const byDay = {};

for (const line of errorLines) {
  const day = extractDate(line);
  const sig = deriveSignature(line);
  bySignature[sig] = (bySignature[sig] || 0) + 1;
  if (!byDay[day]) byDay[day] = { total: 0, signatures: {} };
  byDay[day].total += 1;
  byDay[day].signatures[sig] = (byDay[day].signatures[sig] || 0) + 1;
}

const summary = {
  period: PERIOD,
  start,
  end,
  total: errorLines.length,
  days: Object.keys(byDay).sort(),
  first: errorLines[0],
  last: errorLines[errorLines.length - 1],
  bySignature: Object.fromEntries(
    Object.entries(bySignature)
      .sort((a, b) => b[1] - a[1]) // descending count
  ),
  byDay
};

console.log(JSON.stringify(summary, null, 2));