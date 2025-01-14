import {
  flip,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import React, { ReactNode, useEffect } from "react";
import { useMenu } from "../../store/menu";

import PropTypes from "prop-types";

interface MenuProps<T> {
  id: string | number;
  children: ReactNode | ((data: T) => ReactNode);
}

function Menu<T>({ children, id }: MenuProps<T>) {
  const menu = useMenu((s) => s.menu);
  const setMenu = useMenu((s) => s.setMenu);
  const open = Boolean(id === menu?.id);
  const reference = menu?.reference;

  const { refs, floatingStyles, elements, context } = useFloating({
    open,
    onOpenChange: (o) => !o && setMenu(null),
    middleware: [flip(), shift()],
    placement: "bottom-end",
    elements: { reference },
  });

  const dismiss = useDismiss(context, { enabled: open });

  const { getFloatingProps } = useInteractions([dismiss]);
  
  useEffect(() => {
    const currentElement = elements.floating;
    const elm = currentElement?.parentNode?.children[1];
    if (!elm) return;
    if (open) elm.classList.add("stop-scroll");
    return () => elm.classList.remove("stop-scroll");
  }, [open, elements]);

  if (!open) return null;

  return (
    <ul
      ref={refs.setFloating}
      style={floatingStyles}
      {...getFloatingProps()}
      onClick={() => setMenu(null)}
      className="menu bg-base-100 p-1 rounded-lg text-xs shadow z-50"
    >
      {open &&
        (typeof children === "function" ? children(menu?.data) : children)}
    </ul>
  );
}

Menu.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
};

function Item({
  onClick,
  children,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <li onClick={onClick}>
      <a className="pl-3 pr-6 py-3 whitespace-nowrap">{children}</a>
    </li>
  );
}

Menu.Item = Item;

export default Menu;
