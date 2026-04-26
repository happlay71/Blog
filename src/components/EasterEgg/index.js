/**
 * EasterEgg 彩蛋组件
 *
 * 使用方式：在 src/pages/index.js 中引入并挂载
 *   import EasterEgg from '@site/src/components/EasterEgg';
 *   <EasterEgg onRegisterAvatarClick={(fn) => { avatarClickRef.current = fn; }} />
 *
 * 包含五个彩蛋：
 *   01 Konami Code   —— ↑↑↓↓←→←→BA（桌面）
 *   02 头像连点 ×5   —— 头像快速点击（桌面 + 手机）
 *   03 控制台彩蛋   —— 页面加载时输出 ASCII 艺术（桌面）
 *   04 暗语触发     —— 键盘连续输入 "happlay"（桌面）
 *   05 手机摇一摇   —— DeviceMotion 加速度检测（手机）
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './EasterEgg.module.css';
import BrowserOnly from '@docusaurus/BrowserOnly';

/* ── 今日语录数据 ── */
const QUOTES = [
  { text: '先让它跑起来，再让它优雅，最后让它快。', author: 'Kent Beck' },
  { text: '代码写给人读，顺便让机器执行。', author: 'Harold Abelson' },
  { text: '没有文档的代码，是你留给未来自己的陷阱。', author: '佚名程序员' },
  { text: '重构是最好的注释。', author: '老司机语录' },
  { text: '祝你今天不用 debug。', author: '开发者的祈祷' },
  { text: '一个 Bug 的背后，是一万种可能。', author: '经验之谈' },
  { text: '测试不是为了证明代码正确，而是为了找到它错在哪。', author: 'Dijkstra' },
  { text: 'LGTM！（但我根本没看）', author: '某次 Code Review' },
];

/* ── Konami 序列 ── */
const KONAMI = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65, 66, 65];

