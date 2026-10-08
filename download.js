import fs from 'fs';
import https from 'https';
import path from 'path';

const urls = [
  { id: 'N66NCRJYuco', url: 'https://unsplash.com/photos/N66NCRJYuco/download?force=true' },
  { id: 'PqIYDDnzg3Q', url: 'https://unsplash.com/photos/PqIYDDnzg3Q/download?force=true' }
];

const dir = path.join(process.cwd(), 'public', 'images');

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
      }
    };
    https.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        if (loc.startsWith('/')) loc = 'https://unsplash.com' + loc;
        return download(loc, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Status: ${res.statusCode} for ${url}`));
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function run() {
  for (const item of urls) {
    try {
      console.log(`Downloading ${item.id}...`);
      await download(item.url, path.join(dir, `${item.id}.jpg`));
      console.log(`Success: ${item.id}`);
    } catch (e) {
      console.error(`Failed ${item.id}:`, e.message);
    }
  }
}
run();
