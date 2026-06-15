import JSZip from 'jszip';

// Instagramエクスポートの「latin1で読まれたUTF-8」文字化けを補正
function fixEncoding(s) {
  if (typeof s !== 'string' || !/[-ÿ]/.test(s)) return s;
  try { return new TextDecoder('utf-8').decode(Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff)); }
  catch { return s; }
}

export async function parseInstagramExport(file, onProgress) {
  const zip = await JSZip.loadAsync(file);
  const names = Object.keys(zip.files);
  const postFiles = names.filter((n) => /posts_\d+\.json$/i.test(n) || /(^|\/)posts\.json$/i.test(n));

  const items = [];
  for (const name of postFiles) {
    let json;
    try { json = JSON.parse(await zip.files[name].async('string')); } catch { continue; }
    const arr = Array.isArray(json) ? json : (json.posts || json.media || []);
    for (const it of arr) items.push(it);
  }

  const posts = [];
  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    const mediaArr = Array.isArray(it.media) ? it.media : (it.uri ? [it] : []);
    const media = [];
    for (const m of mediaArr) {
      const uri = m && m.uri;
      if (!uri) continue;
      const entry = zip.file(uri) || zip.file(decodeURIComponent(uri));
      if (!entry) continue;
      const blob = await entry.async('blob');
      const kind = /\.(mp4|mov|webm)$/i.test(uri) ? 'video' : 'image';
      media.push({ kind, blob });
    }
    if (media.length === 0) continue;
    const ts = it.creation_timestamp || (mediaArr[0] && mediaArr[0].creation_timestamp) || 0;
    const title = it.title || (mediaArr[0] && mediaArr[0].title) || '';
    posts.push({
      id: `import-${ts}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'feed', media, caption: fixEncoding(title),
      likes: 0, createdAt: ts ? ts * 1000 : Date.now(),
    });
    if (onProgress) onProgress(idx + 1, items.length);
  }
  posts.sort((a, b) => b.createdAt - a.createdAt);
  return posts;
}
