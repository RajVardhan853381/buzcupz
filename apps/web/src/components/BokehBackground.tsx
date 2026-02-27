import { motion } from 'framer-motion';

export function BokehBackground() {
  const orbs = [
    { size: 300, x: '10%', y: '20%', color: 'from-gold-400/30 to-warm-400/20', delay: 0 },
    { size: 200, x: '70%', y: '10%', color: 'from-warm-300/25 to-gold-300/15', delay: 0.5 },
    { size: 250, x: '80%', y: '60%', color: 'from-gold-500/20 to-warm-500/15', delay: 1 },
    { size: 180, x: '20%', y: '70%', color: 'from-warm-400/20 to-gold-400/10', delay: 1.5 },
    { size: 150, x: '50%', y: '30%', color: 'from-gold-300/25 to-warm-300/15', delay: 2 },
    { size: 220, x: '30%', y: '85%', color: 'from-warm-300/20 to-gold-300/10', delay: 2.5 },
  ];

  return (
    <div className="bokeh-bg">
      {orbs.map((orb, index) => (
        <motion.div
          key={index}
          className={`bokeh-orb bg-gradient-to-br ${orb.color}`}
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.1, 1],
            x: [0, 20, 0],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 8,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
