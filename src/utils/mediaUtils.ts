export const isVideoMedia = (url: string | undefined | null): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase().trim();
  return (
    lower.startsWith('firestore://video/') ||
    lower.startsWith('data:video/') ||
    lower.startsWith('blob:') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.includes('/videos/') ||
    lower.includes('mixkit.co/videos') ||
    lower.includes('.mp4?')
  );
};
