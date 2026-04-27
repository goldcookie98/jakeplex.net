import { useRef } from 'react';

export default function TiltCard({ className, style, children, onClick, role, tabIndex, onKeyDown }) {
    const ref = useRef();

    const onMove = (e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        const cx = r.width / 2, cy = r.height / 2;
        const rx = ((y - cy) / cy) * -11, ry = ((x - cx) / cx) * 11;
        el.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.06) translateZ(0)`;
        el.style.boxShadow = `0 25px 70px rgba(0,0,0,0.8), 0 0 50px rgba(139,92,246,0.35), 0 0 100px rgba(6,182,212,0.1)`;
        el.style.borderColor = `rgba(139,92,246,0.5)`;
        el.style.setProperty('--shine-x', (x / r.width * 100) + '%');
        el.style.setProperty('--shine-y', (y / r.height * 100) + '%');
    };

    const onLeave = () => {
        const el = ref.current;
        if (!el) return;
        el.style.transition = 'transform 0.55s cubic-bezier(0.23,1,0.32,1), box-shadow 0.55s ease, border-color 0.55s ease';
        el.style.transform = '';
        el.style.boxShadow = '';
        el.style.borderColor = '';
        setTimeout(() => { if (el) el.style.transition = ''; }, 560);
    };

    return (
        <div
            ref={ref}
            className={`tilt-card-wrap ${className || ''}`}
            style={style}
            onClick={onClick}
            role={role}
            tabIndex={tabIndex}
            onKeyDown={onKeyDown}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
        >
            {children}
        </div>
    );
}
