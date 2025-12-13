"use client";

// =================================================================================================
// CONTEXT ANCHOR: HEADER ACTIONS COMPONENT (app/components/HeaderActions.tsx)
// =================================================================================================
// PURPOSE: To solve a UX problem where secondary actions ("Show Completed", "Settings") were
// cluttering the header and competing with the primary "New Thread" button. This component
// consolidates these less-frequently-used actions into a single, non-intrusive dropdown menu,
// which reduces cognitive load and elevates "New Thread" as the clear primary action.
//
// DEPENDENCIES:
// - @headlessui/react: For the accessible `Menu` (dropdown) and `Switch` components.
// - lucide-react: For icons (`MoreVertical`, `Settings`, `Eye`, `EyeOff`).
// - framer-motion: For subtle transition animations on the dropdown.
//
// STRATEGY:
// - A `MoreVertical` icon serves as the single, subtle trigger for all secondary actions.
// - The `Menu` component from Headless UI handles all dropdown logic, including accessibility.
// - `Menu.Items` are used to house the individual actions: the "Show Completed" toggle and the "Settings" button.
// - This component is self-contained and receives all necessary state and handlers as props from `page.tsx`.
// =================================================================================================

import React, { Fragment } from "react";
import { Menu, Switch } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Settings, Eye, EyeOff } from "lucide-react";

interface HeaderActionsProps {
  showCompleted: boolean;
  onToggleShowCompleted: (value: boolean) => void;
  onOpenSettings: () => void;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({
  showCompleted,
  onToggleShowCompleted,
  onOpenSettings,
}) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
          <MoreVertical className="h-5 w-5" aria-hidden="true" />
        </Menu.Button>
      </div>
      <AnimatePresence>
        <Menu.Items
          as={motion.div}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={true}
          className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <div
                  className={`${
                    active ? "bg-gray-100" : ""
                  } group flex w-full items-center justify-between rounded-md px-2 py-2 text-sm text-gray-900 transition-colors`}
                >
                  <div className="flex items-center">
                    {showCompleted ? (
                      <Eye className="mr-2 h-5 w-5 text-gray-600" />
                    ) : (
                      <EyeOff className="mr-2 h-5 w-5 text-gray-400" />
                    )}
                    Show Completed
                  </div>
                  <Switch
                    checked={showCompleted}
                    onChange={onToggleShowCompleted}
                    className={`${
                      showCompleted ? "bg-orange-600" : "bg-gray-200"
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                  >
                    <span
                      className={`${
                        showCompleted ? "translate-x-6" : "translate-x-1"
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                </div>
              )}
            </Menu.Item>
          </div>
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onOpenSettings}
                  className={`${
                    active ? "bg-gray-100" : ""
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 transition-colors`}
                >
                  <Settings
                    className="mr-2 h-5 w-5 text-gray-500"
                    aria-hidden="true"
                  />
                  Settings
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </AnimatePresence>
    </Menu>
  );
};

export default HeaderActions;
