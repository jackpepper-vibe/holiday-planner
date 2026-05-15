import './style.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

const app = document.getElementById('app')!;
app.innerHTML = `
  <div class="shell">
    <header class="top-bar">
      <span class="logo">✈️ Holiday Planner</span>
    </header>
    <main class="content">
      <p class="placeholder">Your trips will appear here.</p>
    </main>
    <nav class="bottom-nav">
      <button class="nav-btn active" data-tab="trips">Trips</button>
      <button class="nav-btn" data-tab="explore">Explore</button>
      <button class="nav-btn" data-tab="profile">Profile</button>
    </nav>
  </div>
`;

document.querySelectorAll<HTMLButtonElement>('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
