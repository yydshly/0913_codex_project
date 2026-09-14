import React, { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';

const Clouds = lazy(() => import('./vendor/Clouds/Clouds').then(module => ({ default: module.Clouds })));

class AtmosphereBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onUnavailable(); }
  render() { return this.state.failed ? null : this.props.children; }
}

// Use the original Canvas UI renderer. The artwork and controls remain ordinary HTML.
export function PortfolioAtmosphere({ enabled, onUnavailable }) {
  const host = useRef(null);
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(host.current);
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  return <div ref={host} className="pf-atmosphere" aria-hidden="true" data-active={enabled && visible && pageVisible}>
    {enabled && visible && pageVisible && <AtmosphereBoundary onUnavailable={onUnavailable}><Suspense fallback={null}>
      <Clouds className="pf-clouds" style={{ height: '100%' }} opacity={0.42} cover={0.08} density={1.9} speed={0.45} scale={1.25} color={[0.74, 0.82, 0.73]} quality={0.5} wind={0.65} windRadius={210} refraction={0} fogBlur={0}>
        <div className="pf-cloud-surface" />
      </Clouds>
    </Suspense></AtmosphereBoundary>}
  </div>;
}

export function supportsPortfolioAtmosphere() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}
