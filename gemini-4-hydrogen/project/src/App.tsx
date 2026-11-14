import { useEffect, useRef, useState } from 'react';
import { createQingmingEngine } from './qingming/engine';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    try {
      const engine = createQingmingEngine(el);
      (window as unknown as { __qingming?: typeof engine }).__qingming = engine;
      return () => {
        engine.dispose();
      };
    } catch {
      setWebglError(true);
    }
  }, []);

  if (webglError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#bfa77f] text-[#2b1f14] p-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold mb-2">清明上河图 · 三维长卷</h1>
          <p className="text-sm opacity-80">当前浏览器环境未启用 WebGL，无法渲染三维长卷。</p>
        </div>
      </div>
    );
  }

  return <div ref={mountRef} className="relative h-screen w-screen overflow-hidden bg-[#bfa77f]" />;
}
