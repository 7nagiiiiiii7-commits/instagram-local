import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as db from '../db/db.js';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [ready, setReady] = useState(false);

  // ナビゲーション状態
  const [tab, setTab] = useState('home'); // 'home' | 'search' | 'create' | 'reels' | 'profile'
  const [overlay, setOverlay] = useState(null);
  // overlay: null | { kind:'story', startId } | { kind:'composer' }
  //        | { kind:'postDetail', id } | { kind:'editProfile' }

  useEffect(() => {
    (async () => {
      setProfile(await db.getProfile());
      setPosts(await db.getPosts());
      setReady(true);
    })();
  }, []);

  const addPost = useCallback(async (post) => {
    await db.addPost(post);
    setPosts(await db.getPosts());
  }, []);

  const removePost = useCallback(async (id) => {
    await db.deletePost(id);
    setPosts(await db.getPosts());
  }, []);

  const updateProfile = useCallback(async (next) => {
    await db.saveProfile(next);
    setProfile(next);
  }, []);

  const value = {
    profile, posts, ready,
    tab, setTab,
    overlay, setOverlay,
    addPost, removePost, updateProfile,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
