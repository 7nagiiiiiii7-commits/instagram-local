import { useStore } from './store/StoreProvider.jsx';
import TabBar from './components/TabBar.jsx';
import FeedScreen from './screens/FeedScreen.jsx';
import ProfileScreen from './screens/ProfileScreen.jsx';
import ComposerScreen from './screens/ComposerScreen.jsx';
import PostDetail from './screens/PostDetail.jsx';
import ProfileEditScreen from './screens/ProfileEditScreen.jsx';
import StoryViewer from './screens/StoryViewer.jsx';

export default function App() {
  const { ready, tab, overlay } = useStore();
  return (
    <div className="app-frame">
      <div className="app-screen">
        {!ready ? <div className="loading">…</div> : (
          <>
            {tab === 'home' && <FeedScreen />}
            {tab === 'profile' && <ProfileScreen />}
            {tab !== 'home' && tab !== 'profile' && (
              <div className="placeholder-tab">
                <div className="empty">「{tab === 'search' ? '検索' : 'リール'}」はこのプレビューでは未対応です。<br/>ホーム・プロフィール・＋投稿・ストーリーをお試しください。</div>
              </div>
            )}
          </>
        )}
      </div>
      <TabBar />
      {overlay?.kind === 'composer' && <ComposerScreen />}
      {overlay?.kind === 'postDetail' && <PostDetail id={overlay.id} />}
      {overlay?.kind === 'editProfile' && <ProfileEditScreen />}
      {overlay?.kind === 'story' && <StoryViewer />}
    </div>
  );
}
