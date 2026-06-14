import { useObjectURL } from '../hooks/useObjectURL.js';

export default function MediaItem({ media, className, videoProps = {} }) {
  const url = useObjectURL(media?.blob);
  if (!url) return <div className={className} style={{ background: '#222' }} />;
  if (media.kind === 'video') {
    return <video className={className} src={url} muted loop playsInline autoPlay {...videoProps} />;
  }
  return <img className={className} src={url} alt="" />;
}
