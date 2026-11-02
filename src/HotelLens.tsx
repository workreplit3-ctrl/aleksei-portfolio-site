import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';

const R = 92; // lens radius, px
const ZOOM = 1.75;

/* Circular refracting lens + soft camera tilt for the SkyLodge stage. Fine pointers only. */
export function HotelLens({ children, disabled = false }: { children: ReactNode; disabled?: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const camRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const reduce = useReducedMotion();
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine) and (min-width: 768px)');
    const upd = () => setFine(mq.matches);
    upd();
    mq.addEventListener('change', upd);
    return () => mq.removeEventListener('change', upd);
  }, []);

  const enabled = fine && !reduce && !disabled;

  useEffect(() => {
    const stage = stageRef.current, cam = camRef.current, lens = lensRef.current, inner = innerRef.current, lensImg = imgRef.current;
    if (!enabled || !stage || !cam || !lens || !inner || !lensImg) return;
    const s = { tx: 0, ty: 0, x: 0, y: 0, inside: false, visible: false, raf: 0, op: 0, rx: 0, ry: 0, init: false };

    const shots = () => Array.from(stage.querySelectorAll<HTMLElement>('.hotel-shot')).reverse()
      .sort((a, b) => (parseFloat(getComputedStyle(b).zIndex) || 0) - (parseFloat(getComputedStyle(a).zIndex) || 0));
    const angleOf = (el: HTMLElement) => (parseFloat(getComputedStyle(el).rotate) || 0) * Math.PI / 180;

    const tick = () => {
      s.raf = 0;
      const sr = stage.getBoundingClientRect();
      s.x += (s.tx - s.x) * 0.16; s.y += (s.ty - s.y) * 0.16;
      // camera tilt
      const nx = s.inside ? (s.tx - sr.left) / sr.width - 0.5 : 0;
      const ny = s.inside ? (s.ty - sr.top) / sr.height - 0.5 : 0;
      s.ry += (nx * 5 - s.ry) * 0.08; s.rx += (-ny * 3.5 - s.rx) * 0.08;
      cam.style.transform = `rotateX(${s.rx.toFixed(3)}deg) rotateY(${s.ry.toFixed(3)}deg)`;

      // find image under lens centre
      let hit: { img: HTMLImageElement; lx: number; ly: number; w: number; h: number; a: number } | null = null;
      if (s.inside) {
        for (const fig of shots()) {
          const img = fig.querySelector('img'); if (!img) continue;
          const r = img.getBoundingClientRect();
          const a = angleOf(fig);
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const dx = s.x - cx, dy = s.y - cy;
          const lx = dx * Math.cos(-a) - dy * Math.sin(-a);
          const ly = dx * Math.sin(-a) + dy * Math.cos(-a);
          const w = img.offsetWidth, h = img.offsetHeight;
          if (Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2) { hit = { img, lx, ly, w, h, a }; break; }
        }
      }
      const targetOp = hit ? 1 : 0;
      s.op += (targetOp - s.op) * 0.18;
      lens.style.opacity = s.op.toFixed(3);
      lens.style.transform = `translate3d(${(s.x - sr.left - R).toFixed(2)}px, ${(s.y - sr.top - R).toFixed(2)}px, 0) scale(${(0.6 + s.op * 0.4).toFixed(3)})`;
      if (hit) {
        const src = hit.img.currentSrc || hit.img.src;
        if (lensImg.src !== src) lensImg.src = src;
        lensImg.style.width = `${hit.w * ZOOM}px`;
        lensImg.style.height = `${hit.h * ZOOM}px`;
        lensImg.style.transform = `translate3d(${(R - (hit.lx + hit.w / 2) * ZOOM).toFixed(2)}px, ${(R - (hit.ly + hit.h / 2) * ZOOM).toFixed(2)}px, 0)`;
        inner.style.transform = `rotate(${hit.a}rad)`;
      }
      const settling = Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) > 0.3 || Math.abs(s.op - targetOp) > 0.01 || Math.abs(s.rx) + Math.abs(s.ry) > 0.01;
      if (s.visible && (s.inside || settling)) s.raf = requestAnimationFrame(tick);
      else if (!s.inside) { cam.style.transform = ''; lens.style.opacity = '0'; }
    };
    const kick = () => { if (!s.raf && s.visible) s.raf = requestAnimationFrame(tick); };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      s.tx = e.clientX; s.ty = e.clientY;
      if (!s.inside || !s.init) { s.x = s.tx; s.y = s.ty; s.init = true; }
      s.inside = true; kick();
    };
    const leave = () => { s.inside = false; s.init = false; kick(); };
    const scroll = () => { if (s.inside) kick(); };
    const io = new IntersectionObserver(([en]) => {
      s.visible = en.isIntersecting;
      if (!s.visible) { if (s.raf) cancelAnimationFrame(s.raf); s.raf = 0; s.inside = false; s.op = 0; s.rx = s.ry = 0; cam.style.transform = ''; lens.style.opacity = '0'; }
    });
    io.observe(stage);
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerleave', leave);
    window.addEventListener('scroll', scroll, { passive: true });
    return () => {
      io.disconnect();
      stage.removeEventListener('pointermove', move);
      stage.removeEventListener('pointerleave', leave);
      window.removeEventListener('scroll', scroll);
      if (s.raf) cancelAnimationFrame(s.raf);
      cam.style.transform = ''; lens.style.opacity = '0';
    };
  }, [enabled]);

  return (
    <div ref={stageRef} className={`hotel-stage ${enabled ? 'lens-on' : ''}`}>
      <div ref={camRef} className="hotel-cam">{children}</div>
      {enabled && (
        <div ref={lensRef} className="hotel-lens" aria-hidden="true" style={{ width: R * 2, height: R * 2 }}>
          <div ref={innerRef} className="hotel-lens-inner">
            <img ref={imgRef} alt="" draggable={false} />
          </div>
        </div>
      )}
    </div>
  );
}
