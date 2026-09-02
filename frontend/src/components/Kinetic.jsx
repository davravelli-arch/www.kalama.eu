import { motion } from "framer-motion";

export const KineticLines = ({ lines, className = "", delay = 0 }) => (
  <motion.h2 className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
    {lines.map((line, i) => (
      <span key={i} className="block overflow-hidden pb-1">
        <motion.span
          className="block"
          variants={{ hidden: { y: "110%" }, show: { y: 0 } }}
          transition={{ delay: delay + i * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {line}
        </motion.span>
      </span>
    ))}
  </motion.h2>
);
