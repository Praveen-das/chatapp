import { Placement, flip, shift, useDismiss, useFloating, useInteractions } from "@floating-ui/react";
import React, { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMenu } from "../../store/menu";

import PropTypes from "prop-types";
import { createPortal } from "react-dom";

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

  const { refs, floatingStyles, elements, context } = useFloating({
    open,
    onOpenChange: (o) => !o && setMenu(null),
    middleware: [flip(), shift()],
    placement,
    elements: { reference: clientPoint ? wrapper.current : reference?.target },
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

  if (!open) return null;

  return createPortal(
    <div>
      {open && <div className="fixed inset-0 z-[1000]" />}
      {clientPoint && <div ref={wrapper} className="fixed z-[1000]" />}
      <ul
        ref={refs.setFloating}
        style={floatingStyles}
        {...getFloatingProps()}
        onClick={() => setMenu(null)}
        className="menu bg-base-100 p-1 rounded-lg text-xs shadow z-[1000]"
      >
        {open && (typeof children === "function" ? children(menu?.data) : children)}
      </ul>
    </div>,document.body
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
