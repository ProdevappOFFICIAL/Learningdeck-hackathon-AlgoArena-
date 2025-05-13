import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import LearnDeckLogo from '../assets/lds.png'
import { BsMoon } from 'react-icons/bs';
import { BiChevronDown, BiChevronUp } from 'react-icons/bi';

export default function Settings() {
    const [theme, setTheme] = useState('light');
  
    useEffect(() => {
      // Load saved theme when component mounts
      window.api.loadTheme().then((savedTheme) => {
        setTheme(savedTheme);
        applyTheme(savedTheme);
        // Sync the dark setting with theme
        setSettings(prev => ({
          ...prev,
          dark: savedTheme === 'dark'
        }));
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
      // Update dark setting to stay in sync
      setSettings(prev => ({
        ...prev,
        dark: newTheme === 'dark'
      }));
    };

  const [settings, setSettings] = useState({
    appUpdates: true,
    dark: theme === 'dark', // Sync with theme state
    sync: false,
    offlinePermissions: false,
    videoAutoplay: true
  });
  
  const [aboutExpanded, setAboutExpanded] = useState(false);

  const toggleSetting = (setting) => {
    if (setting === 'dark') {
      toggleTheme(); // Use the existing theme toggle logic
    } else {
      setSettings(prev => ({
        ...prev,
        [setting]: !prev[setting]
      }));
    }
  };
  
  const toggleAboutSection = () => {
    setAboutExpanded(!aboutExpanded);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen border-l dark:border-gray-700 font-sans text-gray-800 dark:text-gray-300 select-none text-[10px]">
         <div className="flex items-center justify-between border-b dark:border-gray-700 p-3">
            <span className="text-gray-800 dark:text-white text-sm">Settings</span>
          </div>

      {/* App Updates */}
      <div className="bg-white dark:bg-gray-900 rounded-md border dark:border-gray-700 mb-4 p-4 flex items-center justify-between m-4">
        <div className="flex items-start gap-4">
          <div className="p-1">
            <RefreshCw size={24} className="text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <h2 className="text-[10px] font-medium">App updates</h2>
            <p className="text-gray-600 dark:text-gray-500 text-[10px]">
              Automatically download and install app updates. Updates for system components are controlled by <span className="text-blue-500">Windows Update</span>.
            </p>
          </div>
        </div>
        <div>
          <button 
            className="relative w-10 h-5 rounded-full transition-colors duration-300 ease-in-out focus:outline-none"
            style={{
              backgroundColor: settings.appUpdates ? '#3b82f6' : '#d1d5db',
            }}
            onClick={() => toggleSetting('appUpdates')}
          >
            <span 
              className="absolute left-0 top-0.5 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out"
              style={{
                transform: settings.appUpdates ? 'translateX(20px)' : 'translateX(2px)',
              }}
            />
          </button>
        </div>
      </div>
      
      {/* Dark Mode */}
      <div className="bg-white dark:bg-gray-900 rounded-md border dark:border-gray-700 mb-4 p-4 flex items-center justify-between m-4">
        <div className="flex items-start gap-4">
          <div className="p-1">
            <BsMoon size={24} className="text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <h2 className="text-[10px] font-medium">Enable Dark Mode</h2>
            <p className="text-gray-600 dark:text-gray-500 text-[10px]">
             Use dark mode custom theme
            </p>
          </div>
        </div>
        <div>
          <button 
            className="relative w-10 h-5 rounded-full transition-colors duration-300 ease-in-out focus:outline-none"
            style={{
              backgroundColor: settings.dark ? '#3b82f6' : '#d1d5db',
            }}
            onClick={() => toggleSetting('dark')}
          >
            <span 
              className="absolute left-0 top-0.5 w-4 h-4 bg-white dark:bg-gray-900 rounded-full shadow-md transform transition-transform duration-300 ease-in-out"
              style={{
                transform: settings.dark ? 'translateX(20px)' : 'translateX(2px)',
              }}
            />
          </button>
        </div>
      </div>

      
      {/* Sync */}
      <div className="bg-white dark:bg-gray-900 rounded-md border dark:border-gray-700 mb-4 p-4 flex items-center justify-between m-4">
        <div className="flex items-start gap-4">
          <div className="p-1">
            <RefreshCw size={24} className="text-gray-600 dark:text-gray-500" />
          </div>
          <div>
            <h2 className="text-[10px] font-medium">Sync on Startup</h2>
            <p className="text-gray-600 dark:text-gray-500 text-[10px]">
              Automatically download and push updates without prompt
            </p>
          </div>
        </div>
        <div>
          <button 
            className="relative w-10 h-5 rounded-full transition-colors duration-300 ease-in-out focus:outline-none"
            style={{
              backgroundColor: settings.sync ? '#3b82f6' : '#d1d5db',
            }}
            onClick={() => toggleSetting('sync')}
          >
            <span 
              className="absolute left-0 top-0.5 w-4 h-4 bg-white dark:bg-gray-900 rounded-full shadow-md transform transition-transform duration-300 ease-in-out"
              style={{
                transform: settings.sync ? 'translateX(20px)' : 'translateX(2px)',
              }}
            />
          </button>
        </div>
      </div>

      {/* About Section */}
      <h1 className="text-[10px] font-medium mb-4 mt-8 px-4">About</h1>
      <div className="bg-white dark:bg-gray-900 rounded-md border dark:border-gray-700 mb-4 m-4">
        {/* About Header - Clickable */}
        <div 
          className="p-4 flex items-center justify-between cursor-pointer"
          onClick={toggleAboutSection}
        >
          <div className="flex items-center gap-4">
            <div className="p-1">
              <img
                src={LearnDeckLogo}
                width={90}
                height={180}
                className="rounded-full bg-blend-multiply bg-white dark:bg-gray-900 px-2 py-[1px] border dark:border-gray-700"
              />
            </div>
            <div>
              <h2 className="text-[10px] font-medium">LearningDeck Advanced CBT Exam Manager</h2>
              <p className="text-gray-600 dark:text-gray-300 text-[10px]">
                By <span className="text-blue-500 hover:cursor-pointer">LearningDeck | Cooperation</span>.
              </p>
            </div>
          </div>
          <div className="transition-transform duration-300" style={{ transform: aboutExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <BiChevronDown size={20} />
          </div>
        </div>
        
        {/* Expandable Content with Animation */}
        <div 
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ 
            maxHeight: aboutExpanded ? '500px' : '0',
            opacity: aboutExpanded ? 1 : 0
          }}
        >
          <div className="px-4 pb-4 pt-2 border-t dark:border-gray-700">
            <div className="text-[10px] mb-3">
              <p className="font-medium mb-1">Version</p>
              <p className="text-gray-600 dark:text-gray-300">1.0.0 (Build 1)</p>
            </div>
            
            <div className="text-[10px] mb-3">
              <p className="font-medium mb-1">License</p>
              <p className="text-blue-500">LearningDeck License Terms</p>
              <p className="font-medium mb-1">Terms of use</p>
              <p className="text-blue-500">LearningDeck Terms use</p>
            </div>
            
            <div className="text-[10px] mb-3">
              <p className="font-medium mb-1">Support</p>
              <p className="text-gray-600 dark:text-gray-300">Email: <span className="text-blue-500">learningdeckorg@gmail.com</span></p>
              <p className="text-gray-600 dark:text-gray-300">Website: <span className="text-blue-500">learningdeck.vercel.app</span></p>
            </div>
            
            <div className="text-[10px]">
              <p className="text-gray-500">© 2025 LearningDeck Corporation. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}