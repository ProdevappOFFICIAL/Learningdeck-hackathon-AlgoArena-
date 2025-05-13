import { useEffect, useState } from 'react';

const ThemeSwitcher = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    window.api.loadTheme().then((savedTheme) => {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    });
  }, []);

  const applyTheme = (t) => {
    document.documentElement.classList.toggle('dark', t === 'dark');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
    window.api.saveTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 px-4 rounded bg-gray-200 dark:bg-gray-800 text-black dark:text-white"
    >
      Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
    </button>
  );
};

export default ThemeSwitcher;
