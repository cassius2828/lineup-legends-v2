import React from "react";

const Hamburger = ({
  toggleMenu,
  isOpen,
}: {
  toggleMenu: () => void;
  isOpen: boolean;
}) => {
  return (
    <button
      onClick={toggleMenu}
      className="relative z-50 flex flex-col gap-1.5 p-2 transition-opacity hover:opacity-80 md:hidden"
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <span
        className={`h-0.5 w-6 bg-white/90 transition-all ${
          isOpen ? "translate-y-2 rotate-45" : ""
        }`}
      />
      <span
        className={`h-0.5 w-6 bg-white/90 transition-all ${
          isOpen ? "opacity-0" : ""
        }`}
      />
      <span
        className={`h-0.5 w-6 bg-white/90 transition-all ${
          isOpen ? "-translate-y-2 -rotate-45" : ""
        }`}
      />
    </button>
  );
};

export default Hamburger;
