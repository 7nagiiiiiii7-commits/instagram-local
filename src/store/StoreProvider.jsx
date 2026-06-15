import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as db from '../db/db.js';
import { buildSeed } from '../data/seed.js';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [ready, setReady] = useState(false);
  const [seed, setSeed] = useState(null);
  const [demoMode, setDemoModeState] = useState(() => localStorage.getItem('demoMode') !== 'off');

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
      buildSeed().then(setSeed);
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

  const setDemoMode = useCallback((on) => {
    localStorage.setItem('demoMode', on ? 'on' : 'off');
    setDemoModeState(on);
  }, []);

  const importPosts = useCallback(async (list) => {
    await db.addPosts(list);
    setPosts(await db.getPosts());
  }, []);

  const value = {
    profile, posts, ready,
    tab, setTab,
    overlay, setOverlay,
    addPost, removePost, updateProfile,
    seed, demoMode, setDemoMode, importPosts,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