/* ── 生成五彩纸屑数据 ── */
const CONFETTI_COLORS = ['#00d2b4', '#5882ff', '#ff7b72', '#ffa657', '#d2a8ff', '#79c0ff', '#ff9100'];
function generateConfetti(count = 60) {
  return Array.from({ length: count }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 1.8}s`,
    animationDuration: `${2.2 + Math.random() * 1.8}s`,
    background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    width: `${6 + Math.random() * 6}px`,
    height: `${6 + Math.random() * 6}px`,
    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
    transform: `rotate(${Math.random() * 360}deg)`,
  }));
}

/* ── 主组件（内部实现，仅在浏览器端渲染） ── */
function EasterEggInner({ onRegisterAvatarClick }) {
  /* ── 状态 ── */
  const [confetti, setConfetti] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [achievement, setAchievement] = useState(null);   // { icon, label, text }
  const [banner, setBanner] = useState(null);              // string
  const [quote, setQuote] = useState(null);                // { text, author }

  /* ── 内部 ref ── */
  const konamiRef = useRef([]);
  const keyBufferRef = useRef('');
  const avatarClickRef = useRef({ count: 0, timer: null });
  const shakeRef = useRef({ lastTime: 0, lastX: null, lastY: null, lastZ: null });

  /* ── 工具：显示成就 toast ── */
  const showAchievement = useCallback((icon, label, text) => {
    setAchievement({ icon, label, text });
    setTimeout(() => setAchievement(null), 3800);
  }, []);

  /* ── 工具：触发五彩纸屑 ── */
  const triggerConfetti = useCallback(() => {
    setConfetti(generateConfetti(70));
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4500);
  }, []);

  /* ── 工具：显示横幅 ── */
  const showBanner = useCallback((text) => {
    setBanner(text);
    setTimeout(() => setBanner(null), 3500);
  }, []);

  /* ═══════════════════════════════════════
     彩蛋 01 — Konami Code（桌面端）
  ════════════════════════════════════════ */
  useEffect(() => {
    const handler = (e) => {
      konamiRef.current.push(e.keyCode);
      if (konamiRef.current.length > KONAMI.length) {
        konamiRef.current.shift();
      }
      if (JSON.stringify(konamiRef.current) === JSON.stringify(KONAMI)) {
        triggerConfetti();
        showAchievement('🏆', '成就解锁', 'Konami 秘籍达人！');
        konamiRef.current = [];
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [triggerConfetti, showAchievement]);

  /* ═══════════════════════════════════════
     彩蛋 02 — 头像连点 ×5（桌面 + 手机）
  ════════════════════════════════════════ */
  const handleAvatarClick = useCallback(() => {
    const state = avatarClickRef.current;
    state.count += 1;

    clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      state.count = 0;
    }, 2000);

    if (state.count >= 5) {
      state.count = 0;
      clearTimeout(state.timer);

      /* 让 canvas 旋转发光 */
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.classList.add(styles.avatarEgg);
        setTimeout(() => canvas.classList.remove(styles.avatarEgg), 2000);
      }
      showAchievement('✨', '隐藏彩蛋', '你找到了秘密入口！');
    }
  }, [showAchievement]);

  /* 把处理函数暴露给父组件（index.js 里的 canvas 注册用） */
  useEffect(() => {
    if (onRegisterAvatarClick) {
      onRegisterAvatarClick(handleAvatarClick);
    }
  }, [onRegisterAvatarClick, handleAvatarClick]);

  /* ═══════════════════════════════════════
     彩蛋 03 — 控制台彩蛋（桌面端）
  ════════════════════════════════════════ */
  useEffect(() => {
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) return;

    const art = `
%c
██╗  ██╗ █████╗ ██████╗ ██████╗ ██╗      █████╗ ██╗   ██╗
██║  ██║██╔══██╗██╔══██╗██╔══██╗██║     ██╔══██╗╚██╗ ██╔╝
███████║███████║██████╔╝██████╔╝██║     ███████║ ╚████╔╝ 
██╔══██║██╔══██║██╔═══╝ ██╔═══╝ ██║     ██╔══██║  ╚██╔╝  
██║  ██║██║  ██║██║     ██║     ███████╗██║  ██║   ██║   
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   

%c  Hi，Bro！你居然打开了控制台 👀
%c  这里是 happlay71 的知识录 — https://happlay71.top
%c  技术栈: Java · Spring Boot · Redis · Vue · React
%c  如果你也在学习后端，欢迎一起交流！GitHub: happlay71
`;
    console.log(
      art,
      'color: #00d2b4; font-family: monospace; font-size: 11px;',
      'color: #e6edf3; font-size: 14px; font-weight: bold;',
      'color: #8b949e; font-size: 12px;',
      'color: #79b8ff; font-size: 12px;',
      'color: #a5d6ff; font-size: 12px;',
    );
  }, []);

  /* ═══════════════════════════════════════
     彩蛋 04 — 键盘暗语 "happlay"（桌面端）
  ════════════════════════════════════════ */
  useEffect(() => {
    const SECRET = 'happlay';
    const handler = (e) => {
      /* 忽略 input / textarea 焦点时的输入 */
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      keyBufferRef.current += e.key.toLowerCase();
      if (keyBufferRef.current.length > SECRET.length) {
        keyBufferRef.current = keyBufferRef.current.slice(-SECRET.length);
      }
      if (keyBufferRef.current === SECRET) {
        keyBufferRef.current = '';
        showBanner('🎉 你发现了隐藏关键词！欢迎来到 happlay71 的世界！');
        showAchievement('🔑', '暗语达人', '你找到了秘密关键词！');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showBanner, showAchievement]);

  /* ═══════════════════════════════════════
     彩蛋 05 — 手机摇一摇（手机端）
  ════════════════════════════════════════ */
  useEffect(() => {
    const THRESHOLD = 18;
    const COOLDOWN = 3000;

    const handler = (e) => {
      const { x, y, z } = e.acceleration || {};
      if (x == null) return;

      const now = Date.now();
      const state = shakeRef.current;

      if (state.lastX !== null) {
        const delta = Math.abs(x - state.lastX) + Math.abs(y - state.lastY) + Math.abs(z - state.lastZ);
        if (delta > THRESHOLD && now - state.lastTime > COOLDOWN) {
          state.lastTime = now;
          const picked = QUOTES[Math.floor(Math.random() * QUOTES.length)];
          setQuote(picked);
        }
      }
      state.lastX = x; state.lastY = y; state.lastZ = z;
    };

    /* iOS 13+ 需要请求权限 */
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      /* 绑定到第一次用户交互 */
      const requestOnTouch = async () => {
        try {
          const permission = await DeviceMotionEvent.requestPermission();
          if (permission === 'granted') {
            window.addEventListener('devicemotion', handler);
          }
        } catch (_) {}
        document.removeEventListener('touchstart', requestOnTouch);
      };
      document.addEventListener('touchstart', requestOnTouch, { once: true });
    } else if (typeof window.DeviceMotionEvent !== 'undefined') {
      window.addEventListener('devicemotion', handler);
    }

    return () => window.removeEventListener('devicemotion', handler);
  }, []);

  /* ── 渲染 ── */
  return (
    <>
      {/* 五彩纸屑层 */}
      {showConfetti && (
        <div className={styles.confettiOverlay} aria-hidden="true">
          {confetti.map((style, i) => (
            <span key={i} className={styles.confettiPiece} style={style} />
          ))}
        </div>
      )}

      {/* 成就 Toast */}
      {achievement && (
        <div className={styles.achievementToast} role="alert">
          <span className={styles.achievementIcon}>{achievement.icon}</span>
          <div className={styles.achievementBody}>
            <div className={styles.achievementLabel}>{achievement.label}</div>
            <div className={styles.achievementText}>{achievement.text}</div>
          </div>
        </div>
      )}

      {/* 顶部横幅 */}
      {banner && (
        <div className={styles.topBanner} role="status">
          <span>{banner}</span>
          <button className={styles.bannerClose} onClick={() => setBanner(null)} aria-label="关闭">✕</button>
        </div>
      )}

      {/* 语录弹窗（摇一摇） */}
      {quote && (
        <div className={styles.quoteOverlay} role="dialog" aria-modal="true" onClick={() => setQuote(null)}>
          <div className={styles.quoteCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.quoteEmoji}>📱</div>
            <div className={styles.quoteLabel}>今日开发者语录</div>
            <blockquote className={styles.quoteText}>"{quote.text}"</blockquote>
            <div className={styles.quoteAuthor}>— {quote.author}</div>
            <button className={styles.quoteClose} onClick={() => setQuote(null)}>收下了</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── 导出（用 BrowserOnly 包裹，避免 SSR 报错） ── */
export default function EasterEgg(props) {
  return (
    <BrowserOnly>
      {() => <EasterEggInner {...props} />}
    </BrowserOnly>
  );
}