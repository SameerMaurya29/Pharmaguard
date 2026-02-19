import { useEffect, useRef } from "react";

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

export default function DnaParticles() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let raf = 0;
    let w = 0;
    let h = 0;

    const particles = Array.from({ length: 70 }).map(() => ({
      x: rand(0, 1),
      y: rand(0, 1),
      r: rand(0.8, 2.2),
      s: rand(0.08, 0.22),
      a: rand(0.08, 0.26),
      hue: rand(160, 200),
    }));

    const resize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // soft vignette
      const g = ctx.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.45, Math.max(w, h) * 0.7);
      g.addColorStop(0, "rgba(34,211,238,0.05)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        p.y -= p.s * 0.002;
        if (p.y < -0.05) p.y = 1.05;
        const x = p.x * w + Math.sin((p.y * 10 + performance.now() * 0.001) * 1.6) * 18;
        const y = p.y * h;

        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${p.a})`;
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fill();

        // tiny DNA "ladder" line
        if (Math.random() < 0.12) {
          ctx.strokeStyle = "rgba(34,211,238,0.08)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x - 6, y);
          ctx.lineTo(x + 6, y);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}

