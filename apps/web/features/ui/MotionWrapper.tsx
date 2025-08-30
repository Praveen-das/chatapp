import { HTMLMotionProps, motion } from "framer-motion";
import { PropsWithChildren } from "react";

export default function FramerWrapper({ children, className,...props }: PropsWithChildren<HTMLMotionProps<"div">>) {
  return (
    <motion.div
      {...props}
      className={`${className} backdrop-blur-xl`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      {children}
    </motion.div>
  );
}
