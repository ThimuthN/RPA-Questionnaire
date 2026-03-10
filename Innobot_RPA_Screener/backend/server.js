"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 8787);
const DATA_DIR = path.join(__dirname, "data");
const TOKENS_FILE = path.join(DATA_DIR, "tokens.json");
const RESULTS_FILE = path.join(DATA_DIR, "results.json");
const REPORT_KEY = String(process.env.REPORT_KEY || "");

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(TOKENS_FILE)) fs.writeFileSync(TOKENS_FILE, "[]\n", "utf8");
  if (!fs.existsSync(RESULTS_FILE)) fs.writeFileSync(RESULTS_FILE, "[]\n", "utf8");
}

function readJson(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function send(res, code, payload) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function nowIso() {
  return new Date().toISOString();
}

function tokenExpired(tokenRow) {
  if (!tokenRow || !tokenRow.expiresAt) return false;
  const ts = Date.parse(tokenRow.expiresAt);
  if (Number.isNaN(ts)) return false;
  return ts < Date.now();
}

function tokenUsedCount(tokenRow) {
  const count = Number(tokenRow.usedAttempts || 0);
  if (Number.isFinite(count) && count >= 0) return Math.floor(count);
  return Array.isArray(tokenRow.consumptionLog) ? tokenRow.consumptionLog.length : 0;
}

function isRoleAllowed(tokenRow, roleId) {
  if (!Array.isArray(tokenRow.allowedRoles) || !tokenRow.allowedRoles.length) return true;
  return tokenRow.allowedRoles.includes(roleId);
}

function validateTokenRecord(tokenRow, roleId) {
  if (!tokenRow) return { ok: false, message: "Token not found." };
  if (tokenRow.active === false) return { ok: false, message: "Token is inactive." };
  if (tokenExpired(tokenRow)) return { ok: false, message: "Token has expired." };
  if (!isRoleAllowed(tokenRow, roleId)) return { ok: false, message: "Token is not valid for this role." };
  const maxAttempts = Math.max(1, Number(tokenRow.maxAttempts || 1));
  const used = tokenUsedCount(tokenRow);
  if (used >= maxAttempts) return { ok: false, message: "Token attempt limit reached." };
  return {
    ok: true,
    maxAttempts,
    used,
    remainingAttempts: Math.max(0, maxAttempts - used)
  };
}

function upsertResult(payload) {
  const rows = readJson(RESULTS_FILE, []);
  const result = Object.assign({}, payload, { serverReceivedAt: nowIso() });
  const idx = rows.findIndex((x) => x && x.attemptId && x.attemptId === payload.attemptId);
  if (idx >= 0) rows[idx] = result;
  else rows.push(result);
  writeJson(RESULTS_FILE, rows);
  return rows.length;
}

function ranked(rows) {
  return (Array.isArray(rows) ? rows.slice() : []).sort((a, b) => {
    const pa = Number((a && a.weightedTotals && a.weightedTotals.percent) || (a && a.totals && a.totals.percent) || 0);
    const pb = Number((b && b.weightedTotals && b.weightedTotals.percent) || (b && b.totals && b.totals.percent) || 0);
    if (pb !== pa) return pb - pa;
    const ta = Date.parse((a && a.timestampEnd) || 0);
    const tb = Date.parse((b && b.timestampEnd) || 0);
    return tb - ta;
  });
}

async function handleInvite(req, res) {
  const body = await readBody(req);
  const action = String(body.action || "").toLowerCase();
  const token = String(body.token || "").trim();
  const roleId = String(body.roleId || "").trim();
  if (!token) return send(res, 400, { ok: false, message: "Token is required." });

  const rows = readJson(TOKENS_FILE, []);
  const idx = rows.findIndex((x) => x && String(x.token || "") === token);
  const row = idx >= 0 ? rows[idx] : null;

  if (action === "validate") {
    const check = validateTokenRecord(row, roleId);
    if (!check.ok) return send(res, 400, { ok: false, message: check.message });
    return send(res, 200, {
      ok: true,
      token,
      expiresAt: row.expiresAt || null,
      maxAttempts: check.maxAttempts,
      usedAttempts: check.used,
      remainingAttempts: check.remainingAttempts,
      message: "Token validated."
    });
  }

  if (action === "consume") {
    const check = validateTokenRecord(row, roleId);
    if (!check.ok) return send(res, 400, { ok: false, message: check.message });
    row.usedAttempts = tokenUsedCount(row) + 1;
    if (!Array.isArray(row.consumptionLog)) row.consumptionLog = [];
    row.consumptionLog.push({
      at: nowIso(),
      attemptId: body.attemptId || null,
      roleId: roleId || null,
      candidateProfile: body.candidateProfile || null,
      percent: body.percent == null ? null : Number(body.percent),
      pass: body.pass == null ? null : !!body.pass
    });
    rows[idx] = row;
    writeJson(TOKENS_FILE, rows);
    return send(res, 200, { ok: true, message: "Token consumed.", usedAttempts: row.usedAttempts, maxAttempts: row.maxAttempts || 1 });
  }

  return send(res, 400, { ok: false, message: "Unsupported invite action." });
}

async function handleResults(req, res) {
  const body = await readBody(req);
  const attemptId = String(body.attemptId || "").trim();
  if (!attemptId) return send(res, 400, { ok: false, message: "attemptId is required." });
  const count = upsertResult(body);
  return send(res, 200, { ok: true, message: "Result stored.", totalResults: count });
}

function handleReport(req, res, parsedUrl) {
  if (REPORT_KEY) {
    const key = String(parsedUrl.searchParams.get("key") || "");
    if (key !== REPORT_KEY) return send(res, 401, { ok: false, message: "Unauthorized report request." });
  }
  const rows = ranked(readJson(RESULTS_FILE, []));
  return send(res, 200, { ok: true, count: rows.length, rows });
}

async function handler(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  if (req.method === "OPTIONS") return send(res, 204, { ok: true });
  if (req.method === "GET" && pathname === "/health") return send(res, 200, { ok: true, at: nowIso() });

  try {
    if (req.method === "POST" && pathname === "/api/invite") return await handleInvite(req, res);
    if (req.method === "POST" && pathname === "/api/results") return await handleResults(req, res);
    if (req.method === "GET" && pathname === "/api/reports") return handleReport(req, res, parsedUrl);
    return send(res, 404, { ok: false, message: "Endpoint not found." });
  } catch (err) {
    return send(res, 500, { ok: false, message: err && err.message ? err.message : "Server error." });
  }
}

ensureDataFiles();

http.createServer((req, res) => {
  void handler(req, res);
}).listen(PORT, () => {
  console.log(`[innobot-server] running on http://localhost:${PORT}`);
  console.log(`[innobot-server] tokens: ${TOKENS_FILE}`);
  console.log(`[innobot-server] results: ${RESULTS_FILE}`);
});