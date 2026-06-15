import {
  Placement,
  autoUpdate,
  flip,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useTransitionStatus,
  useTransitionStyles,
} from "@floating-ui/react";
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
  onClose?: () => void;
}

function Menu<T>({ children, placement = "bottom-start", clientPoint = false, id, onClose }: MenuProps<T>) {
  const render = useRef(0);

  const menu = useMenu((s) => s.menu);
  const setMenu = useMenu((s) => s.setMenu);
  const wrapper = useRef<HTMLDivElement | null>(null);
  const reference = menu?.reference;
  const open = Boolean(id === menu?.id);

  const { refs, context, floatingStyles } = useFloating({
    open,
    onOpenChange: (opened) => !opened && handleClose(),
    middleware: [flip({ padding: 50 }), shift({ padding: 50 })],
    placement,
    elements: { reference: clientPoint ? wrapper.current : reference?.target },
    transform: false,
    whileElementsMounted: (reference, floating, update) =>
      autoUpdate(reference, floating, update, {
        ancestorResize: true,
        ancestorScroll: false,
        elementResize: true,
        layoutShift: false,
      }),
  });

  const { styles } = useTransitionStyles(context, {
    initial: ({ placement }) => {
      const style = { opacity: 0, clipPath: "" };

      switch (placement) {
        case "top-start":
          style.clipPath = "polygon(0 30%, 30% 30%, 30% 100%, 0 100%)";
          break;
        case "top-end":
          style.clipPath = "polygon(30% 30%, 100% 30%, 100% 100%, 30% 100%)";
          break;
        case "bottom-start":
          style.clipPath = "polygon(0 0, 30% 0, 30% 30%, 0 30%)";
          break;
        case "bottom-end":
          style.clipPath = "polygon(30% 0, 100% 0, 100% 30%, 30% 30%)";
          break;
        default:
          break;
      }

      return style;
    },
    open: () => ({ opacity: 1, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)" }),
    duration: 100,
  });
  const { isMounted, status } = useTransitionStatus(context);
  const dismiss = useDismiss(context, { enabled: isMounted });
  const { getFloatingProps } = useInteractions([dismiss]);

  useEffect(() => {
    if (status === "unmounted") setMenu(null);
  }, [status]);

  useEffect(() => {
    if (!reference) return;
    if (!wrapper.current) return;
    if (!clientPoint) return;

    const x = reference.clientX + "px";
    const y = reference.clientY + "px";

    wrapper.current.style.left = x;
    wrapper.current.style.top = y;
  }, [reference, clientPoint]);

  const handleClose = () => {
    onClose?.();
    setMenu({ ...menu, id: "" });
  };

  return (
    <div className="">
      {isMounted && <div className="fixed inset-0 z-[1000] " onClick={handleClose} />}
      {clientPoint && <div ref={wrapper} className="fixed z-[1000]" />}
      {isMounted && (
        <ul
          className={`menu bg-base-100/80 backdrop-blur-lg backdrop-saturate-150 border border-base-content/10 rounded-xl p-1 text-xs shadow-2xl z-[1000] overflow-hidden`}
          ref={refs.setFloating}
          {...getFloatingProps()}
          style={{ ...floatingStyles, ...styles }}
        >
          {typeof children === "function" ? children(menu?.data) : children}
        </ul>
      )}
    </div>
  );
}

Menu.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
};

function Item({
  onClick,
  children,
  canClose = true,
  canSelect = true,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  canClose?: boolean;
  canSelect?: boolean;
  className?: string;
}) {
  const setMenu = useMenu((s) => s.setMenu);

  function handleClick() {
    const menu = useMenu.getState().menu;
    if (!canSelect) return;
    onClick?.();
    if (canClose) {
      setMenu({ ...menu, id: "" });
    }
  }

  return (
    <li onClick={handleClick}>
      <a className={`pl-3 pr-6 py-3 whitespace-nowrap ${className}`}>{children}</a>
    </li>
  );
}

Menu.Item = Item;

export default Menu;
