'use client'

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import Link from 'next/link';

export default function Dropdown() {
  return (
    <Menu as="div" className="relative inline-block">
      <div>
        <MenuButton className="inline-flex w-full justify-center rounded-full px-3 text-sm font-semibold">
          <img alt="" src="/assets/dropdown.svg" className="h-8 w-auto"/>
        </MenuButton>
      </div>
      <MenuItems
        className="absolute w-full justify-center px-3 py-3 mt-2 rounded-full bg-black"
      >
        <MenuItem>
          {({ active }) => (
            <Link href="/" className={`${active ? 'bg-gray-100' : ''} block w-full rounded-full`}>
              <span className="inline-flex w-full items-center">
                <img alt="" src="/assets/home.svg" className="h-8 w-auto"/>
              </span>
            </Link>
          )}
        </MenuItem>
        <MenuItem>
          {({ active }) => (
            <Link href="/guestviewevents" className={`${active ? 'bg-gray-100' : ''} block w-full rounded-full`}>
              <span className="inline-flex w-full items-center">
                <img alt="" src="/assets/feature_search.svg" className="h-8 w-auto"/>
              </span>
            </Link>
          )}
        </MenuItem>
        <MenuItem>
          {({ active }) => (
            <Link href="/settings" className={`${active ? 'bg-gray-100' : ''} block w-full rounded-full`}>
              <span className="inline-flex w-full items-center">
                <img alt="" src="/assets/settings.svg" className="h-8 w-auto"/>
              </span>
            </Link>
          )}
        </MenuItem>
      </MenuItems>
    </Menu>
  )
}