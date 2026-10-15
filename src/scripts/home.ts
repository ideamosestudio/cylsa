const canvas = document.querySelector<HTMLCanvasElement>('#tire-canvas');
const track = document.querySelector<HTMLElement>('[data-hero-track]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
const canAnimate = matchMedia('(min-width: 901px) and (pointer: fine)').matches && !reduced && !connection?.saveData && !/2g/.test(connection?.effectiveType || '');

// Continuous CSS effects only run while their section is visible.
const motionObserver = new IntersectionObserver(entries => {
  for (const entry of entries) entry.target.classList.toggle('motion-paused', !entry.isIntersecting);
});
document.querySelectorAll('main > section').forEach(section => {
  section.classList.add('motion-paused');
  motionObserver.observe(section);
});

// First paint is HTML + a responsive poster; WebGL never gates reading or navigation.
if (canAnimate && canvas && track) {
  const start = () => {
    if (document.hidden || track.getBoundingClientRect().bottom < 0) return;
    import('../three/PremiumWheelScene')
      .then(({ initTireScene }) => initTireScene(canvas, track, document.querySelector('#hero-progress'), false))
      .catch(() => track.classList.remove('scene-enabled', 'model-ready'));
  };
  const schedule = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 2000 });
    else setTimeout(start, 500);
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
}

// Small progressive reveals do not require downloading an animation library.
if (!reduced) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.animate([{ transform: 'translateY(20px)', opacity: .6 }, { transform: 'none', opacity: 1 }], { duration: 500, easing: 'ease-out' });
      observer.unobserve(entry.target);
    }
  }, { threshold: .08 });
  document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
}
