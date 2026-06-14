import { useStore } from './store/StoreProvider.jsx';
import TabBar from './components/TabBar.jsx';
import FeedScreen from './screens/FeedScreen.jsx';

export default function App() {
  const { ready, tab } = useStore();
  return (
    <div className="app-frame">
      <div className="app-screen">
        {!ready ? <div className="loading">…</div> : (
          <>
            {tab === 'home' && <FeedScreen />}
            {tab !== 'home' && <div className="empty">この画面は準備中（{tab}）</div>}
          </>
        )}
      </div>
      <TabBar />
    </div>
  );
}
