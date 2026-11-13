import { mkdirSync, writeFileSync } from "node:fs";
import { solidPng } from "./png";

const PINK: [number, number, number] = [242, 140, 160];
mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", solidPng(192, PINK));
writeFileSync("public/icons/icon-512.png", solidPng(512, PINK));
writeFileSync("public/icons/apple-touch-icon.png", solidPng(180, PINK));
console.log("Đã tạo 3 icon trong public/icons");
