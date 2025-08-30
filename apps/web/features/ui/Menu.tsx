import { Placement, flip, shift, useDismiss, useFloating, useInteractions } from "@floating-ui/react";
import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useMenu } from "../../store/menu";

import PropTypes from "prop-types";
import { AnimatePresence, motion } from "framer-motion";

interface MenuProps<T> {
  id: string | number;
  clientPoint?: boolean;
  stopScroll?: boolean;
  placement?: Placement;
  children: ReactNode | ((data: T) => ReactNode);
}

function Menu<T>({ children, placement = "bottom-start", clientPoint = false, stopScroll = false, id }: MenuProps<T>) {
  const menu = useMenu((s) => s.menu);
  const setMenu = useMenu((s) => s.setMenu);
  const wrapper = useRef<HTMLDivElement | null>(null);
  const reference = menu?.reference;
  const open = Boolean(id === menu?.id);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (o) => !o && setMenu(null),
    middleware: [flip(), shift()],
    placement,
    elements: { reference: clientPoint ? wrapper.current : reference?.target },
    transform: false,
  });
  const dismiss = useDismiss(context, { enabled: open });
  const { getFloatingProps } = useInteractions([dismiss]);

  useEffect(() => {
    if (!reference) return;
    if (!wrapper.current) return;
    if (!clientPoint) return;

    const x = reference.clientX + "px";
    const y = reference.clientY + "px";

    wrapper.current.style.left = x;
    wrapper.current.style.top = y;
  }, [reference, clientPoint]);

  const variants = useMemo(() => {
    const _variants = {
      hidden: { opacity: 0, clipPath: "" },
      visible: { opacity: 1, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)" },
    };

    switch (context.placement) {
      case "top-start":
        _variants.hidden.clipPath = "polygon(0 30%, 30% 30%, 30% 100%, 0 100%)";
        break;
      case "top-end":
        _variants.hidden.clipPath = "polygon(30% 30%, 100% 30%, 100% 100%, 30% 100%)";
        break;
      case "bottom-start":
        _variants.hidden.clipPath = "polygon(0 0, 30% 0, 30% 30%, 0 30%)";
        break;
      case "bottom-end":
        _variants.hidden.clipPath = "polygon(30% 0, 100% 0, 100% 30%, 30% 30%)";
        break;
      default:
        break;
    }

    return _variants;
  }, [context.placement]);

  return (
    <div>
      {open && <div className="fixed inset-0 z-[1000]" />}
      {clientPoint && <div ref={wrapper} className="fixed z-[1000]" />}
      <AnimatePresence key={context.placement}>
        {open && (
          <motion.ul
            className={`menu bg-base-100/70 backdrop-blur-lg p-1 rounded-lg text-xs shadow z-[1000] overflow-hidden`}
            initial="hidden"
            exit="hidden"
            animate="visible"
            transition={{ duration: 0.08 }}
            onClick={() => setMenu(null)}
            variants={variants}
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={floatingStyles}
          >
            {typeof children === "function" ? children(menu?.data) : children}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

Menu.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
};

function Item({ onClick, children }: { children: ReactNode; onClick?: () => void }) {
  return (
    <li onClick={onClick}>
      <a className="pl-3 pr-6 py-3 whitespace-nowrap">{children}</a>
    </li>
  );
}

Menu.Item = Item;

export default Menu;
