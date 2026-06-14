import { useStore } from '../store/StoreProvider.jsx';
import PostCard from '../components/PostCard.jsx';
import { BackIcon } from '../components/icons.jsx';

export default function PostDetail({ id }) {
  const { posts, setOverlay } = useStore();
  const post = posts.find((p) => p.id === id);
  return (
    <div className="overlay">
      <header className="topbar">
        <div className="topbar-side"><button onClick={() => setOverlay(null)}><BackIcon /></button></div>
        <div className="topbar-title">投稿</div>
        <div className="topbar-side" />
      </header>
      <div className="app-screen">
        {post ? <PostCard post={post} /> : <div className="empty">投稿が見つかりません</div>}
      </div>
    </div>
  );
}
