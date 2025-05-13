import { useState } from "react";

const Tooltip = ({ text, children, position = "top" }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative flex items-center justify-center "
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`absolute z-10 px-2 py-1 text-[10px] text-black shadow bg-white dark:text-gray-300 dark:bg-gray-900 rounded-r-md border dark:border-gray-600  transition-opacity duration-200 ${
            position === "top" ? "bottom-full mb-2" :
            position === "bottom" ? "top-full mt-2" :
            position === "left" ? "right-full mr-2" :
            "left-full"
          }`}
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
