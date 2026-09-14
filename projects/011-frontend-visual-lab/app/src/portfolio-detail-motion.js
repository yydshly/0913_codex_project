import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';

function visibleRect(element) {
  if (!element?.isConnected) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1 || rect.bottom <= 0 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth) return null;
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

// Interpolate the image's crop, keeping its intrinsic aspect ratio throughout.
function imageFit(rect, image, cover) {
  const ratio = image.naturalWidth / image.naturalHeight;
  const width = cover ? Math.max(rect.width, rect.height * ratio) : Math.min(rect.width, rect.height * ratio);
  const height = width / ratio;
  return { width, height, left: (rect.width - width) / 2, top: (rect.height - height) / 2 };
}

export function usePortfolioDetail({ detail, animate, dialog, body, trigger, source, onClosed }) {
  const controller = useRef(null);
  const animationEnabled = useRef(animate);
  animationEnabled.current = animate;

  useLayoutEffect(() => {
    if (!detail) return;
    const modal = dialog.current;
    const content = body.current;
    const photo = content.querySelector('.pf-detail-image');
    const copy = content.querySelector('.pf-detail-copy');
    const origin = source.current;
    const returnScroll = { x: scrollX, y: scrollY };
    const oldOverflow = document.body.style.overflow;
    const oldPadding = document.body.style.paddingRight;
    const gutter = innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + gutter}px`;
    document.body.style.overflow = 'hidden';
    modal.showModal();
    let phase = 'opening', timeline, layer, frame, picture, originVisibility;
    const canFly = () => animationEnabled.current && typeof HTMLElement.prototype.showPopover === 'function' && origin?.complete && origin.naturalWidth > 0 && photo.src === origin.src;

    function removeFlight() {
      layer?.remove(); layer = frame = picture = null;
      if (origin && originVisibility !== undefined) origin.style.visibility = originVisibility;
      originVisibility = undefined;
      photo.style.visibility = '';
    }

    function createFlight(rect, fit) {
      layer = document.createElement('div');
      layer.className = 'pf-image-flight';
      layer.setAttribute('popover', 'manual');
      layer.setAttribute('aria-hidden', 'true');
      frame = document.createElement('div');
      frame.className = 'pf-image-flight-frame';
      picture = document.createElement('img');
      picture.src = photo.currentSrc || photo.src;
      picture.alt = '';
      frame.append(picture); layer.append(frame); document.body.append(layer);
      // A manual popover shares the browser top layer with the modal without taking focus.
      try { layer.showPopover(); } catch { removeFlight(); return false; }
      gsap.set(frame, rect); gsap.set(picture, fit);
      originVisibility = origin.style.visibility;
      origin.style.visibility = 'hidden'; photo.style.visibility = 'hidden';
      return true;
    }

    function showContent() {
      timeline?.kill(); removeFlight();
      gsap.set([content, copy], { clearProps: 'opacity,transform' });
      modal.style.setProperty('--pf-backdrop-opacity', '1');
      phase = 'open'; modal.dataset.transition = phase;
    }

    function finishClose() {
      if (phase === 'closed') return;
      phase = 'closed'; timeline?.kill(); removeFlight();
      modal.close();
      document.body.style.overflow = oldOverflow;
      document.body.style.paddingRight = oldPadding;
      window.scrollTo({ left: returnScroll.x, top: returnScroll.y, behavior: 'instant' });
      const destination = trigger.current?.isConnected ? trigger.current : document.getElementById('pf-library-title');
      if (destination && !destination.hasAttribute('tabindex') && destination.tagName === 'H2') destination.setAttribute('tabindex', '-1');
      destination?.focus({ preventScroll: true });
      onClosed();
    }

    function close() {
      if (phase === 'closing' || phase === 'closed') return;
      phase = 'closing'; modal.dataset.transition = phase;
      timeline?.kill();
      if (!animationEnabled.current) { finishClose(); return; }
      const destination = visibleRect(origin?.closest('.pf-card-image') || origin);
      const from = visibleRect(photo);
      // When closing during entry, reverse the existing flying frame from its current position.
      const flying = canFly() && destination && (frame || (from && createFlight(from, imageFit(from, origin, false))));
      timeline = gsap.timeline({ onComplete: finishClose });
      timeline.to(copy, { opacity: 0, duration: .16 }, 0);
      timeline.to(content, { opacity: 0, duration: .23 }, 0);
      timeline.to(modal, { '--pf-backdrop-opacity': 0, duration: .4 }, 0);
      if (flying) {
        timeline.to(frame, { ...destination, duration: .48, ease: 'power3.inOut' }, 0);
        timeline.to(picture, { ...imageFit(destination, origin, getComputedStyle(origin).objectFit !== 'contain'), duration: .48, ease: 'power3.inOut' }, 0);
      }
    }

    modal.dataset.transition = phase;
    const start = visibleRect(origin?.closest('.pf-card-image') || origin);
    const end = visibleRect(photo);
    if (canFly() && start && end && createFlight(start, imageFit(start, origin, getComputedStyle(origin).objectFit !== 'contain'))) {
      gsap.set(content, { opacity: 0 }); gsap.set(copy, { opacity: 0 });
      modal.style.setProperty('--pf-backdrop-opacity', '0');
      timeline = gsap.timeline({ onComplete: showContent });
      timeline.to(modal, { '--pf-backdrop-opacity': 1, duration: .45 }, 0);
      timeline.to(content, { opacity: 1, duration: .35 }, .16);
      timeline.to(frame, { ...end, duration: .62, ease: 'power3.inOut' }, 0);
      timeline.to(picture, { ...imageFit(end, origin, false), duration: .62, ease: 'power3.inOut' }, 0);
      timeline.to(copy, { opacity: 1, duration: .35 }, .38);
    } else if (animationEnabled.current) {
      timeline = gsap.timeline({ onComplete: showContent }).from(content, { opacity: 0, duration: .3 });
    } else showContent();

    const settle = () => phase === 'closing' ? finishClose() : phase !== 'closed' && showContent();
    controller.current = { close, settle };
    const resize = () => settle();
    const scroll = () => { if (phase === 'opening') showContent(); };
    const sceneInteraction = event => {
      if (phase === 'opening' && event.target.closest('[role="tablist"]')) showContent();
    };
    window.addEventListener('resize', resize);
    modal.addEventListener('scroll', scroll, { passive: true });
    modal.addEventListener('click', sceneInteraction, true);
    modal.addEventListener('keydown', sceneInteraction, true);
    return () => {
      timeline?.kill(); removeFlight(); controller.current = null;
      window.removeEventListener('resize', resize); modal.removeEventListener('scroll', scroll);
      modal.removeEventListener('click', sceneInteraction, true);
      modal.removeEventListener('keydown', sceneInteraction, true);
      gsap.set([content, copy], { clearProps: 'opacity,transform' });
      if (modal.open) modal.close();
      document.body.style.overflow = oldOverflow; document.body.style.paddingRight = oldPadding;
    };
  }, [detail]);

  useLayoutEffect(() => { if (!animate) controller.current?.settle(); }, [animate]);
  return () => controller.current?.close();
}
