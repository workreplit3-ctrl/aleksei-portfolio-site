import { useEffect, useId, useRef } from 'react';

type Ripple = { x: number; y: number; started: number };
const SVG_NS = 'http://www.w3.org/2000/svg';
const LIFETIME = 1.25;

// A travelling circular wavefront, sampled per pixel rather than per letter.
export function rippleDisplacement(distance: number, age: number, fontSize: number) {
  if (age < 0 || age >= LIFETIME) return 0;
  const phase = (distance - age * fontSize * 3.2) / (fontSize * 0.62);
  if (Math.abs(phase) > 2.4) return 0;
  return Math.cos(phase * 3.1) * Math.exp(-phase * phase * 1.4 - age * 2.1);
}

export function useTitleRipple(disabled: boolean, text: string) {
  const ref = useRef<HTMLSpanElement>(null);
  const id = `title-liquid-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  useEffect(() => {
    const root = ref.current;
    if (disabled || !root) return;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;
    const target = root.closest('a') ?? root;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none;';
    const defs = document.createElementNS(SVG_NS, 'defs');
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.id = id;
    filter.setAttribute('filterUnits', 'userSpaceOnUse');
    filter.setAttribute('primitiveUnits', 'userSpaceOnUse');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    const field = document.createElementNS(SVG_NS, 'feImage');
    field.setAttribute('result', 'liquid-field');
    field.setAttribute('preserveAspectRatio', 'none');
    const smooth = document.createElementNS(SVG_NS, 'feGaussianBlur');
    smooth.setAttribute('in', 'liquid-field');
    smooth.setAttribute('result', 'smooth-liquid-field');
    const displacement = document.createElementNS(SVG_NS, 'feDisplacementMap');
    displacement.setAttribute('in', 'SourceGraphic');
    displacement.setAttribute('in2', 'smooth-liquid-field');
    displacement.setAttribute('xChannelSelector', 'R');
    displacement.setAttribute('yChannelSelector', 'G');
    displacement.setAttribute('result', 'refracted-text');
    // The blue channel is a local transparency mask: a soft, watery sheen.
    const opacity = document.createElementNS(SVG_NS, 'feColorMatrix');
    opacity.setAttribute('in', 'smooth-liquid-field');
    opacity.setAttribute('type', 'matrix');
    opacity.setAttribute('values', '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1 0 0');
    opacity.setAttribute('result', 'liquid-opacity');
    const composite = document.createElementNS(SVG_NS, 'feComposite');
    composite.setAttribute('in', 'refracted-text');
    composite.setAttribute('in2', 'liquid-opacity');
    composite.setAttribute('operator', 'in');
    filter.append(field, smooth, displacement, opacity, composite);
    defs.append(filter);
    svg.append(defs);
    document.body.append(svg);

    let ripples: Ripple[] = [];
    let raf = 0, epoch = 0, lastFrame = 0, lastEmitted = -Infinity;
    let lastX = -Infinity, lastY = -Infinity;
    let uploading = false, disposed = false;
    let width = 1, height = 1, padding = 1, fontSize = 80;
    let pixels: ImageData;

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ripples = [];
      epoch++;
      root.style.filter = '';
    };
    const measure = () => {
      stop();
      const bounds = root.getBoundingClientRect();
      fontSize = parseFloat(getComputedStyle(root).fontSize) || 80;
      padding = fontSize * 0.55;
      width = Math.max(1, bounds.width + padding * 2);
      height = Math.max(1, bounds.height + padding * 2);
      canvas.width = Math.min(220, Math.max(96, Math.ceil(width / 4)));
      canvas.height = Math.min(128, Math.max(32, Math.round(canvas.width * height / width)));
      pixels = context.createImageData(canvas.width, canvas.height);
      for (const primitive of [filter, field]) {
        primitive.setAttribute('x', `${-padding}`);
        primitive.setAttribute('y', `${-padding}`);
        primitive.setAttribute('width', `${width}`);
        primitive.setAttribute('height', `${height}`);
      }
      smooth.setAttribute('stdDeviation', `${fontSize * 0.02}`);
      displacement.setAttribute('scale', `${fontSize * 0.5}`);
    };
    measure();

    const tick = (now: number) => {
      raf = 0;
      ripples = ripples.filter(ripple => (now - ripple.started) / 1000 < LIFETIME);
      if (!ripples.length) { stop(); return; }
      if (now - lastFrame >= 32 && !uploading) {
        lastFrame = now;
        const waves = ripples.map(ripple => ({ ...ripple, age: (now - ripple.started) / 1000 }));
        for (let py = 0; py < canvas.height; py++) {
          const y = (py + 0.5) / canvas.height * height - padding;
          for (let px = 0; px < canvas.width; px++) {
            const x = (px + 0.5) / canvas.width * width - padding;
            let vx = 0, vy = 0, sheen = 0;
            for (const wave of waves) {
              const dx = x - wave.x, dy = y - wave.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const strength = rippleDisplacement(distance, wave.age, fontSize);
              if (!strength) continue;
              const inverseDistance = 1 / Math.max(1, distance);
              vx += dx * inverseDistance * strength;
              vy += dy * inverseDistance * strength;
              sheen += Math.abs(strength);
            }
            const offset = (py * canvas.width + px) * 4;
            pixels.data[offset] = 128 + Math.max(-1, Math.min(1, vx)) * 55;
            pixels.data[offset + 1] = 128 + Math.max(-1, Math.min(1, vy)) * 55;
            pixels.data[offset + 2] = 255 - Math.min(1, sheen) * 105;
            pixels.data[offset + 3] = 255;
          }
        }
        context.putImageData(pixels, 0, 0);
        const data = canvas.toDataURL('image/png');
        const frameEpoch = epoch;
        uploading = true;
        // Decode first so replacing the displacement texture never blanks the title.
        const decoded = new Image();
        decoded.src = data;
        decoded.decode().then(() => {
          if (disposed || frameEpoch !== epoch) return;
          field.setAttribute('href', data);
          root.style.filter = `url("#${id}")`;
        }).catch(error => {
          if (!disposed) { stop(); console.warn('Title refraction texture could not be decoded.', error); }
        }).finally(() => { uploading = false; });
      }
      raf = requestAnimationFrame(tick);
    };
    const emit = (event: Event) => {
      const pointer = event as PointerEvent;
      if (pointer.pointerType !== 'mouse' && pointer.pointerType !== 'pen') return;
      const now = performance.now();
      if (now - lastEmitted < 50 || Math.hypot(pointer.clientX - lastX, pointer.clientY - lastY) < 6) return;
      const bounds = root.getBoundingClientRect();
      ripples.push({ x: pointer.clientX - bounds.left, y: pointer.clientY - bounds.top, started: now });
      ripples = ripples.slice(-14);
      lastEmitted = now;
      lastX = pointer.clientX;
      lastY = pointer.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const leave = () => { lastX = lastY = -Infinity; };
    const visibility = () => { if (document.hidden) stop(); };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    target.addEventListener('pointerenter', emit);
    target.addEventListener('pointermove', emit);
    target.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      disposed = true;
      stop();
      observer.disconnect();
      target.removeEventListener('pointerenter', emit);
      target.removeEventListener('pointermove', emit);
      target.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', visibility);
      svg.remove();
    };
  }, [disabled, text, id]);

  return ref;
}
