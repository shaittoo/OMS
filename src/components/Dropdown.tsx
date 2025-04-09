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
        <div className="py-1">
          <Link href="/" passHref legacyBehavior>
            <MenuItem as="a" className="inline-flex w-full rounded-full hover:bg-gray-100">
              <img alt="" src="/assets/home.svg" className="h-8 w-auto"/>
            </MenuItem>
          </Link>
          <Link href="/guestviewevents" passHref legacyBehavior>
            <MenuItem as="a" className="inline-flex w-full rounded-full hover:bg-gray-100">
              <img alt="" src="/assets/feature_search.svg" className="h-8 w-auto"/>
            </MenuItem>
          </Link>
          <Link href="/settings" passHref legacyBehavior>
            <MenuItem as="a" className="inline-flex w-full rounded-full hover:bg-gray-100">
              <img alt="" src="/assets/settings.svg" className="h-8 w-auto"/>
            </MenuItem>
          </Link>
        </div>
      </MenuItems>
    </Menu>
  )
}