import React, { ForwardedRef, PropsWithChildren, forwardRef, useCallback, useRef } from "react";
import { motion } from "framer-motion";

type Props = {
  isSelected?: boolean;
};

const MotionWrapper = forwardRef(
  ({ children, isSelected }: PropsWithChildren<Props>, ref: ForwardedRef<HTMLDivElement>) => {
    const wrapper = useRef<HTMLDivElement | null>(null);

    const hideElm = () => {
      if (wrapper.current && isSelected) {
        wrapper.current.style.scale = "0.9";
        wrapper.current.style.opacity = "0";
      }
    };

    const showElm = () => {
      if (wrapper.current) {
        wrapper.current.style.scale = "1";
        wrapper.current.style.opacity = "1";
      }
    };

    return (
      <motion.div
        transition={{ delay: 0.15 }}
        ref={ref}
        initial={{ opacity: 0 }}
        exit={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        layout
        onLayoutAnimationStart={hideElm}
        onLayoutAnimationComplete={showElm}
      >
        <div ref={wrapper} className="duration-150">
          {children}
        </div>
      </motion.div>
    );
  }
);

export default MotionWrapper;
