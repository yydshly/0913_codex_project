import { useLayoutEffect } from 'react';
import { gsap } from 'gsap';

export function usePortfolioMotion(root, animate, replay, featured, listKey) {
  useLayoutEffect(() => {
    if (!animate) return;
    const ctx = gsap.context(() => {
      gsap.from('.pf-title-line > span', { yPercent: 110, rotation: 2, duration: .95, stagger: .17, ease: 'power3.out' });
      gsap.from('.pf-intro > .pf-eyebrow, .pf-intro > p, .pf-hero-actions', { y: 15, opacity: 0, duration: .65, stagger: .12, delay: .3 });
    }, root);
    return () => ctx.revert();
  }, [animate, replay]);

  useLayoutEffect(() => {
    if (!animate) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.pf-shutters > span', { scaleY: 1 }, { scaleY: 0, stagger: .075, duration: .85, ease: 'power3.inOut', transformOrigin: 'center top' });
      gsap.from('.pf-feature-image > img', { scale: 1.23, duration: 1.25, ease: 'power2.out' });
      gsap.from('.pf-feature-copy > *', { y: 18, opacity: 0, duration: .6, stagger: .07, delay: .3 });
    }, root);
    return () => ctx.revert();
  }, [featured, animate, replay]);

  useLayoutEffect(() => {
    if (!animate) return;
    const cards = [...root.current.querySelectorAll('.pf-project')];
    if (!cards.length || !('IntersectionObserver' in window)) return;
    const ctx = gsap.context(() => {}, root);
    ctx.add('show', (card, delay = 0) => {
      gsap.to(card, { opacity: 1, y: 0, duration: .7, delay, ease: 'power3.out', overwrite: true });
    });
    ctx.add('prepare', () => gsap.set(cards, { opacity: 0, y: 38 }));
    ctx.prepare();
    const observer = new IntersectionObserver(entries => {
      entries.filter(e => e.isIntersecting).forEach((entry, i) => { ctx.show(entry.target, Math.min(i, 2) * .09); observer.unobserve(entry.target); });
    }, { threshold: .08 });
    cards.forEach(card => observer.observe(card));
    const focus = e => { const card = e.target.closest('.pf-project'); if (card) { observer.unobserve(card); ctx.show(card); } };
    const element = root.current;
    element.addEventListener('focusin', focus);
    return () => { observer.disconnect(); element.removeEventListener('focusin', focus); ctx.revert(); };
  }, [animate, listKey]);

  useLayoutEffect(() => {
    if (!animate) return;
    const element = root.current, controls = new Map();
    const ctx = gsap.context(() => {
      element.querySelectorAll('.pf-card-image').forEach(target => {
        gsap.set(target, { transformPerspective: 850 });
        controls.set(target, {
          x: gsap.quickTo(target, 'rotationX', { duration: .35, ease: 'power2.out' }),
          y: gsap.quickTo(target, 'rotationY', { duration: .35, ease: 'power2.out' }),
        });
      });
    }, root);
    const tilt = (target, x, y) => { const control = controls.get(target); if (control) { control.x(-y * 4); control.y(x * 5); } };
    const move = e => {
      if (e.pointerType !== 'mouse') return;
      const target = e.target.closest('.pf-card-image');
      if (!target) return;
      const rect = target.getBoundingClientRect();
      tilt(target, Math.max(-1, Math.min(1, (e.clientX - rect.left) / rect.width * 2 - 1)), Math.max(-1, Math.min(1, (e.clientY - rect.top) / rect.height * 2 - 1)));
    };
    const out = e => { const target = e.target.closest('.pf-card-image'); if (target && !target.contains(e.relatedTarget)) tilt(target, 0, 0); };
    element.addEventListener('pointermove', move); element.addEventListener('pointerout', out);
    return () => { element.removeEventListener('pointermove', move); element.removeEventListener('pointerout', out); ctx.revert(); };
  }, [animate, listKey]);

  useLayoutEffect(() => {
    if (!animate) return;
    const line = root.current.querySelector('.pf-reading-progress');
    let frame;
    const update = () => { frame = undefined; const distance = document.documentElement.scrollHeight - window.innerHeight; line.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0})`; };
    const schedule = () => { if (frame === undefined) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(schedule); resize.observe(root.current);
    window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', schedule); update();
    return () => { resize.disconnect(); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); cancelAnimationFrame(frame); line.style.transform = 'scaleX(0)'; };
  }, [animate]);
}
