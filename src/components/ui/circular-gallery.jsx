import React, { useState, useEffect, useRef } from 'react';

const CircularGallery = React.forwardRef(
    ({ items, className = '', radius = 600, autoRotateSpeed = 0.02, ...props }, ref) => {
        const [rotation, setRotation] = useState(0);
        const [isScrolling, setIsScrolling] = useState(false);
        const scrollTimeoutRef = useRef(null);
        const animationFrameRef = useRef(null);

        useEffect(() => {
            const handleScroll = () => {
                setIsScrolling(true);
                if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

                const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollProgress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
                setRotation(scrollProgress * 360);

                scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 150);
            };

            window.addEventListener('scroll', handleScroll, { passive: true });
            return () => {
                window.removeEventListener('scroll', handleScroll);
                if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
            };
        }, []);

        useEffect(() => {
            const autoRotate = () => {
                if (!isScrolling) setRotation(prev => prev + autoRotateSpeed);
                animationFrameRef.current = requestAnimationFrame(autoRotate);
            };
            animationFrameRef.current = requestAnimationFrame(autoRotate);
            return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
        }, [isScrolling, autoRotateSpeed]);

        const anglePerItem = 360 / items.length;

        return (
            <div
                ref={ref}
                role="region"
                aria-label="Circular Movie Gallery"
                className={className}
                style={{ perspective: '2000px', position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                {...props}
            >
                <div
                    style={{
                        position: 'relative', width: '100%', height: '100%',
                        transform: `rotateY(${rotation}deg)`,
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {items.map((item, i) => {
                        const itemAngle = i * anglePerItem;
                        const totalRotation = rotation % 360;
                        const relativeAngle = (itemAngle + totalRotation + 360) % 360;
                        const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
                        const opacity = Math.max(0.25, 1 - normalizedAngle / 180);

                        return (
                            <div
                                key={item.poster}
                                role="group"
                                aria-label={item.title}
                                style={{
                                    position: 'absolute',
                                    width: '110px', height: '165px',
                                    transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                                    left: '50%', top: '50%',
                                    marginLeft: '-55px', marginTop: '-82px',
                                    opacity,
                                    transition: 'opacity 0.3s linear',
                                }}
                            >
                                <div style={{
                                    position: 'relative', width: '100%', height: '100%',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(139,92,246,0.15)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    background: 'rgba(8,11,24,0.8)',
                                    backdropFilter: 'blur(12px)',
                                }}>
                                    <img
                                        src={item.poster}
                                        alt={item.title}
                                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                        loading="lazy"
                                    />
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, width: '100%',
                                        padding: '20px 8px 8px',
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 100%)',
                                        color: '#fff',
                                    }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.65rem', lineHeight: 1.2, marginBottom: '2px' }}>{item.title}</div>
                                        <div style={{ fontSize: '0.55rem', opacity: 0.6 }}>{item.year} · {item.genre}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
);

CircularGallery.displayName = 'CircularGallery';
export { CircularGallery };
