import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const fontsDir = path.resolve('public/fonts');
fs.mkdirSync(fontsDir, { recursive: true });

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/css,*/*;q=0.1' } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow redirect
        fetchBuffer(res.headers.location).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function download(url, dest) {
  const buf = await fetchBuffer(url);
  await fs.promises.writeFile(dest, buf);
  console.log(`Downloaded ${url} -> ${dest} (${buf.length} bytes)`);
}

async function fetchCss(url) {
  const buf = await fetchBuffer(url);
  return buf.toString('utf8');
}

function extractWoff2Urls(css) {
  const urls = [];
  const re = /url\((https:\/\/[^)]+\.woff2)\)/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    urls.push(m[1]);
  }
  return Array.from(new Set(urls));
}

async function main() {
  const tasks = [
    {
      name: 'SpaceGrotesk[wght].woff2',
      cssUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap',
      prefer: /SpaceGrotesk-VariableFont_wght/i,
    },
    {
      name: 'InterTight-VariableFont[wght].woff2',
      cssUrl: 'https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,100..900;1,100..900&display=swap',
      prefer: /InterTight-VariableFont_opsz,wght|InterTight-VariableFont_wght/i,
    },
    {
      name: 'JetBrainsMono[wght].woff2',
      cssUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..800&display=swap',
      prefer: /JetBrainsMono-VariableFont_wght/i,
    },
    {
      name: 'Fraunces-VariableFont[wght,opsz].woff2',
      cssUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,400&display=swap',
      prefer: /Fraunces-VariableFont_SOFT,WONK,opsz,wght|Fraunces-VariableFont_opsz,wght/i,
      optional: true,
    },
  ];

  for (const t of tasks) {
    try {
      const css = await fetchCss(t.cssUrl);
      const urls = extractWoff2Urls(css);
      if (!urls.length) throw new Error('No woff2 URLs found');
      let chosen = urls[0];
      if (t.prefer) {
        const match = urls.find(u => t.prefer.test(u));
        if (match) chosen = match;
      }
      const dest = path.join(fontsDir, t.name);
      await download(chosen, dest);
    } catch (err) {
      if (t.optional) {
        console.warn(`Optional font ${t.name} skipped: ${err.message}`);
      } else {
        throw err;
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
