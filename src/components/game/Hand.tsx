import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Card, Suit } from '../../engine';
import { sortHand } from '../../engine';
import { PlayingCard } from '../PlayingCard';
import styles from './Hand.module.css';

interface Props {
  cards: Card[];
  trumpSuit: Suit;
  legalIds: Set<string>;
  selectedId: string | null;
  enabled: boolean;
  onTap: (cardId: string) => void;
  onDrop: (cardId: string, clientX: number, clientY: number) => void;
}

interface Drag {
  id: string;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  active: boolean;
}

const DRAG_THRESHOLD = 8;

function readVar(name: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(v) ? v : fallback;
}

export function Hand({ cards, trumpSuit, legalIds, selectedId, enabled, onTap, onDrop }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  const [cardW, setCardW] = useState(66);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      setWidth(el.clientWidth);
      setCardW(readVar('--hand-w', 66));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  const sorted = sortHand(cards, trumpSuit);
  const n = sorted.length;
  const maxStep = cardW * 0.7;
  const step = n > 1 ? Math.min(maxStep, (width - cardW - 8) / (n - 1)) : 0;
  const total = cardW + step * Math.max(0, n - 1);
  const startX = (width - total) / 2;
  const spread = Math.min(4, 36 / Math.max(1, n));

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, id: string) => {
      if (!enabled || !legalIds.has(id)) return;
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const d: Drag = { id, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, active: false };
      dragRef.current = d;
      setDrag(d);
    },
    [enabled, legalIds],
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const active = d.active || Math.hypot(dx, dy) > DRAG_THRESHOLD;
    const next = { ...d, dx, dy, active };
    dragRef.current = next;
    setDrag(next);
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;
      setDrag(null);
      if (d.active) onDrop(d.id, e.clientX, e.clientY);
      else onTap(d.id);
    },
    [onDrop, onTap],
  );

  const onPointerCancel = useCallback(() => {
    dragRef.current = null;
    setDrag(null);
  }, []);

  return (
    <div ref={ref} className={styles.hand} aria-label="היד שלך">
      {sorted.map((card, i) => {
        const legal = legalIds.has(card.id) && enabled;
        const selected = selectedId === card.id;
        const dragging = drag?.id === card.id && drag.active;
        const x = startX + i * step;
        const angle = (i - (n - 1) / 2) * spread;
        const lift = Math.abs(i - (n - 1) / 2) * 2;
        const style: React.CSSProperties = dragging
          ? {
              transform: `translate(${x + (drag?.dx ?? 0)}px, ${(drag?.dy ?? 0)}px) rotate(0deg) scale(1.08)`,
              zIndex: 100,
              transition: 'none',
              pointerEvents: 'none',
            }
          : {
              transform: `translate(${x}px, ${selected ? -18 : lift}px) rotate(${angle}deg)`,
              zIndex: selected ? 50 : i,
            };
        return (
          <div
            key={card.id}
            className={`${styles.slot} ${legal ? styles.playable : ''}`}
            style={style}
            role="button"
            aria-disabled={!legal}
            aria-pressed={selected}
            data-card-id={card.id}
            onPointerDown={(e) => onPointerDown(e, card.id)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
          >
            <PlayingCard
              card={card}
              size="hand"
              trump={card.suit === trumpSuit}
              legal={legal && !selected}
              selected={selected}
              dimmed={enabled && !legal}
              enter="draw"
            />
          </div>
        );
      })}
    </div>
  );
}
