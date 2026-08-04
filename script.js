// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

// Toggle via a class, never inline styles — an inline display:none would
// outrank the stylesheet and wipe the desktop nav out permanently.
hamburger?.addEventListener('click', () => {
    navLinks.classList.toggle('is-open');
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
            navLinks?.classList.remove('is-open'); // close the mobile drawer
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe portfolio items and service cards
document.querySelectorAll('.portfolio-item, .service-card, .project').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});

// Add active state to navigation on scroll
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 60) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// ---------------------------------------------------------------------------
// Showreel: 3D cylinder carousel
// Cards ride a vertical circular track, tilting toward the cursor with inertia.
// ---------------------------------------------------------------------------
(() => {
    const space = document.getElementById('reelSpace');
    if (!space) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Each card is one of the four Portfolio folders; clicking opens it below.
    const SLIDES = [
        { folder: 'ai-generate',   img: 'assets/ai-generate/p1-generate-ai.jpg',        title: 'AI Generate',        cat: 'AI WORKFLOWS',        meta: '4 dự án' },
        { folder: 'lighting',      img: 'assets/lighting/talkshow-setup.jpg',           title: 'Lighting & Context', cat: 'PHOTO / VIDEO SET UP', meta: '50 ảnh · 9 video' },
        { folder: 'video-creator', img: 'assets/video-creator/colorgrading/after.jpg',  title: 'Video Creator',      cat: 'EDIT / MOTION / GRADE', meta: '22 video' },
        { folder: 'visual-design', img: 'assets/visual-design/poster/02.jpg',           title: 'Visual Design',      cat: 'POSTER / PRINTING',   meta: '6 thiết kế' }
    ];

    const CARD_COUNT = SLIDES.length;
    const THICKNESS = [-1.47, -0.73, 0, 0.73, 1.47];
    const D = 1350;          // must match the stage's CSS perspective
    const GAP = 36;
    const PEEK = -55;        // push edge past the boundary so cards hide gracefully
    const FADE_FROM = 1.55;  // start dissolving here…
    const FADE_TO = 1.9;     // …fully gone before the wrap at CARD_COUNT / 2
    // Seconds for one card to travel to the next. Time-based, not per-frame,
    // so a 60Hz laptop and a 165Hz monitor run at the same pace.
    const SECONDS_PER_CARD = 3;
    const RATE_PER_SEC = 1 / SECONDS_PER_CARD;
    const SPIN_SECONDS = 1.2; // hover → target, regardless of distance

    // --- build DOM -----------------------------------------------------------
    const cards = SLIDES.map((slide, i) => {
        const card = document.createElement('div');
        card.className = 'reel-card';

        card.innerHTML = THICKNESS.map((z, layer) => {
            const isFront = layer === THICKNESS.length - 1;
            const isBack = layer === 0;

            if (!isFront && !isBack) {
                return `<div class="reel-slice reel-slice--mid" style="transform:translateZ(${z}px)"></div>`;
            }

            if (isFront) {
                return `
                    <div class="reel-slice reel-slice--front" style="transform:translateZ(${z}px)">
                        <img src="${slide.img}" alt="${slide.title}" loading="lazy">
                        <div class="reel-face">
                            <div class="reel-title">${slide.title}</div>
                        </div>
                    </div>`;
            }

            return `
                <div class="reel-slice reel-slice--back" style="transform:translateZ(${z}px) rotateX(180deg)">
                    <div class="reel-blur"><img src="${slide.img}" alt="" loading="lazy"></div>
                    <div class="reel-stripe"></div>
                    <div class="reel-meta">
                        <div class="reel-meta-name">${slide.title.toUpperCase()}</div>
                        <div class="reel-meta-sub">
                            <span>${slide.cat}</span><span class="dim">•</span><span>${slide.meta}</span>
                        </div>
                    </div>
                </div>`;
        }).join('');

        card.dataset.folder = slide.folder;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Mở thư mục ${slide.title}`);

        space.appendChild(card);
        return card;
    });

    // ---- Folder list, wired to the carousel --------------------------------
    // The list is an index of the same four folders: whichever card is centred
    // lights up, and hovering a row spins the carousel to that card.
    const rows = document.getElementById('reelRows');
    const list = document.getElementById('reelList');
    const rowEls = [];

    if (rows) {
        SLIDES.forEach((slide, i) => {
            const row = document.createElement('button');
            row.type = 'button';
            row.className = 'reel-row';
            row.innerHTML =
                `<div class="reel-row-slide">
                    <span>${slide.title.toUpperCase()}</span>
                    <span aria-hidden="true">${slide.title.toUpperCase()}</span>
                </div>`;

            row.addEventListener('mouseenter', () => spinTo(i));
            row.addEventListener('focus', () => spinTo(i));
            row.addEventListener('click', () => openFolder(slide.folder));

            rows.appendChild(row);
            rowEls.push(row);
        });

        list.addEventListener('mouseleave', () => { pinned = null; spin = null; });
        rows.addEventListener('focusout', e => {
            if (!rows.contains(e.relatedTarget)) { pinned = null; spin = null; }
        });
    }

    // Clicking a card opens its Portfolio folder and scrolls there.
    const openFolder = (folder) => {
        const group = document.querySelector(`.pf-group[data-folder="${folder}"]`);
        if (!group) return;

        if (!group.classList.contains('open')) {
            group.querySelector('.pf-toggle').click();
        }
        // Let the expand transition start before measuring the scroll target.
        requestAnimationFrame(() => {
            group.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };

    cards.forEach(card => {
        card.addEventListener('click', () => openFolder(card.dataset.folder));
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openFolder(card.dataset.folder);
            }
        });
    });

    // --- responsive sizing ---------------------------------------------------
    let cardW = 336;
    let cardH = 211;

    const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const heightFactor = Math.min(1, Math.max(0.65, h / 850));
        cardW = Math.min(336, Math.max(150, Math.round((w * 0.16 + 130) * heightFactor)));
        cardH = Math.round(cardW / 1.5925); // standard card ratio

        space.style.width = `${cardW}px`;
        space.style.height = `${cardH}px`;
        cards.forEach(c => {
            c.style.width = `${cardW}px`;
            c.style.height = `${cardH}px`;
        });
    };
    resize();
    window.addEventListener('resize', resize);

    // --- cursor parallax with inertia ---------------------------------------
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    window.addEventListener('mousemove', e => {
        mouse.tx = Math.max(-1, Math.min(1, (e.clientX - innerWidth / 2) / (innerWidth / 2)));
        mouse.ty = Math.max(-1, Math.min(1, (e.clientY - innerHeight / 2) / (innerHeight / 2)));
    });
    document.addEventListener('mouseleave', () => { mouse.tx = 0; mouse.ty = 0; });

    // --- render loop ---------------------------------------------------------
    const smoothstep = t => t * t * (3 - 2 * t);

    let progress = 0;
    let running = true;
    let frame = 0;

    // Hold the carousel still while the cursor is over it, so the card you
    // aim at is the card you click.
    let speed = 1;
    let motion = 1;
    const stage = document.querySelector('.reel-stage');
    stage.addEventListener('mouseenter', () => { speed = 0; });
    stage.addEventListener('mouseleave', () => { speed = 1; });

    // Hovering a row parks the carousel on that card. The trip takes a fixed
    // SPIN_SECONDS however far it has to go, so the list always answers at the
    // same speed — unlike the idle drift, which is paced per card.
    let pinned = null;
    let spin = null;

    const spinTo = (i) => {
        // Travel whichever way round the loop is shorter.
        let t = i;
        while (t - progress > CARD_COUNT / 2) t -= CARD_COUNT;
        while (progress - t > CARD_COUNT / 2) t += CARD_COUNT;
        if (pinned === t) return;
        pinned = t;
        spin = { from: progress, to: t, t0: performance.now() };
    };

    // Ease-out then ease-in: leaves fast, eases through the middle, and picks
    // speed back up into the landing.
    const easeOutIn = k => (k < 0.5
        ? 0.5 * (1 - Math.pow(1 - 2 * k, 3))
        : 0.5 + 0.5 * Math.pow(2 * k - 1, 3));

    let litIndex = -1;
    const light = (i) => {
        if (i === litIndex) return;
        litIndex = i;
        rowEls.forEach((r, j) => r.classList.toggle('is-on', j === i));
    };

    // Pause the loop while the section is off-screen — no point burning frames.
    new IntersectionObserver(([entry]) => { running = entry.isIntersecting; },
        { threshold: 0 }).observe(document.querySelector('.showreel'));

    let lastT = 0;

    const tick = (now) => {
        frame = requestAnimationFrame(tick);
        if (!running) { lastT = now; return; }

        // Clamp so a backgrounded tab doesn't resume with one giant jump.
        const dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 1 / 60;
        lastT = now;

        const step = RATE_PER_SEC * dt;

        if (pinned !== null) {
            if (spin) {
                const k = Math.min(1, (now - spin.t0) / (SPIN_SECONDS * 1000));
                progress = spin.from + (spin.to - spin.from) * easeOutIn(k);
                if (k >= 1) spin = null;
            } else {
                progress = pinned;
            }
        } else {
            // Ease the speed change so stopping/resuming never snaps.
            motion += (speed - motion) * (1 - Math.exp(-3.7 * dt));
            progress += step * motion;
        }

        const ease = 1 - Math.exp(-5 * dt);
        mouse.x += (mouse.tx - mouse.x) * ease;
        mouse.y += (mouse.ty - mouse.y) * ease;

        const h = innerHeight;

        // Magnetic stepping: dwell briefly at centre, then accelerate onward.
        const rounded = Math.round(progress);
        const diff = progress - rounded;
        const eased = Math.sign(diff) * Math.pow(Math.abs(diff) * 2, 4.2) / 2;
        const activeIndex = rounded + eased;

        // Keep the list in step with whichever card is front and centre.
        light(((rounded % CARD_COUNT) + CARD_COUNT) % CARD_COUNT);

        const half = CARD_COUNT / 2;

        cards.forEach((card, i) => {
            let offset = i - activeIndex;
            while (offset > half) offset -= CARD_COUNT;
            while (offset < -half) offset += CARD_COUNT;

            const abs = Math.abs(offset);
            const sign = Math.sign(offset);

            // With four cards the circular wrap lands at offset 2, while the
            // card is still clipping the screen edge — so fade it out before
            // then and the teleport happens unseen.
            const fade = abs <= FADE_FROM
                ? 1
                : Math.max(0, 1 - (abs - FADE_FROM) / (FADE_TO - FADE_FROM));

            if (fade <= 0.001) { card.style.visibility = 'hidden'; return; }
            card.style.visibility = 'visible';
            card.style.opacity = fade.toFixed(3);

            let y, z, rot;

            if (abs <= 1) {
                const t = smoothstep(abs);
                y = -sign * t * (cardH + GAP);
                z = 400 + t * (220 - 400);
                rot = t * 132;
            } else if (abs <= 2) {
                const t = smoothstep(abs - 1);
                const zEnd = -60;
                const sEnd = D / (D - zEnd);
                const yEnd = (h / 2 - PEEK) / sEnd - cardH / 2;
                y = -sign * ((cardH + GAP) + t * (yEnd - (cardH + GAP)));
                z = 220 + t * (zEnd - 220);
                rot = 132 + t * (175 - 132);
            } else {
                const t = smoothstep(Math.min(abs - 2, 1));
                const zA = -60, zB = -250;
                const yA = (h / 2 - PEEK) / (D / (D - zA)) - cardH / 2;
                const yB = (h / 2 + 100) / (D / (D - zB)) + cardH / 2;
                y = -sign * (yA + t * (yB - yA));
                z = zA + t * (zB - zA);
                rot = 175 + t * (195 - 175);
            }

            // Only the card at centre reacts to the cursor.
            const centre = Math.max(0, 1 - abs);
            const rotX = -sign * rot + (-mouse.y * 12 * centre);
            const rotY = mouse.x * 15 * centre;

            card.style.zIndex = Math.round(z);
            card.style.transform =
                `translateY(${y.toFixed(2)}px) translateZ(${z.toFixed(2)}px) ` +
                `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(-3deg)`;
        });
    };

    frame = requestAnimationFrame(tick);
})();

// Build photo galleries declared as <div class="photo-grid" data-gallery=".." data-count=".." data-ext="..">
document.querySelectorAll('.photo-grid[data-gallery]').forEach(grid => {
    const { gallery, count, ext } = grid.dataset;
    let html = '';
    for (let i = 1; i <= Number(count); i++) {
        const src = `assets/lighting/${gallery}/${String(i).padStart(2, '0')}.${ext}`;
        html += `<a class="photo" href="${src}" target="_blank"><img src="${src}" alt="${gallery} ${i}" loading="lazy"></a>`;
    }
    grid.innerHTML = html;
});

// Portfolio groups: folder-style accordion
document.querySelectorAll('.pf-group').forEach(group => {
    const toggle = group.querySelector('.pf-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
        const isOpen = group.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(isOpen));

        // Items inside were never scrolled into view while collapsed,
        // so reveal them immediately on open.
        if (isOpen) {
            group.querySelectorAll('.project, .portfolio-item').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            });
        }
    });
});

// Branding Approach section: reveal-on-scroll (triggers once)
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '-60px 0px -60px 0px' });

document.querySelectorAll('.reveal, .reveal-scale, .reveal-fade-only').forEach(el => {
    revealObserver.observe(el);
});

// Branding Approach circle diagram: sync label hover with its SVG line
document.querySelectorAll('.ba-label').forEach(label => {
    const key = label.dataset.key;
    const line = document.querySelector(`.ba-svg-line[data-key="${key}"]`);
    if (!line) return;

    label.addEventListener('mouseenter', () => {
        label.classList.add('active');
        line.classList.add('active');
    });
    label.addEventListener('mouseleave', () => {
        label.classList.remove('active');
        line.classList.remove('active');
    });
});

// ---------------------------------------------------------------------------
// Experience: production icons drifting down either margin
// ---------------------------------------------------------------------------
(() => {
    const orbit = document.getElementById('expOrbit');
    if (!orbit) return;

    const ICONS = {
        camera: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7 10 4h4l1.5 3"/><circle cx="12" cy="13.5" r="3.6"/>',
        film: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M7 5v14M17 5v14M2.5 9.7h4.5M2.5 14.3h4.5M17 9.7h4.5M17 14.3h4.5"/>',
        bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5.9 1.2.9 2h5.4c0-.8.3-1.5.9-2A6 6 0 0 0 12 3Z"/>',
        sliders: '<path d="M6 20V14M6 10V4M12 20V12M12 8V4M18 20V16M18 12V4"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="10" r="2"/><circle cx="18" cy="14" r="2"/>',
        aperture: '<circle cx="12" cy="12" r="9"/><path d="M12 3v8.5M20.8 8.5 13 12.5M18.5 19.6 12 12.5M5.5 19.6 12 12.5M3.2 8.5 12 12.5"/>',
        monitor: '<rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8.5 21h7M12 17v4"/>',
        wand: '<path d="M4 20 15 9M17.5 3v3.5M17.5 10v3.5M13.7 6.7h3.5M20.8 6.7h-3.5"/><path d="m13.5 7.5 3 3"/>',
        gimbal: '<path d="M12 4v5M9 4h6"/><rect x="6.5" y="9" width="11" height="7" rx="1.8"/><path d="M12 16v4M8.5 20h7"/>'
    };

    // x/y are percentages inside the section. The right margin now holds the
    // portrait, so the icons stay down the left edge.
    const SPOTS = [
        { icon: 'camera',  x: 4,  y: 13, size: 38, dur: 8.5,  delay: 0,   drift: 22 },
        { icon: 'aperture',x: 12, y: 30, size: 26, dur: 10,   delay: 0.4, drift: 18 },
        { icon: 'film',    x: 5,  y: 48, size: 30, dur: 11,   delay: 1.4, drift: 16 },
        { icon: 'bulb',    x: 14, y: 64, size: 32, dur: 9.5,  delay: 0.7, drift: 26 },
        { icon: 'sliders', x: 4,  y: 80, size: 26, dur: 12.5, delay: 2.1, drift: 14 },
        { icon: 'gimbal',  x: 13, y: 92, size: 24, dur: 13,   delay: 2.6, drift: 15 }
    ];

    orbit.innerHTML = SPOTS.map(s => `
        <span class="exp-icon" style="
            left:${s.x}%; top:${s.y}%;
            --size:${s.size}px; --dur:${s.dur}s; --delay:${s.delay}s; --drift:${s.drift}px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
                ${ICONS[s.icon]}
            </svg>
        </span>`).join('');
})();

// ---------------------------------------------------------------------------
// Lead funnel: mouse-scrubbed video, typewriter intro, email capture
// ---------------------------------------------------------------------------
(() => {
    const section = document.querySelector('.funnel');
    if (!section) return;

    const MAIL_TO = 'hoangcd.contact@gmail.com';

    // --- background video scrubs with horizontal mouse movement --------------
    const video = document.getElementById('funnelVideo');
    if (video) {
        const SENSITIVITY = 0.8;
        let prevX = null;
        let targetTime = 0;
        let seeking = false;

        const seek = () => {
            if (seeking || !video.duration) return;
            if (Math.abs(video.currentTime - targetTime) < 0.01) return;
            seeking = true;
            video.currentTime = targetTime;
        };

        // Only queue the next seek once the last one landed — seeking faster
        // than the decoder can keep up just drops frames.
        video.addEventListener('seeked', () => { seeking = false; seek(); });

        window.addEventListener('mousemove', e => {
            if (!video.duration) return;
            if (prevX === null) { prevX = e.clientX; return; }

            const delta = e.clientX - prevX;
            prevX = e.clientX;

            targetTime += (delta / window.innerWidth) * SENSITIVITY * video.duration;
            targetTime = Math.max(0, Math.min(video.duration, targetTime));
            seek();
        });
    }

    // --- typewriter ----------------------------------------------------------
    const typeEl = document.getElementById('funnelType');
    if (typeEl) {
        const text = typeEl.dataset.text || '';
        const SPEED = 38;
        const START_DELAY = 600;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const caret = document.createElement('span');
        caret.className = 'funnel-caret';

        if (reduced) {
            typeEl.textContent = text;
        } else {
            let started = false;

            const run = () => {
                if (started) return;
                started = true;

                setTimeout(() => {
                    let i = 0;
                    typeEl.appendChild(caret);
                    const id = setInterval(() => {
                        i++;
                        caret.remove();
                        typeEl.textContent = text.slice(0, i);
                        if (i >= text.length) { clearInterval(id); return; }
                        typeEl.appendChild(caret);
                    }, SPEED);
                }, START_DELAY);
            };

            // Start typing when the section is actually looked at.
            new IntersectionObserver((entries, obs) => {
                if (entries[0].isIntersecting) { run(); obs.disconnect(); }
            }, { threshold: 0.25 }).observe(section);
        }
    }

    // --- pills fade in independently of the typing ---------------------------
    const actions = document.getElementById('funnelActions');
    if (actions) setTimeout(() => actions.classList.add('is-in'), 400);

    // --- copy email ----------------------------------------------------------
    const copyBtn = document.getElementById('copyMail');
    if (copyBtn) {
        const original = copyBtn.querySelector('span').innerHTML;
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(MAIL_TO);
                copyBtn.querySelector('span').textContent = 'Đã copy email ✓';
            } catch {
                copyBtn.querySelector('span').textContent = MAIL_TO;
            }
            setTimeout(() => { copyBtn.querySelector('span').innerHTML = original; }, 2000);
        });
    }

    // --- email capture -------------------------------------------------------
    // No backend here: submitting opens the visitor's mail client with the
    // lead already written out. Point FORM_ENDPOINT at a form service
    // (Formspree, Basin, …) to collect silently instead.
    const FORM_ENDPOINT = '';

    const form = document.getElementById('leadForm');
    const input = document.getElementById('leadEmail');
    const msg = document.getElementById('leadMsg');

    form?.addEventListener('submit', async e => {
        e.preventDefault();
        const email = input.value.trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            msg.textContent = 'Email chưa hợp lệ, bạn kiểm tra lại giúp mình nhé.';
            msg.classList.add('is-error');
            input.focus();
            return;
        }

        msg.classList.remove('is-error');

        if (FORM_ENDPOINT) {
            try {
                const res = await fetch(FORM_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({ email })
                });
                if (!res.ok) throw new Error(res.status);
                form.reset();
                msg.textContent = 'Đã nhận email của bạn, mình sẽ liên hệ sớm!';
            } catch {
                msg.textContent = 'Gửi không thành công. Bạn email trực tiếp tới ' + MAIL_TO + ' giúp mình nhé.';
                msg.classList.add('is-error');
            }
            return;
        }

        const subject = encodeURIComponent('Liên hệ từ website portfolio');
        const body = encodeURIComponent(
            `Chào Hoàng,\n\nMình muốn được liên hệ lại.\nEmail của mình: ${email}\n\nNội dung:\n`
        );
        window.location.href = `mailto:${MAIL_TO}?subject=${subject}&body=${body}`;
        msg.textContent = 'Đang mở ứng dụng email của bạn…';
    });
})();

// Form handling (optional - for future contact form)
document.addEventListener('DOMContentLoaded', () => {
    console.log('Portfolio website loaded successfully!');
});
