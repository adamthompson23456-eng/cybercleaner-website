import React, { useState, useEffect, useRef, useCallback } from "react";

// ---- Animated particle-network background (canvas) -------------------
function ParticleField() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let raf, w, h, dots = [];
    const mouse = { x: -999, y: -999 };
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * DPR; canvas.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const count = Math.min(90, Math.floor((w * h) / 16000));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      }));
    }
    function step() {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
      }
      for (let i = 0; i < dots.length; i++) {
        const a = dots[i];
        for (let j = i + 1; j < dots.length; j++) {
          const b = dots[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 130) {
            ctx.strokeStyle = `rgba(0,229,199,${0.12 * (1 - dist / 130)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (md < 180) {
          ctx.strokeStyle = `rgba(27,152,224,${0.22 * (1 - md / 180)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = "rgba(0,229,199,0.55)";
        ctx.beginPath(); ctx.arc(a.x, a.y, 1.6, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(step);
    }
    function onMove(e) { mouse.x = e.clientX; mouse.y = e.clientY; }
    function onLeave() { mouse.x = -999; mouse.y = -999; }
    resize(); step();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
    };
  }, []);
  return <canvas ref={ref} className="particles" aria-hidden="true" />;
}

// ---- Rotating 3D wireframe globe (canvas) ---------------------------
function Globe() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let raf, size, R, cx, cy, rot = 0;
    let vel = 0.0045, targetVel = 0.0045, dragging = false, lastX = 0;

    // build a sphere of points (lat/long grid)
    const pts = [];
    const LAT = 14, LON = 24;
    for (let i = 0; i <= LAT; i++) {
      const phi = (Math.PI * i) / LAT - Math.PI / 2;
      for (let j = 0; j < LON; j++) {
        const th = (2 * Math.PI * j) / LON;
        pts.push({ x: Math.cos(phi) * Math.cos(th), y: Math.sin(phi), z: Math.cos(phi) * Math.sin(th), lat: i, lon: j });
      }
    }
    const idx = (i, j) => i * LON + (j % LON);

    function resize() {
      size = Math.min(canvas.clientWidth, canvas.clientHeight);
      canvas.width = canvas.clientWidth * DPR; canvas.height = canvas.clientHeight * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      R = size * 0.38; cx = canvas.clientWidth / 2; cy = canvas.clientHeight / 2;
    }
    function project(p) {
      const cosR = Math.cos(rot), sinR = Math.sin(rot);
      const x = p.x * cosR - p.z * sinR;
      const z = p.x * sinR + p.z * cosR;
      const tilt = -0.42;
      const y = p.y * Math.cos(tilt) - z * Math.sin(tilt);
      const z2 = p.y * Math.sin(tilt) + z * Math.cos(tilt);
      const persp = 1.6 / (1.6 + z2);
      return { sx: cx + x * R * persp, sy: cy + y * R * persp, depth: z2 };
    }
    function step() {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      const pr = pts.map(project);
      // longitude + latitude lines
      ctx.lineWidth = 1;
      for (let i = 0; i <= LAT; i++) {
        for (let j = 0; j < LON; j++) {
          const a = pr[idx(i, j)], b = pr[idx(i, j + 1)];
          const alpha = 0.10 + 0.16 * ((a.depth + 1) / 2);
          ctx.strokeStyle = `rgba(0,229,199,${alpha})`;
          ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
          if (i < LAT) {
            const c = pr[idx(i + 1, j)];
            ctx.strokeStyle = `rgba(27,152,224,${alpha * 0.8})`;
            ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(c.sx, c.sy); ctx.stroke();
          }
        }
      }
      // glowing nodes (front hemisphere brighter)
      for (const p of pr) {
        if (p.depth < -0.1) continue;
        const a = 0.25 + 0.6 * ((p.depth + 1) / 2);
        ctx.fillStyle = `rgba(120,245,225,${a})`;
        ctx.beginPath(); ctx.arc(p.sx, p.sy, 1.4, 0, Math.PI * 2); ctx.fill();
      }
      if (!dragging) { vel += (targetVel - vel) * 0.05; rot += vel; }
      raf = requestAnimationFrame(step);
    }
    function down(e) { dragging = true; lastX = (e.touches ? e.touches[0].clientX : e.clientX); canvas.style.cursor = "grabbing"; }
    function move(e) {
      if (!dragging) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      rot += (x - lastX) * 0.006; lastX = x;
    }
    function up() { dragging = false; canvas.style.cursor = "grab"; }
    function enter() { targetVel = 0.013; }
    function leave() { targetVel = 0.0045; }

    resize(); step();
    canvas.style.cursor = "grab";
    canvas.style.pointerEvents = "auto";
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    canvas.addEventListener("mouseenter", enter);
    canvas.addEventListener("mouseleave", leave);
    canvas.addEventListener("touchstart", down, { passive: true });
    canvas.addEventListener("touchmove", move, { passive: true });
    canvas.addEventListener("touchend", up);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", down);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      canvas.removeEventListener("mouseenter", enter);
      canvas.removeEventListener("mouseleave", leave);
      canvas.removeEventListener("touchstart", down);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", up);
    };
  }, []);
  return <canvas ref={ref} className="globe" aria-hidden="true" />;
}

