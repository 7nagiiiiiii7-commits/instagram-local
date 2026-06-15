import { useState } from 'react';
import { useStore } from '../store/StoreProvider.jsx';
import { useObjectURL } from '../hooks/useObjectURL.js';
import Carousel from './Carousel.jsx';
import { HeartIcon, CommentIcon, ShareIcon, BookmarkIcon, MoreIcon } from './icons.jsx';

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}秒前`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

export default function PostCard({ post }) {
  const { profile } = useStore();
  const author = post.author || profile;
  const avatarUrl = useObjectURL(author?.avatarBlob);
  const [liked, setLiked] = useState(false);
  const likeCount = (post.likes || 0) + (liked ? 1 : 0);

  return (
    <article className="postcard">
      <div className="postcard-head">
        <span className="avatar sm">{avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="avatar-fallback" />}</span>
        <span className="postcard-user">{author?.username}</span>
        <button className="postcard-more"><MoreIcon /></button>
      </div>

      <div className="postcard-media" onDoubleClick={() => setLiked(true)}>
        <Carousel media={post.media} />
      </div>

      <div className="postcard-actions">
        <div className="left">
          <button onClick={() => setLiked((v) => !v)}><HeartIcon filled={liked} /></button>
          <button><CommentIcon /></button>
          <button><ShareIcon /></button>
        </div>
        <button className="right"><BookmarkIcon /></button>
      </div>

      {likeCount > 0 && <div className="postcard-likes">いいね！{likeCount.toLocaleString()}件</div>}
      {post.caption && (
        <div className="postcard-caption">
          <span className="postcard-user">{author?.username}</span> {post.caption}
        </div>
      )}
      <div className="postcard-time">{timeAgo(post.createdAt)}</div>
    </article>
  );
}
