import { useEffect, useRef } from 'react';
import { mountQingmingScrollApp } from './qmsht/07-camera-ui';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const unmount = mountQingmingScrollApp(el);
    return () => {
      unmount();
    };
  }, []);

  return <div ref={mountRef} className="w-screen h-screen overflow-hidden" />;
}
