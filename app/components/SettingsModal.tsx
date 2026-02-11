
// =================================================================================================
// CONTEXT ANCHOR: SETTINGS MODAL (app/components/SettingsModal.tsx)
// =================================================================================================
// PURPOSE: This component renders a modal dialog for application-wide settings, including:
//          - Dark/Light Mode Toggle
//          - Accent Color Selection (Presets + Custom Picker)
//          - Font Size Adjustment
//
// DEPENDENCIES:
// - REACT: Component state.
// - FRAMER-MOTION: Animations.
// - @headlessui/react: Accessible UI primitives.
// - useTheme: Hook for global theme state.
//
// STRATEGY:
// - PRESETS: Renders a list of predefined color buttons.
// - CUSTOM PICKER: Uses a visually distinct button (conic gradient) with a hidden native color input
//   to allow infinite color choice while maintaining a custom UI appearance.
// =================================================================================================

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Plus } from "lucide-react";
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
  const themeContext = useTheme();

  // ===============================================================================================
  // FAILURE BOUNDARY: Enforce component is used inside a ThemeProvider.
  // ===============================================================================================
  // STRATEGY: The component's core functionality depends entirely on the theme context.
  // If the context is missing, it cannot render or function correctly. We throw a specific
  // error to provide immediate, actionable feedback to the developer, preventing the app
  // from running in a broken state. This aligns with the "fail fast" and "immediate feedback"
  // principles.
  if (!themeContext) {
    throw new Error("SettingsModal must be used within a ThemeProvider");
  }
  const { theme, setTheme, themeColor, setThemeColor, customColor, setCustomColor, fontSize, setFontSize } = themeContext;


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

  // ===============================================================================================
  // ROBUST DATA HANDLING: Unify font size state and display representation.
  // ===============================================================================================
  // STRATEGY: Instead of converting between state values (e.g., "small") and display
  // values (e.g., "Small") using helper functions, we define a single source of truth.
  // This array of objects makes the component more robust by eliminating the risk of
  // inconsistencies that can arise from string manipulation. The `find` operation is
  // safe and will gracefully handle any unexpected `fontSize` state.
  const fontSizes = [
    { value: "small", label: "Small" },
    { value: "normal", label: "Normal" },
    { value: "large", label: "Large" },
  ];
  const selectedFontSize = fontSizes.find(fs => fs.value === fontSize) || fontSizes[1];

  if (!isOpen) return null;
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
                  className={`${isDarkMode ? "bg-primary" : "bg-border"
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                >
                  <span
                    className={`${isDarkMode ? "translate-x-6" : "translate-x-1"
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
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${color.bgClass
                        } ${themeColor === color.value ? "ring-2 ring-offset-2 ring-text-primary" : ""}`}
                      aria-label={`Select ${color.name} theme`}
                    >
                      {themeColor === color.value && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </button>
                  ))}

                  {/* Custom Color Picker */}
                  <div className="relative flex items-center justify-center ml-2 pl-2 border-l border-border">
                    <button
                      onClick={() => setThemeColor("custom")}
                      className={`group relative w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 overflow-hidden ${themeColor === "custom" ? "ring-2 ring-offset-2 ring-text-primary" : ""}`}
                      aria-label="Select Custom theme"
                      style={{ background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }}
                    >
                      {/* Visual overlay to make it look button-like but show the rainbow */}
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />

                      {themeColor === "custom" ? (
                        <Check className="w-4 h-4 text-white drop-shadow-md z-10" />
                      ) : (
                        <Plus className="w-4 h-4 text-white drop-shadow-md z-10 opacity-70 group-hover:opacity-100" />
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
                <div className="w-32 relative">
                  <Listbox value={fontSize} onChange={setFontSize}>
                    <div className="relative">
                      <Listbox.Button className="relative w-full cursor-default rounded-lg py-2 pl-3 pr-10 text-left bg-background border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm">
                        <span className="block truncate">{selectedFontSize.label}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <svg
                            className="h-4 w-4 text-text-secondary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </Listbox.Button>
                      <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-surface border border-border py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                        {fontSizes.map((size) => (
                          <Listbox.Option
                            key={size.value}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-primary/10 text-primary" : "text-text-primary"
                              }`
                            }
                            value={size.value}
                          >
                            {({ selected }) => (
                              <>
                                <span
                                  className={`block truncate ${selected ? "font-medium" : "font-normal"
                                    }`}
                                >
                                  {size.label}
                                </span>
                                {selected ? (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                    <Check className="h-4 w-4" aria-hidden="true" />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>
                  </Listbox>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 bg-background border-t border-border flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background"
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
