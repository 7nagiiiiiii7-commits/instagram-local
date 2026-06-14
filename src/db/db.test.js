import 'fake-indexeddb/auto';
import { beforeEach, describe, it, expect } from 'vitest';
import { getProfile, saveProfile, addPost, getPosts, deletePost, clearAll } from './db.js';

beforeEach(async () => {
  await clearAll();
});

describe('profile', () => {
  it('未保存ならデフォルトプロフィールを返す', async () => {
    const p = await getProfile();
    expect(p.username).toBe('your_username');
    expect(p.avatarBlob).toBeNull();
  });

  it('保存した内容が永続化される', async () => {
    await saveProfile({ username: 'nagi', displayName: 'Nagi', avatarBlob: null, bio: 'hi' });
    const p = await getProfile();
    expect(p.username).toBe('nagi');
    expect(p.bio).toBe('hi');
  });
});

describe('posts', () => {
  it('投稿を追加して一覧で取得できる', async () => {
    await addPost({ id: '1', type: 'feed', media: [], caption: 'a', likes: 0, createdAt: 100 });
    const posts = await getPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0].caption).toBe('a');
  });

  it('新しい順で並ぶ', async () => {
    await addPost({ id: 'old', type: 'feed', media: [], caption: '', likes: 0, createdAt: 100 });
    await addPost({ id: 'new', type: 'feed', media: [], caption: '', likes: 0, createdAt: 200 });
    const posts = await getPosts();
    expect(posts[0].id).toBe('new');
  });

  it('投稿を削除できる', async () => {
    await addPost({ id: 'x', type: 'feed', media: [], caption: '', likes: 0, createdAt: 1 });
    await deletePost('x');
    const posts = await getPosts();
    expect(posts).toHaveLength(0);
  });
});
