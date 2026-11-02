import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { HotelLens } from './HotelLens';
import { useTitleRipple } from './hooks/useTitleRipple';
import {
  AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform,
} from 'framer-motion';

type Lang = 'ru' | 'en';
type Project = {
  number: string; category: string; title: string; description: string;
  image: string; alt: string; href: string; linkLabel: string;
  imageFit?: 'cover' | 'contain'; imageAspect?: string;
};

const image = (name: string) => `${import.meta.env.BASE_URL}images/${name}`;
const EASE = [0.76, 0, 0.24, 1] as const;
const SOFT = [0.16, 1, 0.3, 1] as const;
const MotionDisabledContext = createContext(false);

function useMotionDisabled() {
  // Both hooks must run on every render, including when quiet mode changes.
  const quiet = useContext(MotionDisabledContext);
  const reducedMotion = useReducedMotion();
  return quiet || Boolean(reducedMotion);
}

const projects: Record<Lang, Project[]> = {
  ru: [
    { number: '01', category: 'Telegram / сервис', title: 'Vacancy Bot Stars', description: 'VacaBot — агрегатор вакансий в Telegram. Быстрый вход в сервис без отдельного приложения.', image: image('vacabot-ru-square.svg'), alt: 'Главный экран VacaBot на русском языке', href: 'https://t.me/VacaBota_bot', linkLabel: 'Открыть бота', imageFit: 'contain', imageAspect: '1 / 1' },
    { number: '02', category: 'Образовательный продукт', title: 'Course Tracker', description: 'Премиальный курс по созданию Telegram-ботов: 10 уроков от polling до webhook и базы данных, JavaScript-тренажёр с /start, /help и /menu, оплата через TON.', image: image('course-tracker.png'), alt: 'Главная страница Course Tracker', href: 'https://coursetb.replit.app/', linkLabel: 'Открыть продукт' },
    { number: '03', category: 'Сайт бренда', title: 'Территория Свободы', description: 'Сайт ландшафтной студии: концептуальные проекты, рабочая документация и 3D-визуализация. Пакеты для участков до 20 и 50 соток.', image: image('territory-freedom-presentation.webp'), alt: 'Скриншот сайта «Территория Свободы» из презентации', href: 'https://territoriya-svobody.vercel.app/', linkLabel: 'Посетить сайт', imageFit: 'contain', imageAspect: '2000 / 1737' },
    { number: '04', category: 'Telegram / продукт', title: 'Soundxb One', description: 'Отдельный Telegram-продукт soundxb1 с коротким входом в сценарий бота — без установки отдельного приложения.', image: image('soundxb-presentation.webp'), alt: 'Экран калькулятора аренды оборудования, используемый в презентации проекта 04', href: 'https://t.me/soundxb1_bot', linkLabel: 'Открыть бота', imageFit: 'contain', imageAspect: '810 / 1471' },
  ],
  en: [
    { number: '01', category: 'Telegram / service', title: 'Vacancy Bot Stars', description: 'VacaBot brings job listings into Telegram, with a direct path into the service and no separate app to install.', image: image('vacabot-en.webp'), alt: 'VacaBot Telegram launch page', href: 'https://t.me/VacaBota_bot', linkLabel: 'Open the bot', imageFit: 'contain', imageAspect: '1 / 1' },
    { number: '02', category: 'Education product', title: 'Course Tracker', description: 'A premium Telegram bot course: 10 lessons from polling to webhooks and databases, a JavaScript simulator for /start, /help, and /menu, and payments via TON.', image: image('course-tracker-en.webp'), alt: 'Course Tracker home page', href: 'https://coursetb.replit.app/', linkLabel: 'Explore the product' },
    { number: '03', category: 'Brand website', title: 'Territory of Freedom', description: 'A landscape studio website for concepts, technical plans, 3D visualizations, and packages for plots up to 2,000 and 5,000 m².', image: image('territory-freedom-en-presentation.webp'), alt: 'Territory of Freedom website screenshot from the portfolio presentation', href: 'https://territoriya-svobody.vercel.app/', linkLabel: 'Visit the website', imageFit: 'contain', imageAspect: '1 / 1' },
    { number: '04', category: 'Telegram / product', title: 'Soundxb One', description: 'A standalone soundxb1 Telegram product with a direct start flow, available without installing a separate app.', image: image('soundxb-presentation.webp'), alt: 'Equipment rental price calculator screen shown in project 04’s presentation', href: 'https://t.me/soundxb1_bot', linkLabel: 'Open the bot', imageFit: 'contain', imageAspect: '810 / 1471' },
  ],
};