// ---- Animated count-up ----------------------------------------------
function Counter({ to, suffix = "", duration = 1400 }) {
  const ref = useRef(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(el);
        const t0 = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(eased * to));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ---- Scroll progress bar --------------------------------------------
function ScrollProgress() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setW(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  return <div className="scroll-progress"><div style={{ width: w + "%" }} /></div>;
}

// ---- Trusted-by marquee ---------------------------------------------
const trusted = [
  "🪟 Windows 10 & 11", "🛡️ Microsoft Defender", "🦠 Microsoft MRT",
  "🔐 BitLocker", "⚙️ WMI / CIM", "🌐 Native VPN", "🤖 Claude AI", "🔄 Auto-Update",
];
function Marquee() {
  return (
    <div className="marquee" aria-label="Works with">
      <div className="marquee-label">WORKS WITH &amp; BUILT ON</div>
      <div className="marquee-track">
        {[...trusted, ...trusted].map((t, i) => (
          <span className="marquee-item" key={i}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ---- 3D tilt on mouse move ------------------------------------------
function useTilt(max = 12) {
  const ref = useRef(null);
  const onMove = useCallback((e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const rx = (e.clientX - r.left) / r.width;
    const ry = (e.clientY - r.top) / r.height;
    const px = rx - 0.5, py = ry - 0.5;
    el.style.transform = `perspective(900px) rotateX(${-py * max}deg) rotateY(${px * max}deg) translateZ(0)`;
    el.style.setProperty("--mx", `${rx * 100}%`);
    el.style.setProperty("--my", `${ry * 100}%`);
  }, [max]);
  const onLeave = useCallback(() => {
    const el = ref.current; if (el) el.style.transform = "perspective(900px) rotateX(0) rotateY(0)";
  }, []);
  return { ref, onMouseMove: onMove, onMouseLeave: onLeave };
}

// ---- Scroll reveal ---------------------------------------------------
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ---- Download config -------------------------------------------------
// This is the SAME file the app's auto-updater pulls. Replace this one
// line to point the website + auto-update at a new build.
const DOWNLOAD_URL = "https://raw.githubusercontent.com/adamthompson23456-eng/CybercleanerPro/main/CyberCleanerPro_AI_Pro.exe";
const APP_VERSION = "2026.4";
// ---------------------------------------------------------------------

const features = [
  { icon: "🛡️", title: "AI Security Scan", desc: "Quick, Full & Deep scans powered by real Windows Defender + Microsoft MRT malware removal — no fake results, ever." },
  { icon: "🩺", title: "System Health", desc: "One-click fixes for the issues quietly slowing the PC down — drivers, startup bloat, broken settings." },
  { icon: "🧹", title: "Deep Cleaner", desc: "Reclaim gigabytes of junk, cache and leftovers. A faster, lighter machine in minutes." },
  { icon: "🚀", title: "Next-Gen 2026", desc: "Modern threat defenses tuned for today's attacks, kept current automatically." },
  { icon: "🌐", title: "VPN & Anti-Track", desc: "Windows-native VPN management and tracker blocking to keep browsing private." },
  { icon: "💬", title: "AI Assistant", desc: "A built-in AI helper answers security questions and guides every fix in plain English." },
];

const steps = [
  { n: "1", title: "Install in seconds", desc: "One lightweight app replaces five subscriptions. No clutter, no bloat." },
  { n: "2", title: "Scan & protect", desc: "CyberCleaner runs real checks and shows your live AI Protection Score." },
  { n: "3", title: "Stay protected", desc: "It self-updates and self-heals — always current with zero effort." },
];

// ---- Checkout links --------------------------------------------------
// Paste the Lemon Squeezy / Paddle checkout URL for each plan here.
// Until you do, buttons fall back to the contact section so no sale is lost.
const CHECKOUT = {
  oneYear: "",   // e.g. "https://cybercleanerpro.lemonsqueezy.com/buy/xxxx-1yr"
  threeYear: "", // e.g. "https://cybercleanerpro.lemonsqueezy.com/buy/xxxx-3yr"
  lifetime: "",  // e.g. "https://cybercleanerpro.lemonsqueezy.com/buy/xxxx-life"
};
const buyHref = (key) => CHECKOUT[key] || "#contact";

const plans = [
  { name: "1-Year", tag: "Starter", price: "$19", per: "/year", buy: "oneYear",
    features: ["All security modules", "AI scans + MRT", "Auto-updates", "Email support"], highlight: false },
  { name: "3-Year", tag: "Best Value", price: "$39", per: "/3 years", buy: "threeYear",
    features: ["Everything in 1-Year", "Priority support", "Multi-device ready", "Save vs. annual"], highlight: true },
  { name: "Lifetime", tag: "Forever", price: "$59", per: "one-time", buy: "lifetime",
    features: ["Everything, forever", "All future updates", "Premium support", "Pay once, own it"], highlight: false },
];

const stats = [
  { count: 15, suffix: "+", label: "Integrated modules" },
  { count: 100, suffix: "%", label: "Real Windows queries" },
  { num: "1-Click", label: "Self-updating" },
  { num: "24/7", label: "Live protection" },
];

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a href="#top" className="brand">
          <span className="brand-mark">🛡️</span>
          <span>CyberCleaner<span className="brand-pro"> Pro</span></span>
        </a>
        <nav className={"nav-links" + (open ? " open" : "")}>
          <a href="#features" onClick={() => setOpen(false)}>Features</a>
          <a href="#how" onClick={() => setOpen(false)}>How it works</a>
          <a href="#pricing" onClick={() => setOpen(false)}>Pricing</a>
          <a href="#download" onClick={() => setOpen(false)}>Download</a>
          <a href="#contact" onClick={() => setOpen(false)}>Contact</a>
          <a href={DOWNLOAD_URL} className="btn btn-sm" onClick={() => setOpen(false)}>⬇ Download</a>
        </nav>
        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
      </div>
    </header>
  );
}

function Hero() {
  const [score, setScore] = useState(0);
  useEffect(() => {
    let v = 0;
    const t = setInterval(() => {
      v += 2;
      if (v >= 98) { v = 98; clearInterval(t); }
      setScore(v);
    }, 18);
    return () => clearInterval(t);
  }, []);
  const r = 70, c = 2 * Math.PI * r;
  const tilt = useTilt(10);
  return (
    <section className="hero" id="top">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="chip">⚡ AI-Powered · Windows 10 & 11</span>
          <h1>Premium PC security,<br /><span className="grad">in one smart app.</span></h1>
          <p className="lead">
            CyberCleaner Pro protects, cleans, and speeds up any Windows PC —
            with real-time AI scanning and a technician always within reach.
            The whole security stack, finally in one place.
          </p>
          <div className="hero-cta">
            <a href={DOWNLOAD_URL} className="btn btn-lg">⬇ Download for Windows</a>
            <a href="#features" className="btn btn-ghost btn-lg">See features</a>
          </div>
          <div className="hero-trust">
            <span className="dl-meta">Version {APP_VERSION} · Windows 10 & 11 · Free trial</span>
            <span className="dl-auto">🔄 Auto-updates from us — always the latest, like Norton</span>
          </div>
        </div>
        <div className="hero-visual">
          <Globe />
          <div className="score-glow" />
          <div className="score-card" {...tilt}>
            <div className="score-ring">
              <svg viewBox="0 0 160 160">
                <circle cx="80" cy="80" r={r} className="ring-bg" />
                <circle cx="80" cy="80" r={r} className="ring-fg"
                  strokeDasharray={c} strokeDashoffset={c - (c * score) / 100}
                  transform="rotate(-90 80 80)" />
              </svg>
              <div className="score-num">{score}<small>%</small></div>
            </div>
            <div className="score-label">AI Protection Score</div>
            <div className="score-rows">
              <div className="srow"><span>🛡️ Real-time defense</span><b className="ok">Active</b></div>
              <div className="srow"><span>🦠 Threats found</span><b className="ok">0</b></div>
              <div className="srow"><span>🧹 Junk cleaned</span><b>4.2 GB</b></div>
              <div className="srow"><span>⬇️ Up to date</span><b className="ok">v2026.4</b></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="stats">
      <div className="container stats-grid">
        {stats.map((s, i) => (
          <div key={s.label} className="stat" data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
            <div className="stat-num">
              {s.count != null ? <Counter to={s.count} suffix={s.suffix} /> : s.num}
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeatCard({ f, i }) {
  const tilt = useTilt(9);
  return (
    <div className="feat-card" data-reveal style={{ transitionDelay: `${i * 70}ms` }} {...tilt}>
      <div className="feat-icon">{f.icon}</div>
      <h3>{f.title}</h3>
      <p>{f.desc}</p>
    </div>
  );
}

function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-head" data-reveal>
          <span className="kicker">EVERYTHING IN ONE</span>
          <h2>One app instead of five subscriptions</h2>
          <p>Antivirus, cleaner, VPN, driver updater and an AI assistant — unified, lightweight, and honest about what it does.</p>
        </div>
        <div className="feat-grid">
          {features.map((f, i) => <FeatCard key={f.title} f={f} i={i} />)}
        </div>
      </div>
    </section>
  );
}

function How() {
  return (
    <section className="section how" id="how">
      <div className="container">
        <div className="section-head" data-reveal>
          <span className="kicker">HOW IT WORKS</span>
          <h2>Protected in three steps</h2>
        </div>
        <div className="steps">
          {steps.map((s, i) => (
            <div key={s.n} className="step" data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
              <div className="step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {i < steps.length - 1 && <div className="step-arrow">→</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="section" id="pricing">
      <div className="container">
        <div className="section-head" data-reveal>
          <span className="kicker">PLANS</span>
          <h2>Simple, honest pricing</h2>
          <p>One product, every feature, no hidden upsells or surprise renewals. Secure checkout in USD.</p>
        </div>
        <div className="price-grid">
          {plans.map((p, i) => (
            <div key={p.name} data-reveal style={{ transitionDelay: `${i * 90}ms` }} className={"price-card" + (p.highlight ? " featured" : "")}>
              {p.highlight && <div className="price-flag">Most popular</div>}
              <div className="price-tag">{p.tag}</div>
              <h3>{p.name}</h3>
              <div className="price-amt"><span className="price-big">{p.price}</span> <span className="price-per">{p.per}</span></div>
              <ul>
                {p.features.map((f) => <li key={f}>✓ {f}</li>)}
              </ul>
              <a href={buyHref(p.buy)} className={"btn" + (p.highlight ? "" : " btn-ghost")}>Buy {p.name}</a>
            </div>
          ))}
        </div>
        <div className="guarantee" data-reveal>
          <span className="guarantee-badge">🛡️ 30-Day Money-Back Guarantee</span>
          <span>Not happy? Email us within 30 days for a full refund — no questions asked. Secure payment &amp; instant key delivery.</span>
        </div>
      </div>
    </section>
  );
}

function Download() {
  return (
    <section className="section download" id="download">
      <div className="container">
        <div className="download-card" data-reveal>
          <div className="download-left">
            <span className="kicker">GET STARTED</span>
            <h2>Download CyberCleaner Pro</h2>
            <p>One small installer for Windows 10 & 11. Install once — then it keeps itself
            up to date automatically, straight from us. No reinstalls, no hassle.</p>
            <div className="download-actions">
              <a href={DOWNLOAD_URL} className="btn btn-lg">⬇ Download for Windows</a>
              <span className="download-meta">v{APP_VERSION} · Free trial included</span>
            </div>
            <ul className="download-points">
              <li>🔄 Automatic updates pushed from our servers</li>
              <li>🔒 Secure install with built-in safety rollback</li>
              <li>🛡️ Real-time protection from first launch</li>
            </ul>
          </div>
          <div className="install-strip">
            <div className="install-step">
              <span className="install-n">1</span>
              <div><b>Download &amp; open</b><p>Run the installer you just downloaded.</p></div>
            </div>
            <div className="install-step">
              <span className="install-n">2</span>
              <div><b>If Windows warns</b><p>Click <em>More info → Run anyway</em>. It's safe — just a new app.</p></div>
            </div>
            <div className="install-step">
              <span className="install-n">3</span>
              <div><b>You're protected</b><p>It activates and keeps itself updated automatically.</p></div>
            </div>
          </div>
          <div className="download-right">
            <div className="dl-badge">
              <div className="dl-badge-os">⊞ Windows</div>
              <div className="dl-badge-name">CyberCleaner Pro</div>
              <div className="dl-badge-ver">Version {APP_VERSION}</div>
              <div className="dl-badge-bar"><span /></div>
              <div className="dl-badge-foot">Always up to date</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="section cta" id="contact">
      <div className="container cta-inner" data-reveal>
        <h2>Ready to lock down your PC?</h2>
        <p>Talk to us about CyberCleaner Pro for your home, business, or repair shop.</p>
        <div className="cta-actions">
          <a href={DOWNLOAD_URL} className="btn btn-lg">⬇ Download now</a>
          <a href="tel:7866029045" className="btn btn-ghost btn-lg">📞 (786) 602-9045</a>
        </div>
        <div className="cta-sub">1-800-CLEANUP · Windows 10 & 11</div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="brand">
          <span className="brand-mark">🛡️</span>
          <span>CyberCleaner<span className="brand-pro"> Pro</span></span>
        </div>
        <div className="footer-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#/privacy">Privacy</a>
          <a href="#/terms">Terms</a>
          <a href="#/refund">Refund</a>
          <a href="#/eula">EULA</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="footer-copy">© {new Date().getFullYear()} CyberCleaner Pro · All rights reserved</div>
      </div>
    </footer>
  );
}

// ---- Trust bar (all factual claims) ---------------------------------
const trustItems = [
  ["🔒", "Secure checkout", "Encrypted payment, instant license delivery"],
  ["↩️", "30-day refund", "Full money-back guarantee, no questions"],
  ["🚫", "No auto-renew traps", "You're never charged by surprise"],
  ["✅", "Real results only", "Every scan uses genuine Windows queries"],
  ["📞", "US support line", "(786) 602-9045 · 1-800-CLEANUP"],
];
function TrustBar() {
  return (
    <section className="trustbar">
      <div className="container trustbar-grid">
        {trustItems.map((t) => (
          <div className="trust-item" key={t[1]} data-reveal>
            <span className="trust-ico">{t[0]}</span>
            <div><b>{t[1]}</b><p>{t[2]}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---- Reviews: add REAL customer reviews here as you collect them. -----
// Leave empty to hide the section — never ship fake testimonials.
const reviews = [
  // { name: "Jane D., Texas", stars: 5, text: "Cleaned up my laptop in minutes." },
];
function Reviews() {
  if (!reviews.length) return null;
  return (
    <section className="section reviews" id="reviews">
      <div className="container">
        <div className="section-head" data-reveal>
          <span className="kicker">CUSTOMERS</span>
          <h2>What people say</h2>
        </div>
        <div className="review-grid">
          {reviews.map((r, i) => (
            <div className="review-card" data-reveal key={i}>
              <div className="review-stars">{"★".repeat(r.stars)}</div>
              <p>“{r.text}”</p>
              <div className="review-name">{r.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Legal pages -----------------------------------------------------
const COMPANY = "CyberCleaner Pro";
const CONTACT_EMAIL = "adamthompson23456@gmail.com";
const today = "2026";
const LEGAL = {
  privacy: {
    title: "Privacy Policy",
    body: [
      ["What we collect", `When you activate ${COMPANY}, the app stores the name and email you enter and a non-personal machine identifier, license plan, app version, and trial/paid status. This is used to deliver your license, provide support, and improve the product.`],
      ["How we use it", `We use your information to activate and manage your license, send important product and security updates, and respond to support requests. We do not sell your personal information.`],
      ["Telemetry", `The app reports basic install data (machine ID, plan, version) to our servers so we can support you and push updates. It does not collect the contents of your files.`],
      ["Payments", `Purchases are processed by our payment provider (Merchant of Record). Your card details are handled by them and are never stored by us.`],
      ["Your rights", `You may request access to or deletion of your data at any time by emailing ${CONTACT_EMAIL}.`],
      ["Contact", `Questions about privacy? Email ${CONTACT_EMAIL} or call (786) 602-9045.`],
    ],
  },
  terms: {
    title: "Terms of Service",
    body: [
      ["Agreement", `By downloading, installing, or using ${COMPANY}, you agree to these Terms. If you do not agree, do not use the software.`],
      ["License", `We grant you a personal, non-transferable license to use ${COMPANY} on the number of devices covered by your plan, for the plan's duration. You may not resell, redistribute, or reverse-engineer the software without written permission.`],
      ["Acceptable use", `You agree to use ${COMPANY} only on computers you own or are authorized to manage, and in compliance with all applicable laws.`],
      ["Disclaimers", `${COMPANY} is provided "as is." While it uses genuine Windows security tools, no security product can guarantee a system is 100% safe. We are not liable for data loss; always keep backups.`],
      ["Changes", `We may update the software and these Terms over time. Continued use after changes means you accept the updated Terms.`],
      ["Contact", `Questions? Email ${CONTACT_EMAIL}.`],
    ],
  },
  refund: {
    title: "Refund Policy",
    body: [
      ["30-day money-back guarantee", `If you're not satisfied with ${COMPANY}, contact us within 30 days of purchase for a full refund — no questions asked.`],
      ["How to request", `Email ${CONTACT_EMAIL} from the address you used to purchase, with your order/license details. Refunds are issued to the original payment method, typically within 5–10 business days.`],
      ["After 30 days", `Purchases are generally non-refundable after 30 days, except where required by law.`],
      ["Lifetime plans", `Lifetime licenses are covered by the same 30-day guarantee.`],
    ],
  },
  eula: {
    title: "End User License Agreement (EULA)",
    body: [
      ["License grant", `Subject to your payment and these terms, ${COMPANY} grants you a limited, revocable, non-exclusive, non-transferable license to install and use the software for personal or internal business use on devices covered by your plan.`],
      ["Restrictions", `You may not copy (except for backup), modify, distribute, sublicense, rent, or reverse-engineer the software. Each license key is bound to your machine(s) and may be revoked if these terms are violated.`],
      ["Updates", `The software may automatically download and install updates to keep you protected. By using it, you consent to these updates.`],
      ["Termination", `This license ends if you breach these terms. On termination you must stop using and remove the software.`],
      ["Warranty & liability", `The software is provided without warranty of any kind. To the maximum extent permitted by law, ${COMPANY} is not liable for indirect or consequential damages.`],
      ["Contact", `For licensing questions, email ${CONTACT_EMAIL}.`],
    ],
  },
};
function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const m = hash.match(/^#\/(privacy|terms|refund|eula)/);
  return m ? m[1] : null;
}
function LegalPage({ page }) {
  const data = LEGAL[page];
  useEffect(() => { window.scrollTo(0, 0); }, [page]);
  return (
    <div className="legal-wrap">
      <header className="nav">
        <div className="container nav-inner">
          <a href="#/" className="brand" onClick={() => { window.location.hash = ""; }}>
            <span className="brand-mark">🛡️</span>
            <span>CyberCleaner<span className="brand-pro"> Pro</span></span>
          </a>
          <a href="#/" className="btn btn-sm" onClick={() => { window.location.hash = ""; }}>← Back to site</a>
        </div>
      </header>
      <div className="container legal">
        <h1>{data.title}</h1>
        <p className="legal-updated">Last updated: {today}</p>
        {data.body.map((sec) => (
          <section key={sec[0]}>
            <h2>{sec[0]}</h2>
            <p>{sec[1]}</p>
          </section>
        ))}
        <p className="legal-note">{COMPANY} · {CONTACT_EMAIL} · (786) 602-9045</p>
      </div>
    </div>
  );
}

export default function App() {
  const route = useHashRoute();
  useReveal();
  if (route) return <LegalPage page={route} />;
  return (
    <>
      <ParticleField />
      <ScrollProgress />
      <Nav />
      <Hero />
      <Marquee />
      <Stats />
      <Features />
      <How />
      <Reviews />
      <Pricing />
      <TrustBar />
      <Download />
      <CTA />
      <Footer />
    </>
  );
}
