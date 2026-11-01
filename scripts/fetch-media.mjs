// The film's media is too big for git: each scene's frames and videos are a
// tar on Danielor's media host (scripts/media.json), fetched at build time
// into public/film/<scene>/v1. A scene already there (local work) is skipped.
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";

const list = JSON.parse(readFileSync(new URL("./media.json", import.meta.url), "utf8"));
const root = new URL("../public/film/", import.meta.url).pathname;
mkdirSync(root, { recursive: true });
const here = new URL("../", import.meta.url).pathname;
for (const m of list) {
  if (m.file) {
    // a single file (the share card): fetched as is
    if (!existsSync(here + m.file)) {
      const res = await fetch(m.url);
      if (!res.ok) throw new Error(`could not fetch ${m.file}: HTTP ${res.status}`);
      writeFileSync(here + m.file, Buffer.from(await res.arrayBuffer()));
    }
    console.log(`media ${m.file}: ok`);
    continue;
  }
  if (existsSync(`${root}${m.name}/v1/meta.json`)) {
    console.log(`media ${m.name}: already here`);
    continue;
  }
  const tmp = `/tmp/film-${m.name}.tar`;
  let ok = false;
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    const res = await fetch(m.url);
    if (!res.ok) {
      console.log(`media ${m.name}: HTTP ${res.status} (attempt ${attempt})`);
      continue;
    }
    writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
    ok = true;
  }
  if (!ok) throw new Error(`could not fetch the media for ${m.name}`);
  execFileSync("tar", ["-xf", tmp, "-C", root]);
  rmSync(tmp);
  if (!existsSync(`${root}${m.name}/v1/meta.json`)) throw new Error(`media ${m.name}: the tar has no ${m.name}/v1/meta.json`);
  console.log(`media ${m.name}: ok`);
}