const hotelImages: Record<Lang, string[]> = {
  ru: [image('skylodge-dashboard.png'), image('skylodge-bookings.png'), image('skylodge-rooms.png')],
  en: [image('skylodge-dashboard.png'), image('skylodge-analytics-en.webp'), image('skylodge-expenses-en.webp')],
};
const certificateImage = image('1million-prompters-certificate.webp');

const copy = {
  ru: {
    navWork: 'Работы', navAbout: 'Обо мне', navContact: 'Контакт', lang: 'EN',
    enter: 'Войти', enterQuiet: 'Войти без анимации',
    entryLine: 'Независимый создатель цифровых продуктов: Telegram-боты, сайты, образовательные сервисы и платформа для отелей.',
    heroLabel: 'Портфолио цифровых продуктов',
    intro: <>Создаю <strong>цифровые продукты</strong> — от Telegram-ботов и интерактивных сервисов до полноценных веб-приложений.</>,
    scroll: 'Листайте дальше', workLabel: 'Избранные проекты', workTitle: <>Идеи, которые<br />стали продуктами.</>,
    workNote: 'Разные задачи. Общий фокус — ясный сценарий, характер и польза в каждом касании.',
    hotelTag: '05 / Hospitality platform', hotelTitle: <>SkyLodge —<br />сеть отелей</>,
    hotelIntro: 'Платформа для бронирований и управления гостями: единый взгляд на работу объектов и ежедневные операции.',
    dashboard: 'Панель управления', bookings: 'Календарь бронирований', rooms: 'Номерной фонд',
    operations: 'Операции и аналитика', roomsLine: 'Номерной фонд', expenses: 'Расходы',
    hotelLine: 'Номерной фонд · расходы · показатели · доступы',
    approach: '02 / Подход',
    quote: <>Хороший продукт не просит внимания.<br /><em>Он делает следующий шаг очевидным.</em></>,
    quoteSmall: 'Как я думаю о цифровых продуктах', quoteNo: 'Принцип / 01',
    credentialKicker: 'Участие', credentialTitle: '1 Million Prompters',
    credentialDesc: 'Сертификат участника инициативы 1 Million Prompters.', credentialNote: 'Certificate of Completion',
    certificateAlt: 'Оригинал сертификата Aleksei Shatov об окончании инициативы 1 Million Prompters',
    certificateOpen: 'Открыть оригинал сертификата',
    contactKicker: 'Есть задача?', contactTitle: <>Давайте<br />создадим.</>,
    contactCopy: 'Если у вас есть идея цифрового продукта — напишите. Обсудим, каким может быть следующий шаг.',
    contactLink: 'Написать в Telegram', footer: 'Цифровые продукты · ALEKSEI', top: 'Наверх', view: 'Смотреть',
    ticker: ['Цифровые продукты', 'Telegram', 'Веб-приложения', 'Сервисы'],
  },
  en: {
    navWork: 'Work', navAbout: 'Approach', navContact: 'Contact', lang: 'RU',
    enter: 'Enter', enterQuiet: 'Enter without motion',
    entryLine: 'An independent digital product maker: Telegram bots, websites, educational products and a hotel operations platform.',
    heroLabel: 'Digital product portfolio',
    intro: <>I build <strong>digital products</strong> — from Telegram bots and interactive services to full-featured web apps.</>,
    scroll: 'Scroll to explore', workLabel: 'Selected projects', workTitle: <>Ideas made<br />into products.</>,
    workNote: 'Different challenges. One focus: a clear flow, a distinct character, and utility in every interaction.',
    hotelTag: '05 / Hospitality platform', hotelTitle: <>SkyLodge —<br />hotel network</>,
    hotelIntro: 'A platform for bookings and guest operations: one clear view across properties and the work that keeps them moving.',
    dashboard: 'Operations dashboard', bookings: 'Analytics dashboard', rooms: 'Expense management',
    operations: 'Operations & analytics', roomsLine: 'Room inventory', expenses: 'Expenses',
    hotelLine: 'Rooms · expenses · performance · access controls',
    approach: '02 / Approach',
    quote: <>A good product doesn’t ask for attention.<br /><em>It makes the next step obvious.</em></>,
    quoteSmall: 'A thought on digital products', quoteNo: 'Principle / 01',
    credentialKicker: 'Participation', credentialTitle: '1 Million Prompters',
    credentialDesc: 'Certificate of completion for the 1 Million Prompters initiative.', credentialNote: 'Certificate of Completion',
    certificateAlt: 'Original 1 Million Prompters certificate awarded to Aleksei Shatov',
    certificateOpen: 'Open full certificate',
    contactKicker: 'Have a challenge?', contactTitle: <>Let’s make<br />something.</>,
    contactCopy: 'Have an idea for a digital product? Send a note. We can figure out what the next step looks like.',
    contactLink: 'Message on Telegram', footer: 'Digital products · ALEKSEI', top: 'Back to top', view: 'View',
    ticker: ['Digital products', 'Telegram', 'Web apps', 'Services'],
  },
};

