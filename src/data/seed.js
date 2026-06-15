import { gradientBlob } from './gradient.js';

const USERS = [
  { username: 'tokyo_walks', name: 'Tokyo Walks' },
  { username: 'minimal.daily', name: 'Minimal Daily' },
  { username: 'aoi.films', name: 'Aoi' },
  { username: 'coffee.notes', name: 'Coffee Notes' },
  { username: 'sora.design', name: 'Sora' },
  { username: 'naoki.eats', name: 'Naoki' },
  { username: 'haru.trip', name: 'Haru' },
  { username: 'studio.kumo', name: 'Studio Kumo' },
];
// 汎用のオリジナル短文（実在キャプションの引用ではない）
const CAPTIONS = [
  '今日の散歩', 'light and shadow', 'おすすめのカフェ', 'weekend',
  '作業の合間に', 'new work', 'おはよう', 'film day', 'best of the week', 'golden hour',
];

let cache = null;

export async function buildSeed() {
  if (cache) return cache;
  const users = [];
  for (let i = 0; i < USERS.length; i++) {
    users.push({ ...USERS[i], avatarBlob: await gradientBlob((i + 1) * 11, 150, 150) });
  }
  const now = Date.now();

  const feed = [];
  for (let i = 0; i < 8; i++) {
    const u = users[i % users.length];
    const count = i % 3 === 0 ? 3 : 1;
    const media = [];
    for (let j = 0; j < count; j++) media.push({ kind: 'image', blob: await gradientBlob(100 + i * 7 + j) });
    feed.push({
      id: `seed-feed-${i}`, type: 'feed',
      author: { username: u.username, avatarBlob: u.avatarBlob },
      media, caption: CAPTIONS[i % CAPTIONS.length],
      likes: 30 + (i * 137) % 4000, createdAt: now - i * 5 * 3600_000,
    });
  }

  const stories = [];
  for (let i = 0; i < 5; i++) {
    const u = users[i];
    stories.push({
      id: `seed-story-${i}`, type: 'story',
      author: { username: u.username, avatarBlob: u.avatarBlob },
      media: [{ kind: 'image', blob: await gradientBlob(300 + i, 540, 960) }],
      caption: '', createdAt: now - i * 1800_000,
    });
  }

  const reels = [];
  for (let i = 0; i < 6; i++) {
    const u = users[(i + 2) % users.length];
    reels.push({
      id: `seed-reel-${i}`,
      author: { username: u.username, avatarBlob: u.avatarBlob },
      blob: await gradientBlob(700 + i * 9, 540, 960),
      caption: CAPTIONS[(i + 3) % CAPTIONS.length],
      likes: 1000 + (i * 911) % 90000, comments: 10 + (i * 51) % 800,
      audio: `original audio · ${u.username}`,
    });
  }

  const explore = [];
  for (let i = 0; i < 18; i++) explore.push({ id: `seed-ex-${i}`, blob: await gradientBlob(900 + i * 3, 400, 400) });

  cache = { users, feed, stories, reels, explore };
  return cache;
}
