
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

import React from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { Switch, Listbox } from "@headlessui/react";
import { useTheme, ThemeColor } from "../providers/ThemeProvider";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {

  
  // STRATEGY: Connect to global ThemeProvider.
  // We map the global 'theme' string to a binary 'isDarkMode' boolean for the Switch component.
  // 'system' theme is treated as not-dark (false) for the toggle state unless resolved,
  // but here we simplify to: dark state is triggered only by explicit 'dark' theme.
  const { theme, setTheme, themeColor, setThemeColor, customColor, setCustomColor } = useTheme();
  
  // CONSTRAINT: Simple toggle logic assuming 'dark' vs 'light'. 
  // 'system' resets to default, but the toggle forces explicit choice.
  const isDarkMode = theme === "dark";

  const handleThemeChange = (checked: boolean) => {
    // STRATEGY: Explicitly set light or dark, overriding system preference.
    setTheme(checked ? "dark" : "light");
  };

  const colors: { name: string; value: ThemeColor; bgClass: string }[] = [
    { name: "Orange", value: "orange", bgClass: "bg-orange-500" },
    { name: "Green", value: "green", bgClass: "bg-green-500" },
    { name: "Blue", value: "blue", bgClass: "bg-blue-500" },
  ];

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
            className="bg-surface rounded-lg shadow-xl w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()} // CONSTRAINT: Prevents modal from closing when clicking inside the panel.
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-text-secondary hover:bg-background hover:text-text-primary transition-colors"
                aria-label="Close settings"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-text-primary">
                  Dark Mode
                </span>
                <Switch
                  checked={isDarkMode}
                  onChange={handleThemeChange}
                  className={`${
                    isDarkMode ? "bg-primary" : "bg-border"
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                >
                  <span
                    className={`${
                      isDarkMode ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-text-primary">
                  Accent Color
                </span>
                <div className="flex items-center gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setThemeColor(color.value)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                        color.bgClass
                      } ${themeColor === color.value ? "ring-2 ring-offset-2 ring-text-primary" : ""}`}
                      aria-label={`Select ${color.name} theme`}
                    >
                      {themeColor === color.value && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </button>
                  ))}
                  
                  {/* Custom Color Picker */}
                  <div className="relative flex items-center justify-center">
                    <button
                        onClick={() => setThemeColor("custom")}
                        className={`w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 transition-transform hover:scale-110 ${themeColor === "custom" ? "ring-2 ring-offset-2 ring-text-primary" : ""}`}
                         aria-label="Select Custom theme"
                    >
                         {themeColor === "custom" && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                    </button>
                    {/* Hidden input overlay that triggers on click? Or just separate input? 
                        Analysis: Best UX is probably a button that activates the mode, 
                        and if active, maybe shows the color or allows picking. 
                        Let's put the input on top with opacity 0 if we want direct click-to-open, 
                        BUT we want to be able to select "custom" as a mode even if we don't change color.
                        Better: Separate tiny input or just trigger click on input.
                    */}
                    <input 
                        type="color"
                        value={customColor}
                        onChange={(e) => {
                            setCustomColor(e.target.value);
                            if (themeColor !== "custom") setThemeColor("custom");
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Choose custom color"
                    />
                  </div>
                </div>
              </div>

              {/* Font Size Dropdown */}
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-text-primary">
                  Font Size
                </span>
                <div className="w-40">
                  <Listbox value={fontSize} onChange={setFontSize}>
                    <div className="relative">
                      <Listbox.Button className="relative w-full cursor-default rounded-md bg-surface py-1.5 pl-3 pr-10 text-left text-sm text-text-primary border border-border focus:outline-none focus:ring-2 focus:ring-primary">
                        <span className="block truncate">{fontSize}</span>
                      </Listbox.Button>
                      <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-surface py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                        {fontSizes.map((size) => (
                          <Listbox.Option
                            key={size}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-4 pr-4 ${
                                active
                                  ? "bg-primary-light text-primary-text"
                                  : "text-text-primary"
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

            <div className="px-4 py-3 bg-background border-t border-border text-right">
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
