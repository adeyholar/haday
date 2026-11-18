#!/usr/bin/env node
/**
 * Rewrite public/tanakh/books/*.json `en` and `ylt` through the versemap.
 * Hebrew `he` and `words` stay as they are. WEB text is the pinned TehShrike
 * JSON named in versemap.json meta.web, keyed by English verse, never by the
 * Hebrew verse number.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createJiti } from "jiti";

const root = new URL("..", import.meta.url).pathname;
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { englishSlot, hebrewRefLabel } = await jiti.import(join(root, "src/lib/english-line.ts"));

const versemap = JSON.parse(readFileSync(join(root, "data/paradigms/versemap.json"), "utf8"));
const ylt = JSON.parse(readFileSync(join(root, "data/paradigms/ylt.json"), "utf8")).verses;
const booksDir = join(root, "public/tanakh/books");
const WEB_PIN = "68669ba3be9719ae4d1135b19d9e0b6587b7c356";
const WEB_BASE = `https://raw.githubusercontent.com/TehShrike/world-english-bible/${WEB_PIN}/json`;
const WEB_FILES = {
  Gen: "genesis",
  Exod: "exodus",
  Lev: "leviticus",
  Num: "numbers",
  Deut: "deuteronomy",
  Josh: "joshua",
  Judg: "judges",
  "1Sam": "1samuel",
  "2Sam": "2samuel",
  "1Kgs": "1kings",
  "2Kgs": "2kings",
  Isa: "isaiah",
  Jer: "jeremiah",
  Ezek: "ezekiel",
  Hos: "hosea",
  Joel: "joel",
  Amos: "amos",
  Obad: "obadiah",
  Jonah: "jonah",
  Mic: "micah",
  Nah: "nahum",
  Hab: "habakkuk",
  Zeph: "zephaniah",
  Hag: "haggai",
  Zech: "zechariah",
  Mal: "malachi",
  Ps: "psalms",
  Prov: "proverbs",
  Job: "job",
  Song: "songofsolomon",
  Ruth: "ruth",
  Lam: "lamentations",
  Eccl: "ecclesiastes",
  Esth: "esther",
  Dan: "daniel",
  Ezra: "ezra",
  Neh: "nehemiah",
  "1Chr": "1chronicles",
  "2Chr": "2chronicles",
};

function squash(text) {
  return text.replace(/\s+/g, " ").trim();
}

async function webCorpus() {
  const web = {};
  for (const [book, file] of Object.entries(WEB_FILES)) {
    const res = await fetch(`${WEB_BASE}/${file}.json`);
    if (!res.ok) throw new Error(`WEB ${file} ${res.status}`);
    const blob = await res.json();
    const parts = new Map();
    for (const item of blob) {
      if (!item || typeof item.value !== "string" || typeof item.chapterNumber !== "number" || typeof item.verseNumber !== "number") continue;
      const key = `${book}.${item.chapterNumber}.${item.verseNumber}`;
      const list = parts.get(key) ?? [];
      list.push(item.value);
      parts.set(key, list);
    }
    for (const [key, list] of parts) web[key] = squash(list.join(" "));
    process.stdout.write(` ${book}`);
  }
  console.log("");
  return web;
}

const web = await webCorpus();
const books = [];
for (const name of readdirSync(booksDir)) {
  if (!name.endsWith(".json")) continue;
  books.push({ name, book: JSON.parse(readFileSync(join(booksDir, name), "utf8")) });
}

const share = new Map();
for (const [key, entry] of Object.entries(versemap.verses)) {
  for (const target of [...(entry.ylt ?? []), ...(entry.web ?? [])]) {
    if (!target.part) continue;
    const list = share.get(target.ref) ?? [];
    list.push({ key, part: target.part });
    share.set(target.ref, list);
  }
}

function alsoFor(hebrewKey, englishRef, part) {
  const list = share.get(englishRef) ?? [];
  return list.filter((item) => item.key !== hebrewKey && item.part !== part).map((item) => hebrewRefLabel(item.key));
}

let written = 0;
for (const { name, book } of books) {
  for (const [ch, rows] of Object.entries(book.chapters)) {
    for (const row of rows) {
      const key = `${book.id}.${ch}.${row.v}`;
      const entry = versemap.verses[key];
      const covers = (englishRef, part) => alsoFor(key, englishRef, part);
      row.ylt = englishSlot("ylt", entry, ylt, covers);
      row.en = englishSlot("web", entry, web, covers);
      written += 1;
    }
  }
  writeFileSync(join(booksDir, name), JSON.stringify(book));
}
console.log("rewrote", written, "verses in", books.length, "books");
console.log("web keys", Object.keys(web).length);
