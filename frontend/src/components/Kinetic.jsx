import { motion } from "framer-motion";

export const KineticLines = ({ lines, className = "", delay = 0 }) => (
  <h2 className={className}>
    {lines.map((line, i) => (
      <span key={i} className="block overflow-hidden pb-1">
        <motion.span
          className="block"
          initial={{ y: "110%" }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: delay + i * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {line}
        </motion.span>
      </span>
    ))}
  </h2>
);
