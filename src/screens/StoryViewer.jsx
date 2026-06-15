import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store/StoreProvider.jsx';
import { useObjectURL } from '../hooks/useObjectURL.js';
import MediaItem from '../components/MediaItem.jsx';
import { CloseIcon, HeartIcon, ShareIcon } from '../components/icons.jsx';

const IMAGE_MS = 5000;

export default function StoryViewer() {
  const { posts, profile, seed, demoMode, overlay, setOverlay } = useStore();
  const ringKey = overlay.ringKey;

  // ringKey に対応する投稿者のストーリー列と、表示用の作者情報
  const { items, author } = useMemo(() => {
    if (ringKey === '__me__') {
      return {
        items: posts.filter((p) => p.type === 'story'),
        author: { username: profile?.username, avatarBlob: profile?.avatarBlob },
      };
    }
    const demo = (demoMode && seed) ? seed.stories : [];
    const list = demo.filter((s) => s.author.username === ringKey);
    return { items: list, author: list[0]?.author || { username: ringKey } };
  }, [ringKey, posts, seed, demoMode, profile]);

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const avatarUrl = useObjectURL(author?.avatarBlob);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const current = items[index];

  const next = () => {
    if (index < items.length - 1) { setIndex((i) => i + 1); setProgress(0); }
    else setOverlay(null);
  };
  const prev = () => { if (index > 0) { setIndex((i) => i - 1); setProgress(0); } };

  useEffect(() => { if (!current) setOverlay(null); /* eslint-disable-next-line */ }, [current]);

  useEffect(() => {
    if (!current || current.media[0]?.kind === 'video') return;
    startRef.current = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - startRef.current) / IMAGE_MS);
      setProgress(p);
      if (p >= 1) next(); else rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, current]);

  if (!current) return null;
  const isVideo = current.media[0]?.kind === 'video';

  return (
    <div className="story-viewer">
      <div className="story-bars">
        {items.map((_, i) => (
          <span key={i} className="story-bar">
            <span className="story-bar-fill" style={{ width: i < index ? '100%' : i === index ? `${progress * 100}%` : '0%' }} />
          </span>
        ))}
      </div>
      <div className="story-top">
        <span className="avatar sm">{avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="avatar-fallback" />}</span>
        <span className="story-user">{author?.username}</span>
        <button className="story-close" onClick={() => setOverlay(null)}><CloseIcon /></button>
      </div>
      <MediaItem key={current.id} media={current.media[0]} className="story-media"
        videoProps={isVideo ? { onEnded: next, loop: false } : {}} />
      <button className="story-tap left" onClick={prev} aria-label="前へ" />
      <button className="story-tap right" onClick={next} aria-label="次へ" />
      <div className="story-bottom">
        <input className="story-reply" placeholder="メッセージを送信" readOnly />
        <button><HeartIcon /></button>
        <button><ShareIcon /></button>
      </div>
    </div>
  );
}