/* ---------- Original mark: two blobby "A" pupils that track the cursor ---------- */
function Mark({ size = 120, blink = true }: { size?: number; blink?: boolean }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 180, damping: 18 });
  const sy = useSpring(my, { stiffness: 180, damping: 18 });
  const reduce = useMotionDisabled();
  useEffect(() => {
    if (reduce) return;
    const move = (e: PointerEvent) => {
      mx.set(((e.clientX / window.innerWidth) - 0.5) * 14);
      my.set(((e.clientY / window.innerHeight) - 0.5) * 12);
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, [mx, my, reduce]);
  return (
    <motion.svg width={size} height={size * 0.62} viewBox="0 0 160 100" aria-hidden="true"
      animate={reduce ? undefined : { rotate: [-3, 3, -3] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${i ? 100 : 48} 50) rotate(${i ? 8 : -6})`}>
          <motion.path
            d="M0 -44 C 30 -44 40 -18 38 6 C 36 32 18 46 -2 44 C -26 42 -40 22 -38 -4 C -36 -28 -24 -44 0 -44 Z"
            fill="#fbf4f1" stroke="#212121" strokeWidth="5"
            animate={reduce ? undefined : { d: [
              'M0 -44 C 30 -44 40 -18 38 6 C 36 32 18 46 -2 44 C -26 42 -40 22 -38 -4 C -36 -28 -24 -44 0 -44 Z',
              'M2 -42 C 32 -46 42 -14 38 8 C 34 34 14 44 -4 44 C -30 44 -40 18 -38 -6 C -34 -30 -22 -40 2 -42 Z',
              'M0 -44 C 30 -44 40 -18 38 6 C 36 32 18 46 -2 44 C -26 42 -40 22 -38 -4 C -36 -28 -24 -44 0 -44 Z',
            ] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.g style={{ x: sx, y: sy }}>
            <motion.g
              animate={blink && !reduce ? { scaleY: [1, 1, 0.08, 1, 1] } : undefined}
              transition={{ duration: 4.2, repeat: Infinity, times: [0, 0.9, 0.94, 0.98, 1] }}>
              <ellipse cx="2" cy="4" rx="19" ry="25" fill="#212121" />
              <path d="M-4 18 L4 -10 L12 18 M-1 9 L9 9" stroke="#F6C8C3" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </motion.g>
          </motion.g>
        </g>
      ))}
    </motion.svg>
  );
}

/* ---------- Entry ---------- */
function Entry({ lang, onEnter, onLang }: { lang: Lang; onEnter: (quiet: boolean) => void; onLang: () => void }) {
  const t = copy[lang];
  const noMotion = useMotionDisabled();
  return (
    <motion.section className="entry" key="entry"
      initial={noMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}
      exit={noMotion ? { opacity: 0, transition: { duration: 0 } } : { clipPath: 'circle(0% at 50% 46%)', transition: { duration: 1.1, ease: EASE } }}
      style={{ clipPath: 'circle(150% at 50% 46%)' }}>
      <button className="pill pill-ghost entry-lang" onClick={onLang} data-testid="button-entry-language">{t.lang}</button>
      <div className="entry-center">
        <motion.div initial={noMotion ? false : { scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: noMotion ? 0 : 1, ease: SOFT, delay: noMotion ? 0 : 0.15 }}>
          <Mark size={130} />
        </motion.div>
        <motion.h1 className="entry-name" initial={noMotion ? false : { y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: noMotion ? 0 : 0.45, duration: noMotion ? 0 : 0.8, ease: SOFT }}>
          ALEKSEI<sup>®</sup>
        </motion.h1>
        <motion.p className="entry-line" initial={noMotion ? false : { y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: noMotion ? 0 : 0.58, duration: noMotion ? 0 : 0.8, ease: SOFT }}>
          {t.entryLine}
        </motion.p>
        <motion.button className="pill pill-white entry-btn" onClick={() => onEnter(false)} data-testid="button-enter"
          initial={noMotion ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: noMotion ? 0 : 0.75, duration: noMotion ? 0 : undefined, type: 'spring', stiffness: 260, damping: 16 }}
          whileHover={noMotion ? undefined : { scale: 1.08 }} whileTap={noMotion ? undefined : { scale: 0.94 }}>
          <span>{t.enter}</span><span className="arrow-dn">↘</span>
        </motion.button>
      </div>
      <motion.button className="entry-quiet" onClick={() => onEnter(true)} data-testid="button-enter-quiet"
        initial={noMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: noMotion ? 0 : 1, duration: noMotion ? 0 : undefined }}>
        {t.enterQuiet}
      </motion.button>
    </motion.section>
  );
}

/* ---------- Helpers ---------- */
function SplitWords({ children, className, delay = 0 }: { children: string; className?: string; delay?: number }) {
  const noMotion = useMotionDisabled();
  const rippleRef = useTitleRipple(noMotion, children);

  if (noMotion) {
    return <span ref={rippleRef} className={`split-words ${className ?? ''}`}>{children}</span>;
  }
  return (
    <motion.span
      ref={rippleRef}
      className={`split-words ${className ?? ''}`}
      aria-label={children}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        visible: { transition: { delayChildren: delay, staggerChildren: 0.06 } },
      }}
    >
      {children.split(' ').map((w, i) => (
        <span className="mask" key={i} aria-hidden="true">
          <motion.span
            className="mask-in"
            variants={{ hidden: { y: '110%' }, visible: { y: '0%' } }}
            transition={{ duration: 1, ease: SOFT }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

function Rise({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const noMotion = useMotionDisabled();
  if (noMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} initial={{ y: 60, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: '-8%' }} transition={{ duration: 1, ease: SOFT, delay }}>{children}</motion.div>
  );
}

function Magnetic({ children }: { children: ReactNode }) {
  const noMotion = useMotionDisabled();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(0, { stiffness: 220, damping: 14 });
  const y = useSpring(0, { stiffness: 220, damping: 14 });
  if (noMotion) return <span>{children}</span>;
  return (
    <motion.span ref={ref} style={{ x, y, display: 'inline-block' }}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.3); y.set((e.clientY - r.top - r.height / 2) * 0.4);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}>{children}</motion.span>
  );
}

function Cursor({ label }: { label: string | null }) {
  const noMotion = useMotionDisabled();
  const x = useSpring(-100, { stiffness: 500, damping: 40 });
  const y = useSpring(-100, { stiffness: 500, damping: 40 });
  useEffect(() => {
    if (noMotion) return;
    const m = (e: PointerEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('pointermove', m);
    return () => window.removeEventListener('pointermove', m);
  }, [x, y, noMotion]);
  if (noMotion) return null;
  return (
    <motion.div className="cursor" style={{ x, y }} aria-hidden="true">
      <motion.div className="cursor-dot" animate={{ scale: label ? 1 : 0.14 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
        <AnimatePresence>{label && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{label}</motion.span>}</AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Project: sticky full-bleed chapter ---------- */
function ProjectChapter({ project, index, onHover, viewLabel }: { project: Project; index: number; onHover: (v: string | null) => void; viewLabel: string }) {
  const noMotion = useMotionDisabled();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const clip = useTransform(scrollYProgress, [0, 0.38], ['inset(18% 14% 18% 14% round 48px)', 'inset(0% 0% 0% 0% round 0px)']);
  const imgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const imgScale = useTransform(scrollYProgress, [0, 0.4], [1.3, 1]);
  const numX = useTransform(scrollYProgress, [0, 1], ['20%', '-30%']);
  const rx = useMotionValue(0); const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 16 }); const sry = useSpring(ry, { stiffness: 120, damping: 16 });
  const dark = index % 2 === 1;
  return (
    <article ref={ref} className={`chapter chapter-${project.number} ${dark ? 'chapter-dark' : ''}`} data-testid={`project-${project.number}`}>
      <motion.div className="chapter-num" style={{ x: noMotion ? 0 : numX }} aria-hidden="true">{project.number}</motion.div>
      <div className="chapter-head">
        <span className="kicker">{project.number} / {project.category}</span>
        <h3 className="chapter-title">
          <a href={project.href} target="_blank" rel="noreferrer" data-testid={`link-project-title-${project.number}`}>
            <SplitWords>{project.title}</SplitWords>
          </a>
        </h3>
      </div>
      <motion.a
        className="chapter-visual"
        style={{
          clipPath: noMotion ? 'inset(0% 0% 0% 0% round 0px)' : clip,
          ...(project.imageAspect ? { aspectRatio: project.imageAspect, height: 'auto' } : {}),
        }}
        href={project.href}
        target="_blank"
        rel="noreferrer"
        aria-label={`${project.linkLabel}: ${project.title}`} data-testid={`link-project-image-${project.number}`}
        onPointerEnter={() => { if (!noMotion) onHover(viewLabel); }}
        onPointerLeave={() => { if (!noMotion) { onHover(null); rx.set(0); ry.set(0); } }}
        onPointerMove={(e) => {
          if (noMotion) return;
          const r = e.currentTarget.getBoundingClientRect();
          ry.set(((e.clientX - r.left) / r.width - 0.5) * 6); rx.set(-((e.clientY - r.top) / r.height - 0.5) * 6);
        }}>
        <motion.div className="chapter-frame" style={{ rotateX: noMotion ? 0 : srx, rotateY: noMotion ? 0 : sry }}>
          <motion.img src={project.image} alt={project.alt} loading="lazy" decoding="async"
              style={{
                y: noMotion || project.imageFit === 'contain' ? 0 : imgY,
                scale: noMotion || project.imageFit === 'contain' ? 1 : imgScale,
                objectFit: project.imageFit ?? 'cover',
              }} />
        </motion.div>
      </motion.a>
      <div className="chapter-foot">
        <p className="chapter-desc">{project.description}</p>
        <Magnetic>
          <a className="pill pill-solid" href={project.href} target="_blank" rel="noreferrer" data-testid={`link-project-open-${project.number}`}>
            {project.linkLabel} <span className="arrow">↗</span>
          </a>
        </Magnetic>
      </div>
    </article>
  );
}

/* ---------- Main ---------- */
function Main({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const t = copy[lang];
  const work = projects[lang];
  const shots = hotelImages[lang];
  const [cursor, setCursor] = useState<string | null>(null);
  const noMotion = useMotionDisabled();
  const reduceMotion = noMotion;
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: hp } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroScale = useTransform(hp, [0, 1], [1, 0.82]);
  const heroRadius = useTransform(hp, [0, 1], [0, 64]);
  const leftX = useTransform(hp, [0, 1], ['0%', '-22%']);
  const rightX = useTransform(hp, [0, 1], ['0%', '22%']);

  const hotelRef = useRef<HTMLElement>(null);
  const { scrollYProgress: hs } = useScroll({ target: hotelRef, offset: ['start end', 'end start'] });
  const hA = useTransform(hs, [0, 1], ['10%', '-14%']);
  const hB = useTransform(hs, [0, 1], ['30%', '-30%']);
  const hC = useTransform(hs, [0, 1], ['50%', '-10%']);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: noMotion ? 'instant' : 'smooth' });
  const altHotel = lang === 'ru'
    ? ['Панель SkyLodge: гости, бронирования и заезды', 'Календарь бронирований SkyLodge', 'Управление номерным фондом SkyLodge']
    : ['SkyLodge operations dashboard', 'SkyLodge analytics dashboard', 'SkyLodge expense management'];
  const captions = [t.dashboard, t.bookings, t.rooms];
  const ticker = t.ticker;

  return (
    <motion.main className="site" lang={lang} initial={noMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: noMotion ? 0 : 0.4 }}>
      <Cursor label={cursor} />
      <motion.div className="progress" style={{ scaleX: noMotion ? scrollYProgress : progress }} aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="ALEKSEI, home" data-testid="link-home"><Mark size={46} blink={false} /><span>ALEKSEI</span></a>
        <nav className="nav" aria-label={lang === 'ru' ? 'Основная навигация' : 'Main navigation'}>
          <a className="pill pill-glass" href="#work" data-testid="nav-work" onClick={(e) => { e.preventDefault(); scrollTo('work'); }}>{t.navWork}</a>
          <a className="pill pill-glass nav-hide" href="#approach" data-testid="nav-approach" onClick={(e) => { e.preventDefault(); scrollTo('approach'); }}>{t.navAbout}</a>
          <a className="pill pill-glass" href="#contact" data-testid="nav-contact" onClick={(e) => { e.preventDefault(); scrollTo('contact'); }}>{t.navContact}</a>
          <button className="pill pill-dark lang-btn" onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
            aria-label={lang === 'ru' ? 'Switch language to English' : 'Переключить язык на русский'} data-testid="button-language">
            {noMotion ? t.lang : <AnimatePresence mode="wait"><motion.span key={t.lang} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.25 }}>{t.lang}</motion.span></AnimatePresence>}
          </button>
        </nav>
      </header>

      <section className="hero" id="top" ref={heroRef}>
        <motion.div className="hero-card" style={{ scale: noMotion ? 1 : heroScale, borderRadius: noMotion ? 0 : heroRadius }}>
          <motion.div className="hero-label" initial={noMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: noMotion ? 0 : 0.5, duration: noMotion ? 0 : 0.8, ease: SOFT }}>
            <span className="dot" />{t.heroLabel}
          </motion.div>
          <h1 className="hero-word" aria-label="ALEKSEI">
          <motion.span style={{ x: noMotion ? 0 : leftX }} className="mask"><motion.span className="mask-in" initial={noMotion ? false : { y: '105%' }} animate={{ y: 0 }} transition={{ duration: noMotion ? 0 : 1.2, ease: SOFT, delay: noMotion ? 0 : 0.1 }}>ALEK</motion.span></motion.span>
            <motion.span className="hero-eyes" initial={noMotion ? false : { scale: 0, rotate: 90 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: noMotion ? 0 : undefined, type: 'spring', stiffness: 140, damping: 12, delay: noMotion ? 0 : 0.5 }}><Mark size={170} /></motion.span>
          <motion.span style={{ x: noMotion ? 0 : rightX }} className="mask"><motion.span className="mask-in" initial={noMotion ? false : { y: '105%' }} animate={{ y: 0 }} transition={{ duration: noMotion ? 0 : 1.2, ease: SOFT, delay: noMotion ? 0 : 0.22 }}>SEI</motion.span></motion.span>
          </h1>
          <motion.div className="hero-bottom" initial={noMotion ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: noMotion ? 0 : 0.8, duration: noMotion ? 0 : 1, ease: SOFT }}>
            <p className="hero-intro">{t.intro}</p>
            <button className="pill pill-dark scroll-cta" onClick={() => scrollTo('work')} data-testid="button-scroll">
              {t.scroll} <motion.span className="arrow" animate={noMotion ? undefined : { y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>↓</motion.span>
            </button>
          </motion.div>
        </motion.div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {Array.from({ length: 4 }).map((_, k) => (
            <span key={k}>{ticker.map((w, i) => <span key={i} className="tick-item">{w}<i className="tick-star" /></span>)}</span>
          ))}
        </div>
      </div>

      <section className="work-intro" id="work">
        <span className="kicker">01 / {t.workLabel}</span>
        <Rise><h2 className="mega">{t.workTitle}</h2></Rise>
        <Rise delay={0.15}><p className="note">{t.workNote}</p></Rise>
      </section>

      {work.map((p, i) => <ProjectChapter key={p.number} project={p} index={i} onHover={setCursor} viewLabel={t.view} />)}

      <section className="hotel" ref={hotelRef}>
        <div className="hotel-head">
          <span className="kicker">{t.hotelTag}</span>
          <Rise><h2 className="mega">{t.hotelTitle}</h2></Rise>
          <Rise delay={0.1}><p className="note">{t.hotelIntro}</p></Rise>
        </div>
      <HotelLens disabled={noMotion}>
          {[hA, hB, hC].map((y, i) => (
            <motion.figure key={i} className={`hotel-shot hs-${i}`} style={{ y: noMotion ? 0 : y }} data-testid={`img-hotel-${i + 1}`}
            >
              <img src={shots[i]} alt={altHotel[i]} loading="lazy" decoding="async" />
              <figcaption><span>{captions[i]}</span><span>0{i + 1} / 03</span></figcaption>
            </motion.figure>
          ))}
        </HotelLens>
        <div className="hotel-tags" aria-label={t.operations}>
          {[t.operations, t.roomsLine, t.expenses].map((s, i) => (
            <motion.span key={s} className="pill pill-outline" initial={noMotion ? false : { scale: 0 }} whileInView={noMotion ? undefined : { scale: 1 }} viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 260, damping: 15, delay: noMotion ? 0 : i * 0.08, duration: noMotion ? 0 : undefined }}>{s}</motion.span>
          ))}
        </div>
        <div id="hotel-operations" className="kicker hotel-line">{t.hotelLine}</div>
      </section>

      <section className="principle" id="approach">
        <span className="kicker">{t.approach}</span>
        <Rise><blockquote className="quote">{t.quote}</blockquote></Rise>
        <div className="principle-foot"><span>{t.quoteSmall}</span><span>{t.quoteNo}</span></div>
      </section>

      <section className="credential">
        <div className="credential-copy">
          <motion.div className="badge" aria-hidden="true" animate={noMotion ? undefined : { rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}>
            <svg viewBox="0 0 120 120"><defs><path id="c" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" /></defs>
              <text><textPath href="#c">CERTIFICATE · OF · COMPLETION · 1M · </textPath></text></svg>
            <b>1M</b>
          </motion.div>
          <Rise className="credential-text">
            <span className="kicker">{t.credentialKicker}</span>
            <h2>{t.credentialTitle}</h2>
            <p>{t.credentialDesc}</p>
            <span className="cred-note">{t.credentialNote}</span>
          </Rise>
        </div>
        <a className="certificate-art" href={certificateImage} target="_blank" rel="noreferrer"
          aria-label={`${t.certificateOpen}: ${t.certificateAlt}`} data-testid="link-certificate">
          <img src={certificateImage} alt={t.certificateAlt} loading="lazy" decoding="async" />
          <span className="certificate-open">{t.certificateOpen}<b aria-hidden="true">↗</b></span>
        </a>
      </section>

      <motion.footer
        className="contact"
        id="contact"
        initial={reduceMotion ? false : { clipPath: 'circle(8% at 50% 60%)' }}
        whileInView={noMotion ? undefined : { clipPath: 'circle(120% at 50% 60%)' }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: reduceMotion ? 0 : 1.1, ease: EASE }}
      >
        <span className="kicker">{t.contactKicker}</span>
        <h2 className="contact-head">{t.contactTitle}</h2>
        <div className="contact-row">
          <p className="contact-copy">{t.contactCopy}</p>
          <Magnetic>
            <a className="pill pill-blush contact-link" href="https://t.me/alexastin" target="_blank" rel="noreferrer" data-testid="link-contact-telegram"
              onPointerEnter={() => setCursor('t.me')} onPointerLeave={() => setCursor(null)}>
              {t.contactLink} <span className="arrow">↗</span>
            </a>
          </Magnetic>
        </div>
        <div className="footer">
          <span>{t.footer}</span>
          <a href="#top" data-testid="link-back-to-top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: noMotion ? 'instant' : 'smooth' }); }}>{t.top} ↑</a>
          <span>© ALEKSEI</span>
        </div>
      </motion.footer>
    </motion.main>
  );
}

function App() {
  const [lang, setLang] = useState<Lang>('ru');
  const [entered, setEntered] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [quietMotion, setQuietMotion] = useState(false);

  useEffect(() => {
    document.documentElement.lang = lang;
    const title = lang === 'ru' ? 'ALEKSEI — Портфолио цифровых продуктов' : 'ALEKSEI — Digital Product Portfolio';
    const description = lang === 'ru'
      ? 'Цифровые продукты ALEKSEI: Telegram-боты, интерактивные сервисы, веб-приложения и платформа SkyLodge.'
      : 'Digital products by ALEKSEI: Telegram bots, interactive services, web applications, and the SkyLodge platform.';
    document.title = title;
    const set = (sel: string) => { const el = document.querySelector<HTMLMetaElement>(sel); if (el) el.content = sel.includes('title') ? title : description; };
    set('meta[name="description"]'); set('meta[property="og:title"]'); set('meta[property="og:description"]');
  }, [lang]);

  useEffect(() => { document.body.style.overflow = entered ? '' : 'hidden'; }, [entered]);

  const enter = (quiet: boolean) => {
    setQuietMotion(quiet);
    document.documentElement.classList.toggle('quiet', quiet);
    setWiping(!quiet);
    window.scrollTo({ top: 0, behavior: quiet ? 'instant' : 'smooth' });
    setTimeout(() => setEntered(true), quiet ? 0 : 450);
  };

  return (
    <MotionDisabledContext.Provider value={quietMotion}>
      <div className="grain" aria-hidden="true" />
      {entered && <Main lang={lang} setLang={setLang} />}
      <AnimatePresence>
        {!entered && <Entry lang={lang} onEnter={enter} onLang={() => setLang(lang === 'ru' ? 'en' : 'ru')} />}
      </AnimatePresence>
      <AnimatePresence>
        {wiping && !entered && (
          <motion.div className="wipe" initial={{ y: '100%' }} animate={{ y: '0%' }} exit={{ y: '-100%' }} transition={{ duration: 0.5, ease: EASE }} aria-hidden="true">
            <span>ALEKSEI</span>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionDisabledContext.Provider>
  );
}

export default App;
