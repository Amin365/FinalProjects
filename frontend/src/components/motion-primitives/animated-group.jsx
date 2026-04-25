import React from "react";
import { motion } from "framer-motion";

// Lightweight wrapper around motion.div that applies container/item variants to children.
export function AnimatedGroup({
  variants,
  children,
  className = "",
  as: Component = motion.div,
}) {
  const isMotionComponent = Component === motion.div || Component === motion.section;
  const Wrapper = isMotionComponent ? Component : motion.div;

  return (
    <Wrapper
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-16%" }}
      variants={variants?.container || variants}
      className={className}
    >
      {React.Children.map(children, (child, idx) => {
        if (!React.isValidElement(child)) return child;
        const childVariants = variants?.item || variants;
        // Pass variants to motion elements; otherwise wrap in motion.div.
        if (child.type && child.type !== motion.div && child.type !== motion.section) {
          return (
            <motion.div variants={childVariants} key={child.key || idx}>
              {child}
            </motion.div>
          );
        }
        return React.cloneElement(child, {
          variants: child.props.variants || childVariants,
          key: child.key || idx,
        });
      })}
    </Wrapper>
  );
}
