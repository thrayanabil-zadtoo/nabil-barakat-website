import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AuthorPost } from '../types';
import {
  buildCommunityPostCopyText,
  copyTextToClipboard,
} from '../config/siteDomain';
import {
  createHeartBurstEvent,
  HeartBurstEvent,
} from '../components/DoubleTapHeartOverlay';
import { playHeartLikeSound } from '../utils/heartSound';

interface UseCommunityPostInteractionsOptions {
  authorName: string;
  toggleLikeAuthorPost: (id: string, forceLike?: boolean) => boolean;
  recordPostView: (id: string) => void;
  showToast: (msg: string) => void;
}

export function useCommunityPostInteractions({
  authorName,
  toggleLikeAuthorPost,
  recordPostView,
  showToast,
}: UseCommunityPostInteractionsOptions) {
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [pressingPostId, setPressingPostId] = useState<string | null>(null);
  const [burstsByPost, setBurstsByPost] = useState<Record<string, HeartBurstEvent[]>>({});
  const [recentlyPoppedLikeId, setRecentlyPoppedLikeId] = useState<string | null>(null);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartPointRef = useRef<{ x: number; y: number; time: number; postId: string } | null>(null);
  const longPressTriggeredRef = useRef(false);
  const movedDuringPressRef = useRef(false);
  const lastTapRef = useRef<{ postId: string; time: number; x: number; y: number } | null>(null);
  const lastBurstTimeRef = useRef<Record<string, number>>({});
  const burstCleanupTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      burstCleanupTimersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const isNonInteractiveTarget = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    return Boolean(
      el?.closest('button, a, input, textarea, select, label, form, audio, [data-no-post-copy="true"]')
    );
  };

  const handleCopyPostImmediately = useCallback(
    async (post: AuthorPost) => {
      const textToCopy = buildCommunityPostCopyText(post, authorName || 'أ. نبيل بركات');
      const copied = await copyTextToClipboard(textToCopy);
      if (copied) {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(35);
        }
        setCopiedPostId(post.id);
        showToast('تم النسخ');
        setTimeout(() => {
          setCopiedPostId((prev) => (prev === post.id ? null : prev));
        }, 2200);
      } else {
        showToast('تعذر النسخ التلقائي، يرجى المحاولة مرة أخرى');
      }
    },
    [authorName, showToast]
  );

  const spawnHeartBurst = useCallback(
    (postId: string, clientX?: number, clientY?: number, cardEl?: HTMLElement | null) => {
      let originXPercent = 50;
      let originYPercent = 45;

      if (cardEl && typeof clientX === 'number' && typeof clientY === 'number') {
        const rect = cardEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          originXPercent = ((clientX - rect.left) / rect.width) * 100;
          originYPercent = ((clientY - rect.top) / rect.height) * 100;
        }
      }

      const burst = createHeartBurstEvent(originXPercent, originYPercent);
      setBurstsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []).slice(-3), burst],
      }));

      const cleanupTimer = setTimeout(() => {
        setBurstsByPost((prev) => {
          const current = prev[postId];
          if (!current) return prev;
          const remaining = current.filter((b) => b.id !== burst.id);
          if (remaining.length === 0) {
            const copy = { ...prev };
            delete copy[postId];
            return copy;
          }
          return { ...prev, [postId]: remaining };
        });
      }, 1950);

      burstCleanupTimersRef.current.push(cleanupTimer);
    },
    []
  );

  const triggerDoubleTapLike = useCallback(
    (postId: string, clientX?: number, clientY?: number, cardEl?: HTMLElement | null) => {
      const now = Date.now();
      const prevBurstAt = lastBurstTimeRef.current[postId] || 0;
      if (now - prevBurstAt < 340) return;
      lastBurstTimeRef.current[postId] = now;

      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate([22, 30, 18]);
      }

      playHeartLikeSound();
      spawnHeartBurst(postId, clientX, clientY, cardEl);
      toggleLikeAuthorPost(postId, true);

      setRecentlyPoppedLikeId(postId);
      setTimeout(() => {
        setRecentlyPoppedLikeId((prev) => (prev === postId ? null : prev));
      }, 480);
    },
    [spawnHeartBurst, toggleLikeAuthorPost]
  );

  const handleLikeButtonClick = useCallback(
    (post: AuthorPost, e?: React.MouseEvent<HTMLButtonElement>) => {
      const willBeLiked = toggleLikeAuthorPost(post.id);
      if (willBeLiked) {
        playHeartLikeSound();
        const cardEl = e?.currentTarget?.closest('article') as HTMLElement | null;
        spawnHeartBurst(post.id, undefined, undefined, cardEl);
        setRecentlyPoppedLikeId(post.id);
        setTimeout(() => {
          setRecentlyPoppedLikeId((prev) => (prev === post.id ? null : prev));
        }, 480);
      }
    },
    [spawnHeartBurst, toggleLikeAuthorPost]
  );

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setPressingPostId(null);
  }, []);

  const handlePostPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>, post: AuthorPost) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (isNonInteractiveTarget(e.target)) return;

      clearLongPressTimer();
      longPressTriggeredRef.current = false;
      movedDuringPressRef.current = false;
      pressStartPointRef.current = {
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
        postId: post.id,
      };
      setPressingPostId(post.id);

      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        longPressTriggeredRef.current = true;
        setPressingPostId(null);
        void handleCopyPostImmediately(post);
      }, 450);
    },
    [clearLongPressTimer, handleCopyPostImmediately]
  );

  const handlePostPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!pressStartPointRef.current) return;
      const dx = Math.abs(e.clientX - pressStartPointRef.current.x);
      const dy = Math.abs(e.clientY - pressStartPointRef.current.y);
      if (dx > 10 || dy > 10) {
        movedDuringPressRef.current = true;
        clearLongPressTimer();
      }
    },
    [clearLongPressTimer]
  );

  const handlePostPointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>, post: AuthorPost) => {
      clearLongPressTimer();
      const startInfo = pressStartPointRef.current;
      pressStartPointRef.current = null;

      if (
        !startInfo ||
        startInfo.postId !== post.id ||
        longPressTriggeredRef.current ||
        movedDuringPressRef.current ||
        isNonInteractiveTarget(e.target)
      ) {
        return;
      }

      const now = Date.now();
      const pressDuration = now - startInfo.time;
      if (pressDuration > 360) return;

      const lastTap = lastTapRef.current;
      if (
        lastTap &&
        lastTap.postId === post.id &&
        now - lastTap.time < 360 &&
        Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 44
      ) {
        lastTapRef.current = null;
        triggerDoubleTapLike(post.id, e.clientX, e.clientY, e.currentTarget);
      } else {
        lastTapRef.current = {
          postId: post.id,
          time: now,
          x: e.clientX,
          y: e.clientY,
        };
      }
    },
    [clearLongPressTimer, triggerDoubleTapLike]
  );

  const handlePostPointerCancel = useCallback(() => {
    clearLongPressTimer();
    pressStartPointRef.current = null;
  }, [clearLongPressTimer]);

  const handlePostDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLElement>, post: AuthorPost) => {
      if (isNonInteractiveTarget(e.target)) return;
      triggerDoubleTapLike(post.id, e.clientX, e.clientY, e.currentTarget);
    },
    [triggerDoubleTapLike]
  );

  const handlePostContextMenu = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!isNonInteractiveTarget(e.target)) {
      e.preventDefault();
    }
  }, []);

  // Track views automatically once per post when scrolled into view
  const registerPostViewObserver = useCallback(
    (containerEl: HTMLElement | null) => {
      if (!containerEl || typeof IntersectionObserver === 'undefined') return () => {};

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const postId = (entry.target as HTMLElement).dataset.postId;
              if (postId) {
                recordPostView(postId);
                observer.unobserve(entry.target);
              }
            }
          });
        },
        { threshold: 0.45 }
      );

      const cards = containerEl.querySelectorAll<HTMLElement>('article[data-post-id]');
      cards.forEach((card) => observer.observe(card));

      return () => observer.disconnect();
    },
    [recordPostView]
  );

  return {
    copiedPostId,
    pressingPostId,
    burstsByPost,
    recentlyPoppedLikeId,
    handlePostPointerDown,
    handlePostPointerMove,
    handlePostPointerUp,
    handlePostPointerCancel,
    handlePostDoubleClick,
    handlePostContextMenu,
    handleLikeButtonClick,
    registerPostViewObserver,
  };
}
