
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';

  gsap.registerPlugin(ScrollTrigger);
  const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const range = (value: number, start: number, end: number) => clamp((value - start) / (end - start));
  const smooth = (value: number) => value * value * (3 - 2 * value);

  export function initAdvisory(section: HTMLElement) {
    const bg = section.querySelector<HTMLElement>('[data-advisory-bg]');
    const car = section.querySelector<HTMLElement>('[data-advisory-car]');
    const carMotion = section.querySelector<HTMLElement>('[data-advisory-car-motion]');
    const copy = section.querySelector<HTMLElement>('[data-advisory-copy]');
    const speed = section.querySelector<HTMLElement>('[data-advisory-speed]');
    const redline = section.querySelector<HTMLElement>('[data-advisory-redline]');
    const counter = section.querySelector<HTMLElement>('[data-advisory-counter]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let revealedProgress = reduced ? 0.45 : 0;
    let carPulsePlayed = reduced;

    const apply = (p: number) => {
      revealedProgress = Math.max(revealedProgress, p);
      const reveal = revealedProgress;
      const mobile = window.innerWidth < 700;
      const enter = smooth(range(reveal, 0.02, mobile ? 0.3 : 0.24));
      const copyIn = smooth(range(reveal, 0.05, 0.22));

      if (bg) bg.style.transform = `translate3d(${p * -0.55}%,${p * -0.8}%,0) scale(${1.035 + p * 0.012})`;
      if (car) {
        const x = (1 - enter) * (mobile ? 18 : 4.5);
        const y = (1 - enter) * 1.4;
        const scale = (mobile ? 0.91 : 0.965) + enter * (mobile ? 0.07 : 0.025);
        car.style.transform = `translate3d(${x}vw,${y}vh,0) scale(${scale})`;
        car.style.opacity = String(smooth(range(enter, 0, 0.16)));
        if (carMotion && enter >= 0.98 && !carPulsePlayed) {
          carPulsePlayed = true;
          gsap.fromTo(carMotion, { scale: 1 }, { scale: 1.05, duration: 1.4, ease: 'sine.inOut', repeat: 1, yoyo: true });
        }
      }
      if (copy) {
        copy.style.opacity = String(copyIn);
        copy.style.transform = `translate3d(0,${(1-copyIn)*24}px,0)`;
      }
      if (speed) {
        speed.style.opacity = String(enter * 0.12);
        speed.style.transform = `translate3d(${(1-enter)*12}vw,0,0)`;
      }
      if (redline) redline.style.transform = `scaleX(${Math.min(1, enter * 1.15)})`;
      if (counter) counter.textContent = String(Math.round(reveal * 100)).padStart(2, '0');
    };

    apply(reduced ? 0.45 : 0);
    if (!reduced) ScrollTrigger.create({ trigger: section, start: 'top 50%', end: 'bottom bottom', onUpdate: (self) => apply(self.progress) });
  }
