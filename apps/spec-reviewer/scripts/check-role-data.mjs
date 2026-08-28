import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");

const dataPath = path.resolve(appRoot, "data/roles.json");
const roles = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const ids = new Set(roles.map((role) => role.id));
const factions = new Set(roles.map((role) => role.factionId));
const required = ["id", "code", "name", "pageTitle", "factionId", "description", "mechanics", "fit", "fitLabel", "stage", "stageLabel", "revealAfter", "daySkill", "nightSkill"];
const invalid = roles.filter((role) => required.some((key) => role[key] === undefined || role[key] === ""));
const missingArtwork = roles.filter((role) => role.image && !fs.existsSync(path.resolve(appRoot, role.image)));

if (roles.length !== 92) throw new Error(`Expected 92 roles, got ${roles.length}`);
if (ids.size !== roles.length) throw new Error("Role ids are not unique");
if (factions.size !== 5) throw new Error(`Expected 5 factions, got ${factions.size}`);
if (invalid.length) throw new Error(`Invalid roles: ${invalid.map((role) => role.name).join(", ")}`);
if (missingArtwork.length) throw new Error(`Missing artwork: ${missingArtwork.map((role) => role.name).join(", ")}`);
if (roles.filter((role) => role.fit === "core").length !== 6) throw new Error("Expected 6 roles in the first recommendation set");

console.log(`OK: ${roles.length} roles, ${factions.size} factions, ${roles.filter((role) => role.image).length} images`);
