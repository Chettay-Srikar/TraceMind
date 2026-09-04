import React, { useEffect, useState } from 'react';

export const CursorEffect: React.FC = () => {
  const [position, setPosition] = useState({ x: -1000, y: -1000 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', updateCursor);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', updateCursor);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  return (
    <div 
      className="pointer-events-none fixed inset-0 z-[9998] transition-opacity duration-300"
      style={{
        opacity: isVisible ? 1 : 0,
        background: `radial-gradient(circle 550px at ${position.x}px ${position.y}px, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.04) 40%, transparent 70%)`
      }}
    />
  );
};
