import './style.css';
import { TRIP, LOCATION_ADDRESSES, locStyle, type Day } from './data.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

const DAY = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as const;
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function pad(n: number) { return String(n).padStart(2,'0'); }

function fmt(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return `${DAY[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
}

// ── Location groups ──────────────────────────────────────────────────────────

interface LocGroup { name: string; start: string; end: string; nights: number; }

function buildLocGroups(): LocGroup[] {
  const groups: LocGroup[] = [];
  let cur: LocGroup | null = null;
  for (const day of TRIP) {
    if (!day.overnight || day.tbd) { cur = null; continue; }
    if (!cur || cur.name !== day.overnight) {
      cur = { name: day.overnight, start: day.date, end: day.date, nights: 1 };
      groups.push(cur);
    } else { cur.end = day.date; cur.nights++; }
  }
  return groups;
}

function mapsUrl(name: string): string {
  const addr = LOCATION_ADDRESSES[name] ?? name + ', France';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}&travelmode=driving`;
}

// ── Itinerary row ─────────────────────────────────────────────────────────────

function buildRow(day: Day, isToday: boolean): string {
  const d   = new Date(day.date+'T12:00:00');
  const dn  = DAY[d.getDay()];
  const num = d.getDate();
  const mon = MON[d.getMonth()];

  let badge: string;
  let accentColor: string;

  if (day.tbd) {
    badge = `<span class="badge badge--tbd">Nothing booked</span>`;
    accentColor = '#d97706';
  } else if (day.overnight) {
    const { text, border } = locStyle(day.overnight);
    badge = `<span class="badge" style="color:${text};border-color:${border}40;background:${border}18">${day.overnight}</span>`;
    accentColor = border;
  } else {
    badge = `<span class="badge badge--travel">Travel</span>`;
    accentColor = '#1e293b';
  }

  const accentStyle = isToday ? '' : `style="--row-accent:${accentColor}"`;
  const isLink = !!(day.overnight && !day.overnight.includes('Ferry'));
  const linkAttr = isLink ? ` data-scroll-to-loc="${day.overnight}"` : '';

  return `
    <div class="row${isToday ? ' row--today' : ''}${isLink ? ' row--link' : ''}" ${accentStyle}${isToday ? ' id="today-row"' : ''}${linkAttr}>
      <div class="row-accent"></div>
      <div class="row-left">
        <span class="row-day">${dn}</span>
        <div class="row-dates">
          ${isToday ? '<span class="today-tag">TODAY</span>' : ''}
          <span class="row-date">${num} ${mon}</span>
        </div>
      </div>
      ${badge}
    </div>`;
}

// ── Location card ─────────────────────────────────────────────────────────────

function buildLocCard(g: LocGroup, idx: number): string {
  const { text, border } = locStyle(g.name);
  const range  = g.start === g.end ? fmt(g.start) : `${fmt(g.start)} – ${fmt(g.end)}`;
  const nights = g.nights === 1 ? '1 night' : `${g.nights} nights`;
  const pid    = `panel-${idx}`;
  const oid    = `output-${idx}`;

  return `
    <div class="loc-card" style="--loc-text:${text};--loc-border:${border}">
      <div class="loc-stripe" style="background:linear-gradient(180deg,${text},${border})"></div>
      <div class="loc-body">
        <div class="loc-name">${g.name}</div>
        <div class="loc-meta">${range} &middot; ${nights}</div>
        <div class="loc-actions">
          <a class="btn btn--outline" href="${mapsUrl(g.name)}" target="_blank" rel="noopener noreferrer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
            Directions
          </a>
          <button class="btn btn--primary" data-panel="${pid}" data-open="false">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            Ask Claude
          </button>
        </div>
        <div class="claude-panel" id="${pid}" hidden>
          <div class="selector-row">
            <span class="sel-label">What?</span>
            <div class="pills" data-group="type">
              <button class="pill active" data-val="food">Food</button>
              <button class="pill" data-val="activities">Activities</button>
              <button class="pill" data-val="food and activities">Both</button>
            </div>
          </div>
          <div class="selector-row">
            <span class="sel-label">How far?</span>
            <div class="pills" data-group="dist">
              <button class="pill active" data-val="walking distance">Walking</button>
              <button class="pill" data-val="5 km">5 km</button>
              <button class="pill" data-val="10 km">10 km</button>
              <button class="pill" data-val="20 km">20 km</button>
            </div>
          </div>
          <button class="btn btn--ask" data-loc="${g.name}" data-out="${oid}">Get Suggestions</button>
          <div class="claude-output" id="${oid}" hidden></div>
        </div>
      </div>
    </div>`;
}

