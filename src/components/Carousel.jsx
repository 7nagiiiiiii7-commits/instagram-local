import { useRef, useState } from 'react';
import MediaItem from './MediaItem.jsx';

export default function Carousel({ media }) {
  const [index, setIndex] = useState(0);
  const ref = useRef(null);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  return (
    <div className="carousel">
      <div className="carousel-track" ref={ref} onScroll={onScroll}>
        {media.map((m, i) => (
          <div className="carousel-slide" key={i}>
            <MediaItem media={m} className="post-media" />
          </div>
        ))}
      </div>
      {media.length > 1 && (
        <>
          <div className="carousel-counter">{index + 1}/{media.length}</div>
          <div className="carousel-dots">
            {media.map((_, i) => (
              <span key={i} className={'dot' + (i === index ? ' active' : '')} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
