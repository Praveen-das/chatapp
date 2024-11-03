import React, {
  CSSProperties,
  forwardRef,
  memo,
  MouseEvent,
  MouseEventHandler,
  ReactNode,
} from "react";
import { Menu as _Menu, Transition } from "@headlessui/react";
import { flip, Placement, shift, useFloating } from "@floating-ui/react";

interface IMenu {
  buttonIcon?: ReactNode;
  menuItems: any[];
  placement?: Placement;
  dense?: boolean;
  static?: boolean;
  style?: CSSProperties;
  refElm?: { x: number; y: number };
  onClose?: () => void;
}

function Menu({
  buttonIcon,
  menuItems,
  placement,
  dense = false,
  static: _static = false,
  style,
  refElm,
  onClose,
}: IMenu) {
  const { refs, floatingStyles } = useFloating({
    middleware: [flip(), shift()],
    placement,
    transform: false,
  });

  return (
    <>
      <_Menu
        as="div"
        className="relative inline-block text-left text-xs"
        style={style}
      >
        {buttonIcon && (
          <_Menu.Button
            ref={refs.setReference}
            onClick={(e) => e.stopPropagation()}
          >
            {buttonIcon}
          </_Menu.Button>
        )}
        {refElm && (
          <span
            ref={refs.setReference}
            style={{
              position: "fixed",
              top: refElm.y,
              left: refElm.x,
            }}
          />
        )}
        <Transition afterLeave={onClose}>
          <Items
            static={_static}
            dense={dense}
            ref={refs.setFloating}
            style={floatingStyles}
          >
            {menuItems.map(
              (option, i) =>
                option && (
                  <Item dense={dense} onClick={option.handler} key={i}>
                    {option.label}
                  </Item>
                )
            )}
          </Items>
        </Transition>
      </_Menu>
    </>
  );
}

function Item({
  children,
  dense = false,
  onClick,
}: {
  children: ReactNode;
  dense?: boolean;
  onClick: () => void;
}) {
  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    onClick();
  }

  return (
    <_Menu.Item>
      <div
        onClick={handleClick}
        className={`hover:bg-[--hover-primary] hover:text-white w-full flex items-center ${dense ? "p-2" : "py-3 pl-2 pr-6"}  whitespace-nowrap rounded-md cursor-pointer`}
      >
        {children}
      </div>
    </_Menu.Item>
  );
}

const Items = forwardRef<
  HTMLDivElement,
  {
    children: ReactNode;
    dense?: boolean;
    className?: string;
    static?: boolean;
    style?: CSSProperties;
  }
>(({ children, className, dense = false, ...rest }, ref) => {
  return (
    <_Menu.Items
      ref={ref}
      className={`w-max rounded-md bg-base-100 drop-shadow-md ring-2 ring-black/5 text-base-content focus:outline-none z-10 ${className}`}
      {...rest}
    >
      <div className={`relative ${dense ? "p-0.5" : "p-1"} z-50`}>
        {children}
      </div>
    </_Menu.Items>
  );
});

Menu.Wrapper = _Menu;
Menu.Items = Items;
Menu.Item = Item;

export default memo(Menu);
