import React, { lazy, Suspense } from 'react';
const Lab = lazy(() => import('./lab.jsx').then(m => ({ default: m.Lab })));
const Portfolio = lazy(() => import('./portfolio.jsx'));
export function App() {
  const product = new URLSearchParams(window.location.search).get('view') === 'portfolio';
  return <Suspense fallback={<p style={{padding:32}}>正在打开页面…</p>}>{product ? <Portfolio/> : <Lab/>}</Suspense>;
}
