import { useStore } from '../store/StoreProvider.jsx';
import TopBar from '../components/TopBar.jsx';
import StoriesTray from '../components/StoriesTray.jsx';
import PostCard from '../components/PostCard.jsx';
import { HeartIcon, ShareIcon } from '../components/icons.jsx';

export default function FeedScreen() {
  const { posts, setOverlay } = useStore();
  const feed = posts.filter((p) => p.type === 'feed');

  return (
    <div>
      <TopBar
        title={<span className="logo">Instagram</span>}
        right={<>
          <button onClick={() => setOverlay({ kind: 'composer' })}><HeartIcon /></button>
          <button onClick={() => setOverlay({ kind: 'composer' })}><ShareIcon /></button>
        </>}
      />
      <StoriesTray />
      {feed.length === 0 ? (
        <div className="empty">まだ投稿がありません。＋から投稿してみよう。</div>
      ) : (
        feed.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}