// ── Render ────────────────────────────────────────────────────────────────────

function render(): void {
  const today  = todayISO();
  const groups = buildLocGroups().filter(g => !g.name.includes('Ferry'));

  document.getElementById('app')!.innerHTML = `
    <div class="shell">
      <header class="top-bar">
        <img src="/header2.png" alt="France 2026" class="header-img" />
      </header>
      <main class="content">
        <section class="section">
          <div class="section-title">Itinerary</div>
          <div class="list">
            ${TRIP.map(d => buildRow(d, d.date === today)).join('')}
          </div>
        </section>
        <section class="section" id="loc-section">
          <div class="section-title">Locations</div>
          <div class="loc-scroller" id="loc-scroller">
            ${groups.map((g, i) => `
              <div class="loc-page" data-loc-name="${g.name}">
                ${buildLocCard(g, i)}
              </div>`).join('')}
          </div>
          <div class="loc-dots" id="loc-dots">
            ${groups.map((_, i) => `<span class="loc-dot${i === 0 ? ' loc-dot--active' : ''}"></span>`).join('')}
          </div>
        </section>
      </main>
    </div>`;

  wireEvents();
}

// ── Events ────────────────────────────────────────────────────────────────────

function wireEvents(): void {

  document.querySelectorAll<HTMLButtonElement>('[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = document.getElementById(btn.dataset['panel']!)!;
      const open  = btn.dataset['open'] === 'true';
      panel.hidden       = open;
      btn.dataset['open'] = String(!open);
      btn.innerHTML = open
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> Ask Claude`
        : 'Close';
    });
  });

  document.querySelectorAll<HTMLElement>('.pills').forEach(group => {
    group.querySelectorAll<HTMLButtonElement>('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });
  });

  // Carousel dot tracking
  const scroller = document.getElementById('loc-scroller');
  const dots = Array.from(document.querySelectorAll<HTMLElement>('.loc-dot'));
  if (scroller && dots.length) {
    scroller.addEventListener('scroll', () => {
      const idx = Math.round(scroller.scrollLeft / scroller.clientWidth);
      dots.forEach((d, i) => d.classList.toggle('loc-dot--active', i === idx));
    }, { passive: true });
  }

  // Row tap → navigate to location page
  document.querySelectorAll<HTMLElement>('[data-scroll-to-loc]').forEach(row => {
    row.addEventListener('click', () => {
      const locName = row.dataset['scrollToLoc'];
      const pages = Array.from(document.querySelectorAll<HTMLElement>('.loc-page'));
      const pageIdx = pages.findIndex(p => p.dataset['locName'] === locName);
      if (pageIdx === -1 || !scroller) return;
      document.getElementById('loc-section')!.scrollIntoView({ behavior: 'smooth', block: 'start' });
      scroller.scrollTo({ left: pageIdx * scroller.clientWidth, behavior: 'smooth' });
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.btn--ask').forEach(btn => {
    btn.addEventListener('click', () => {
      void (async () => {
        const loc    = btn.dataset['loc']!;
        const outId  = btn.dataset['out']!;
        const panel  = btn.closest<HTMLElement>('.claude-panel')!;
        const type   = panel.querySelector<HTMLButtonElement>('[data-group="type"] .pill.active')!.dataset['val']!;
        const dist   = panel.querySelector<HTMLButtonElement>('[data-group="dist"] .pill.active')!.dataset['val']!;
        const output = document.getElementById(outId)!;

        output.hidden      = false;
        output.textContent = 'Asking Claude…';
        btn.disabled       = true;

        try {
          const res = await fetch('/api/suggest', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ location: loc, type, distance: dist }),
          });

          if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

          const reader  = res.body.getReader();
          const decoder = new TextDecoder();
          output.textContent = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            output.textContent += decoder.decode(value, { stream: true });
          }
        } catch {
          output.textContent = 'Could not load suggestions — check your connection and try again.';
        } finally {
          btn.disabled = false;
        }
      })();
    });
  });
}

render();
