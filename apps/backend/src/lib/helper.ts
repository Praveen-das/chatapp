import { Types } from "mongoose";
import fs from "fs";
import path from "path";

export function toString(value: string | Types.ObjectId) {
  return typeof value === "object" ? value.toHexString() : value;
}

export function findRootDir(): string {
  let currentDir = __dirname;
  while (true) {
    if (fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml"))) {
      return currentDir;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return process.cwd();
    }
    currentDir = parentDir;
  }
}

export function writeJsonToDebug(filename: string, data: any) {
  try {
    const rootDir = findRootDir();
    const debugDir = path.join(rootDir, "debug");
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    const filePath = path.join(debugDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`[Utility] Successfully wrote JSON data to: ${filePath}`);
  } catch (error) {
    console.error(`[Utility] Failed to write ${filename} to debug directory:`, error);
  }
}