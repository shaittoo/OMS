"use client";

import Dropdown from "./Dropdown";

export default function Navbar() {
  return (
    <div className="bg-white">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav
          aria-label="Global"
          className="flex p-6 lg:px-8"
        >
          <div className="flex lg:flex-1">
            <button>
              <img alt="" src="/assets/OMSLOGO.png" className="h-8 w-auto" />
            </button>
          </div>
          <div className="lg:flex lg:justify-end">
            <Dropdown />
          </div>
        </nav>
      </header>
    </div>
  );
}

