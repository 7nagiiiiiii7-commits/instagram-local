const S = ({ children, size = 24, fill = 'none', stroke = 'currentColor', ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
);

export const HeartIcon = ({ filled, ...p }) => (
  <S fill={filled ? 'var(--ig-like)' : 'none'} stroke={filled ? 'var(--ig-like)' : 'currentColor'} {...p}>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </S>
);
export const CommentIcon = (p) => (
  <S {...p}><path d="M21 11.5a8.4 8.4 0 0 1-12 7.6L3 21l1.9-6A8.5 8.5 0 1 1 21 11.5z" /></S>
);
export const ShareIcon = (p) => (
  <S {...p}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" /></S>
);
export const BookmarkIcon = (p) => (
  <S {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></S>
);
export const HomeIcon = ({ active, ...p }) => (
  <S fill={active ? 'currentColor' : 'none'} {...p}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></S>
);
export const SearchIcon = (p) => (
  <S {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></S>
);
export const PlusIcon = (p) => (
  <S {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M12 8v8M8 12h8" /></S>
);
export const ReelsIcon = ({ active, ...p }) => (
  <S fill={active ? 'currentColor' : 'none'} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="4" /><path d="m10 8 5 4-5 4z" fill={active ? '#000' : 'currentColor'} stroke="none" />
  </S>
);
export const BackIcon = (p) => (<S {...p}><path d="M15 18 9 12l6-6" /></S>);
export const CloseIcon = (p) => (<S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>);
export const MoreIcon = (p) => (
  <S {...p}><circle cx="5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="19" cy="12" r="1.4" fill="currentColor" /></S>
);
export const CarouselIcon = (p) => (
  <S size={18} {...p}><rect x="8" y="3" width="13" height="13" rx="2" /><path d="M3 8v11a2 2 0 0 0 2 2h11" /></S>
);
export const VideoMarkIcon = (p) => (
  <S size={18} fill="currentColor" stroke="none" {...p}><path d="M8 5v14l11-7z" /></S>
);
