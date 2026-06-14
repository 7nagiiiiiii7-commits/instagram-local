import { useState } from 'react';
import { useStore } from '../store/StoreProvider.jsx';
import { useObjectURL } from '../hooks/useObjectURL.js';
import { CloseIcon } from '../components/icons.jsx';

export default function ProfileEditScreen() {
  const { profile, updateProfile, setOverlay } = useStore();
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [avatarBlob, setAvatarBlob] = useState(profile.avatarBlob);
  const avatarUrl = useObjectURL(avatarBlob);

  const onAvatar = (e) => {
    const f = e.target.files?.[0];
    if (f) setAvatarBlob(f);
    e.target.value = '';
  };

  const save = async () => {
    await updateProfile({ username: username.trim() || 'your_username', displayName, bio, avatarBlob });
    setOverlay(null);
  };

  return (
    <div className="overlay">
      <header className="topbar">
        <div className="topbar-side"><button onClick={() => setOverlay(null)}><CloseIcon /></button></div>
        <div className="topbar-title">プロフィールを編集</div>
        <div className="topbar-side topbar-right"><button className="share-btn" onClick={save}>完了</button></div>
      </header>
      <div className="composer-body">
        <label className="edit-avatar">
          <input type="file" accept="image/*" onChange={onAvatar} hidden />
          <span className="avatar lg">{avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="avatar-fallback" />}</span>
          <span className="edit-avatar-link">写真を変更</span>
        </label>
        <Field label="ユーザーネーム" value={username} onChange={setUsername} />
        <Field label="名前" value={displayName} onChange={setDisplayName} />
        <Field label="自己紹介" value={bio} onChange={setBio} textarea />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}
