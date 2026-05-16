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

const FERRY_DETAIL: Record<string, string[]> = {
  '2026-06-28': ['Depart Dublin 4:00pm', 'Arrive Cherbourg 11:30am Monday', '2 × 4 Bed cabins'],
  '2026-07-17': ['Depart Cherbourg 4:30pm', 'Arrive Dublin 10:45am Saturday', '2 × 4 Bed cabins'],
};

const LOC_IMAGES: Record<string, string> = {
  'Anse Du Brick':   '/anse-du-brick.jpg',
  'Mané Guernéhué': '/camping-mane-guernehue.jpg',
  'Puy du Fou':      '/puy-du-foy.jpg',
  'Granville':       '/granville.jpg',
};

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
  const ferryDetail = FERRY_DETAIL[day.date];

  if (ferryDetail) {
    const { text, border } = locStyle(day.overnight!);
    return `
      <div class="row row--ferry row--link" ${accentStyle} data-ferry-row>
        <div class="row-accent"></div>
        <div class="row-main">
          <div class="row-left">
            <span class="row-day">${dn}</span>
            <div class="row-dates"><span class="row-date">${num} ${mon}</span></div>
          </div>
          <div class="row-right">
            <span class="badge" style="color:${text};border-color:${border}40;background:${border}18">${day.overnight}</span>
            <svg class="ferry-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>
        <div class="ferry-detail" hidden>
          ${ferryDetail.map(line => `<div class="ferry-item">${line}</div>`).join('')}
        </div>
      </div>`;
  }

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

// ── Location page ─────────────────────────────────────────────────────────────

function buildLocPage(g: LocGroup, pageIdx: number): string {
  const { text, border } = locStyle(g.name);
  const range  = g.start === g.end ? fmt(g.start) : `${fmt(g.start)} – ${fmt(g.end)}`;
  const nights = g.nights === 1 ? '1 night' : `${g.nights} nights`;
  const oid    = `output-${pageIdx}`;

  return `
    <div class="page" data-loc-name="${g.name}">
      <div class="shell">
        <header class="top-bar top-bar--loc" style="border-bottom-color:${border}44">
          <button class="back-btn" data-go-page="0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>
          <span class="top-bar-loc" style="color:${text}">${g.name}</span>
        </header>
        <main class="content">
          ${LOC_IMAGES[g.name] ? `<img src="${LOC_IMAGES[g.name]}" alt="${g.name}" class="loc-page-img" />` : ''}
          <div class="loc-hero" style="border-color:${border}33">
            <div class="loc-hero-stripe" style="background:linear-gradient(180deg,${text},${border})"></div>
            <div class="loc-hero-body">
              <div class="loc-hero-name" style="color:${text};text-shadow:0 0 40px ${border}60">${g.name}</div>
              <div class="loc-hero-meta">${range} &middot; ${nights}</div>
              <a class="btn btn--outline" href="${mapsUrl(g.name)}" target="_blank" rel="noopener noreferrer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                Directions
              </a>
            </div>
          </div>
          <section>
            <div class="section-title">Ask Claude</div>
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
                <button class="pill" data-val="20 km">20 km</button>
                <button class="pill" data-val="50 km">50 km</button>
              </div>
            </div>
            <button class="btn btn--ask" data-loc="${g.name}" data-out="${oid}">Get Suggestions</button>
            <div class="claude-output" id="${oid}" hidden></div>
          </section>
        </main>
      </div>
    </div>`;
}

// ── Render ────────────────────────────────────────────────────────────────────

function render(): void {
  const today  = todayISO();
  const groups = buildLocGroups().filter(g => !g.name.includes('Ferry'));

  document.getElementById('app')!.innerHTML = `
    <div class="pages-wrap" id="pages-wrap">
      <div class="page">
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
          </main>
        </div>
      </div>
      ${groups.map((g, i) => buildLocPage(g, i + 1)).join('')}
    </div>`;

  wireEvents();
}

// ── Navigation ────────────────────────────────────────────────────────────────

function goToPage(idx: number): void {
  const wrap = document.getElementById('pages-wrap')!;
  wrap.scrollTo({ left: idx * wrap.clientWidth, behavior: 'smooth' });
}

// ── Events ────────────────────────────────────────────────────────────────────

function wireEvents(): void {

  document.querySelectorAll<HTMLElement>('.pills').forEach(group => {
    group.querySelectorAll<HTMLButtonElement>('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-go-page]').forEach(btn => {
    btn.addEventListener('click', () => goToPage(Number(btn.dataset['goPage'])));
  });

  document.querySelectorAll<HTMLElement>('[data-ferry-row]').forEach(row => {
    row.addEventListener('click', () => {
      const detail = row.querySelector<HTMLElement>('.ferry-detail')!;
      const open   = detail.hidden === true;
      detail.hidden = !open;
      row.classList.toggle('row--ferry-open', open);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-scroll-to-loc]').forEach(row => {
    row.addEventListener('click', () => {
      const locName = row.dataset['scrollToLoc'];
      const allPages = Array.from(document.querySelectorAll<HTMLElement>('.page'));
      const idx = allPages.findIndex(p => p.dataset['locName'] === locName);
      if (idx !== -1) goToPage(idx);
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.btn--ask').forEach(btn => {
    btn.addEventListener('click', () => {
      void (async () => {
        const loc    = btn.dataset['loc']!;
        const outId  = btn.dataset['out']!;
        const page   = btn.closest<HTMLElement>('.page')!;
        const type   = page.querySelector<HTMLButtonElement>('[data-group="type"] .pill.active')!.dataset['val']!;
        const dist   = page.querySelector<HTMLButtonElement>('[data-group="dist"] .pill.active')!.dataset['val']!;
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
