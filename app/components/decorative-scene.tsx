'use client';

import { memo } from 'react';
import Image from 'next/image';

const DecorativeScene = memo(function DecorativeScene() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Radial dark shadow at center-bottom to ground the timer */}
      <div
        className="absolute left-1/2 bottom-0 -translate-x-1/2"
        style={{
          width: 'clamp(500px, 70vw, 1000px)',
          height: 'clamp(300px, 40vw, 600px)',
          background: 'radial-gradient(ellipse, rgba(10, 20, 80, 0.55) 0%, transparent 70%)',
        }}
      />

      {/* Top left ambient glow */}
      <div
        className="absolute -top-20 -left-20"
        style={{
          width: 'clamp(300px, 40vw, 600px)',
          height: 'clamp(300px, 40vw, 600px)',
          background: 'radial-gradient(ellipse, rgba(89, 125, 225, 0.2) 0%, transparent 65%)',
        }}
      />

      {/* Bottom right ambient glow */}
      <div
        className="absolute -bottom-20 -right-20"
        style={{
          width: 'clamp(250px, 35vw, 500px)',
          height: 'clamp(250px, 35vw, 500px)',
          background: 'radial-gradient(ellipse, rgba(34, 65, 155, 0.3) 0%, transparent 65%)',
        }}
      />

      {/* SVG logo-orbit — top right, large decorative */}
      <div
        className="absolute -top-6 right-6 md:right-16 animate-float-a opacity-[0.18]"
        style={{ width: 'clamp(120px, 18vw, 260px)', height: 'clamp(120px, 18vw, 260px)' }}
      >
        <Image src="/findit/logo-orbit.svg" alt="" fill className="object-contain" />
      </div>

      {/* SVG logo-mark — bottom left */}
      <div
        className="absolute bottom-16 left-6 md:left-14 animate-float-b opacity-[0.2]"
        style={{ width: 'clamp(60px, 10vw, 140px)', height: 'clamp(50px, 8vw, 110px)' }}
      >
        <Image src="/findit/logo-mark.svg" alt="" fill className="object-contain" />
      </div>

      {/* SVG logo-main — left middle */}
      <div
        className="absolute top-1/3 left-4 md:left-10 animate-float-c opacity-[0.1]"
        style={{ width: 'clamp(60px, 9vw, 120px)', height: 'clamp(72px, 11vw, 144px)' }}
      >
        <Image src="/findit/logo-main.svg" alt="" fill className="object-contain" />
      </div>

      {/* Corner marks */}
      <div className="absolute top-6 left-6 w-8 h-8" style={{ borderTop: '1px solid rgba(255,255,255,0.15)', borderLeft: '1px solid rgba(255,255,255,0.15)' }} />
      <div className="absolute top-6 right-6 w-8 h-8" style={{ borderTop: '1px solid rgba(255,255,255,0.15)', borderRight: '1px solid rgba(255,255,255,0.15)' }} />
      <div className="absolute bottom-6 left-6 w-8 h-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', borderLeft: '1px solid rgba(255,255,255,0.15)' }} />
      <div className="absolute bottom-6 right-6 w-8 h-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', borderRight: '1px solid rgba(255,255,255,0.15)' }} />
    </div>
  );
});

export default DecorativeScene;
