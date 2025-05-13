import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react"; // using lucide-react icons
import { BiSearch } from "react-icons/bi";

const Dropdown = ({
  options,
  selected,
  setSelected,
  renderLabel = (value) => String(value),
  className = "",
  buttonClassName = "",
  optionClassName = "",
  maxHeight = "200px", // Default max height for the dropdown
  searchPlaceholder = "Search..." // Placeholder text for the search input
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    renderLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  // Reset search term when dropdown closes
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`text-gray-700 dark:text-gray-300 border px-2 rounded-full flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${buttonClassName}`}
      >
        <span>{renderLabel(selected)}</span>
        <span className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <ChevronDown size={12} />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[200px] bg-white dark:bg-gray-900 border border-gray-200 rounded-md shadow-lg overflow-hidden right-1">
          <div className="px-3 py-2 border-b">
            <div className="relative">
              <div className="absolute inset-y-0 top-1 flex items-center pl-2 text-sm">
                <BiSearch className="text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-8 pr-3 py-[2px] border rounded-full focus:outline-none focus:ring-2 text-[10px] focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
                placeholder={searchPlaceholder}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <ul 
            className="overflow-y-auto"
            style={{ maxHeight }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={String(option)}
                  onClick={() => {
                    setSelected(option);
                    setOpen(false);
                  }}
                  className={`text-gray-700 w-full dark:text-gray-300 border-b px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer ${optionClassName}`}
                >
                  {renderLabel(option)}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-gray-500 dark:text-gray-400 text-[10px]">No results found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dropdown;