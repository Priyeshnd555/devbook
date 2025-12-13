"use client";

// =================================================================================================
// CONTEXT ANCHOR: SETTINGS MODAL (app/components/SettingsModal.tsx)
// =================================================================================================
// PURPOSE: This component renders a modal dialog for application-wide settings, such as theme adjustments.
// It is designed to be displayed as an overlay on top of the main application content.
//
// DEPENDENCIES:
// - REACT: For component state and lifecycle management.
// - FRAMER-MOTION: Used for smooth entry and exit animations of the modal.
// - LUCIDE-REACT: Provides the 'X' icon for the close button.
// - @headlessui/react: Used for accessible Switch (toggle) and Listbox (dropdown) components.
//
// INVARIANTS:
// - The modal's visibility is controlled exclusively by the `isOpen` prop passed from its parent.
// - The modal always calls the `onClose` function to signal a close request; it does not manage its own visibility state.
//
// STRATEGY:
// - The component uses a fixed-position div as a backdrop to cover the screen and capture outside clicks to close the modal.
// - The main modal panel (`motion.div`) stops event propagation (`onClick={(e) => e.stopPropagation()}`)
//   to prevent the modal from closing when a user clicks inside it.
// - AnimatePresence from Framer Motion handles the unmounting of the component, allowing exit animations to complete.
// - The settings controls inside (e.g., for dark mode, font size) currently manage their own local state.
//   In a real implementation, they would likely be connected to a global state manager or context.
// =================================================================================================

import React, { Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Switch, Listbox } from "@headlessui/react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  // STRATEGY: These state variables are local placeholders.
  // A real implementation would lift this state up to a global context or hook
  // to actually apply the theme changes to the application.
  const [darkMode, setDarkMode] = React.useState(false);
  const [fontSize, setFontSize] = React.useState("Normal");
  const fontSizes = ["Small", "Normal", "Large"];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()} // CONSTRAINT: Prevents modal from closing when clicking inside the panel.
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="Close settings"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-gray-700">
                  Dark Mode
                </span>
                <Switch
                  checked={darkMode}
                  onChange={setDarkMode}
                  className={`${
                    darkMode ? "bg-orange-600" : "bg-gray-200"
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                >
                  <span
                    className={`${
                      darkMode ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>

              {/* Font Size Dropdown */}
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-gray-700">
                  Font Size
                </span>
                <div className="w-40">
                  <Listbox value={fontSize} onChange={setFontSize}>
                    <div className="relative">
                      <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500">
                        <span className="block truncate">{fontSize}</span>
                      </Listbox.Button>
                      <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                        {fontSizes.map((size) => (
                          <Listbox.Option
                            key={size}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-4 pr-4 ${
                                active
                                  ? "bg-orange-100 text-orange-900"
                                  : "text-gray-900"
                              }`
                            }
                            value={size}
                          >
                            {size}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>
                  </Listbox>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-right">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors font-medium"
                >
                    Done
                </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
