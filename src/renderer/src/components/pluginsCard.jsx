import { useState, useRef, useEffect } from 'react';
import { BiChevronRight, BiExtension } from 'react-icons/bi';
import { IoOpenOutline, IoCloseOutline } from 'react-icons/io5';
import { FaWindowMaximize, FaWindowRestore } from 'react-icons/fa';

export default function PluginCards() {
  const products = [
    {
      name: 'LearningDeck Guide',
      price: 'LearningDeck Guide',
      description: 'Access all your learning materials offline with our desktop application. Sync progress across devices seamlessly.',
      componentType: 'iframe',
      componentSrc: 'https://learningdeck.vercel.app/guide'
    },
    {
      name: 'Performance Manager',
      price: 'Plugin for checking students performance',
      description: 'Track student progress, analyze performance metrics, and generate comprehensive reports.',
      componentType: 'unavailable'
    },
    {
      name: 'CCTV Footage',
      price: 'Plugin for connecting to Local or Online CCTV footage',
      description: 'Connect and manage surveillance footage from multiple sources. Includes motion detection and alert systems.',
      componentType: 'unavailable'
    }
  ];

  // Track which dialog is currently open
  const [activeDialog, setActiveDialog] = useState(null);

  // Track active dialogs - now a Set to allow multiple open dialogs
  const [openDialogs, setOpenDialogs] = useState(new Set());

  const toggleDialog = (index) => {
    setOpenDialogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Track which dialog should be on top (highest z-index)
  const [topDialog, setTopDialog] = useState(null);

  // Bring a dialog to the front when clicked
  const bringToFront = (index) => {
    setTopDialog(index);
  };

  return (
    <div className="flex flex-col w-full text-base gap-y-4">
      <div className='flex flex-row w-full justify-between'>
        <h2 className="font-medium text-[10px] dark:text-gray-300">Explore Mininapps</h2>
        <BiChevronRight />
      </div>
   
      <div className="gap-4 overflow-x-auto items-center grid lg:flex md:hidden">
        {products.map((product, index) => (
          <ProductCard 
            key={index} 
            name={product.name} 
            price={product.price} 
            description={product.description}
            componentType={product.componentType}
            componentSrc={product.componentSrc}
            isActive={openDialogs.has(index)}
            isTop={topDialog === index}
            onClick={() => toggleDialog(index)}
            onClose={() => toggleDialog(index)}
            onFocus={() => bringToFront(index)}
          />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ 
  name, 
  price, 
  description, 
  isActive, 
  isTop, 
  onClick, 
  onClose, 
  onFocus, 
  componentType, 
  componentSrc 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [dialogPosition, setDialogPosition] = useState({ 
    x: Math.max(50, Math.floor(Math.random() * window.innerWidth * 0.6)), 
    y: Math.max(50, Math.floor(Math.random() * window.innerHeight * 0.4))
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [preMaximizePosition, setPreMaximizePosition] = useState({ x: 0, y: 0 });
  const [preMaximizeSize, setPreMaximizeSize] = useState({ width: 320, height: 'auto' });
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const dialogRef = useRef(null);
  const dragRef = useRef(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  // Handle start of drag
  const handleMouseDown = (e) => {
    if (dragRef.current && dragRef.current.contains(e.target) && !isMaximized) {
      isDragging.current = true;
      
      // Calculate the offset from the pointer to the dialog's top-left corner
      const rect = dialogRef.current.getBoundingClientRect();
      offset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      // Prevent text selection during drag
      e.preventDefault();
    }
  };
  
  // Handle maximize/restore window
  const toggleMaximize = (e) => {
    e.stopPropagation();
    
    if (!isMaximized) {
      // Store current position and size before maximizing
      setPreMaximizePosition({ ...dialogPosition });
      if (dialogRef.current) {
        const rect = dialogRef.current.getBoundingClientRect();
        setPreMaximizeSize({ width: rect.width, height: rect.height });
      }
      // Maximize the window
      setIsMaximized(true);
    } else {
      // Restore to previous position and size
      setDialogPosition({ ...preMaximizePosition });
      setIsMaximized(false);
    }
  };

  // Handle drag movement
  const handleMouseMove = (e) => {
    if (isDragging.current) {
      const newX = e.clientX - offset.current.x;
      const newY = e.clientY - offset.current.y;
      
      setDialogPosition({
        x: newX,
        y: newY
      });
    }
  };

  // Handle end of drag
  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Set up and cleanup event listeners
  useEffect(() => {
    if (isActive) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isActive]);

  // Reset iframe loading state when dialog opens
  useEffect(() => {
    if (isActive && componentType === 'iframe') {
      setIframeLoading(true);
      setIframeError(false);
    }
  }, [isActive, componentType]);

  const handleIframeLoad = () => {
    setIframeLoading(false);
  };

  const handleIframeError = () => {
    setIframeLoading(false);
    setIframeError(true);
  };

  const getSvgLogo = () => {
    if (name.includes('CCTV')) {
      return (
        <svg viewBox="0 0 80 80" className={`w-16 h-16 transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
          <rect width="80" height="80" rx="8" fill="#1F2937" />
          <circle cx="28" cy="30" r="8" fill={isHovered ? '#60A5FA' : '#3B82F6'} className="transition-colors duration-300" />
          <circle cx="52" cy="30" r="8" fill={isHovered ? '#FDBA74' : '#F97316'} className="transition-colors duration-300" />
          <rect x="20" y="46" width="40" height="14" rx="2" fill={isHovered ? '#5EEAD4' : '#2DD4BF'} className="transition-colors duration-300" />
        </svg>
      );
    } else if (name.includes('Performance')) {
      return (
        <svg viewBox="0 0 80 80" className={`w-16 h-16 transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
          <rect width="80" height="80" rx="8" fill={isHovered ? '#3B82F6' : '#2563EB'} className="transition-colors duration-300" />
          <rect x="20" y="25" width="25" height="30" fill="white" />
          <polygon points="45,40 55,30 55,50" fill="white" />
          {isHovered && (
            <g className="animate-pulse">
              <rect x="25" y="30" width="15" height="3" fill="#2563EB" />
              <rect x="25" y="36" width="15" height="3" fill="#2563EB" />
              <rect x="25" y="42" width="15" height="3" fill="#2563EB" />
            </g>
          )}
        </svg>
      );
    } else if (name.includes('Guide')) {
      return (
        <svg viewBox="0 0 80 80" className={`w-16 h-16 transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
          <rect width="80" height="80" rx="8" fill={isHovered ? '#3B82F6' : '#2563EB'} className="transition-colors duration-300" />
          <rect x="16" y="20" width="48" height="30" rx="2" fill="white" />
          <rect x="28" y="54" width="24" height="6" rx="1" fill="white" />
          <rect x="36" y="50" width="8" height="4" fill="white" />
          {isHovered && (
            <g>
              <circle cx="40" cy="35" r="10" fill="#2563EB" className="animate-pulse" />
              <path d="M36,35 L38,37 L44,33" stroke="white" strokeWidth="2" fill="none" />
            </g>
          )}
        </svg>
      );
    }
  };

  // Render content based on component type
  const renderComponentContent = () => {
    if (componentType === 'iframe') {
      return (
        <div className="w-full">
          {iframeLoading && (
            <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-700 rounded">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {iframeError && (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-100 dark:bg-gray-700 rounded">
              <div className="text-red-500 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-[10px] text-gray-600 dark:text-gray-300">Failed to load content</p>
              <button 
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded  hover:bg-blue-600 transition-colors"
                onClick={() => {
                  setIframeLoading(true);
                  setIframeError(false);
                  // Force reload by changing the key
                  setTimeout(() => {
                    setIframeLoading(false);
                  }, 100);
                }}
              >
                Retry
              </button>
            </div>
          )}
          
          <iframe 
            src={componentSrc}
            style={{ 
              display: iframeLoading ? 'none' : 'block',
              width: '100%',
              height: isMaximized ? 'calc(100vh - 100px)' : '500px',
              border: 'none',
              borderRadius: '4px'
            }}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin"
            title={name}
          />
        </div>
      );
    } else if (componentType === 'unavailable') {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-100 dark:bg-gray-700 rounded">
          <div className="text-gray-500 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Coming Soon</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center mt-2 px-2">{description}</p>
        </div>
      );
    }
    
    return (
      <div className="p-4">
        <p className="text-[10px] text-gray-600 dark:text-gray-300">{description}</p>
      </div>
    );
  };

  return (
    <>
      <div 
        className="bg-white dark:bg-gray-900 rounded border dark:border-gray-700 min-w-72 flex flex-col hover:cursor-pointer hover:shadow-lg transition-shadow duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        <div className="flex items-start space-x-4">
          {getSvgLogo()}
          <div className="flex flex-col flex-grow">
            <h3 className="text-[10px] font-medium text-gray-900 dark:text-gray-300 py-1">{name}</h3>
            <span className="text-[10px] text-gray-500 mt-1">{price}</span>
            <div className="flex-grow"></div>
          </div>
          <IoOpenOutline className={`font-medium text-blue-600 rounded-full p-1 m-1 text-xl transition-all duration-300 ${isHovered ? 'bg-blue-100 -rotate-12' : ''}`}/>
        </div>
      </div>

      {/* Draggable Dialog */}
      {isActive && (
        <div 
          ref={dialogRef}
          className={`fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 ${isTop ? 'z-50' : 'z-40'}`}
          style={{ 
            left: isMaximized ? '0' : `${dialogPosition.x}px`, 
            top: isMaximized ? '0' : `${dialogPosition.y}px`,
            width: isMaximized ? '100%' : '320px',
            height: isMinimized ? 'auto' : isMaximized ? '100%' : 'auto',
            transition: 'all 0.2s ease',
            maxHeight: isMaximized ? '100%' : '80vh',
            overflow: 'hidden'
          }}
          onMouseDown={(e) => {
            handleMouseDown(e);
            onFocus();
          }}
          onClick={() => onFocus()}
        >
          {/* Dialog Header / Drag Handle */}
          <div 
            ref={dragRef}
            className={`flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 ${isTop ? 'bg-blue-50 dark:bg-blue-900' : 'bg-gray-50 dark:bg-gray-900'} rounded-t-lg cursor-move`}
          >
            <div className="flex items-center space-x-2">
              <BiExtension className='dark:text-white'/>
              <h3 className="font-medium  text-gray-900 dark:text-white ml-2">{name}</h3>
            </div>
            <div className="flex items-center">
              <button 
                onClick={toggleMaximize}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mr-1"
              >
                {isMaximized ? (
                  <FaWindowRestore className="h-3 w-3" />
                ) : (
                  <FaWindowMaximize className="h-3 w-3" />
                )}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mr-1"
              >
                {isMinimized ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <IoCloseOutline className="text-xl" />
              </button>
            </div>
          </div>
          
          {/* Dialog Content */}
          {!isMinimized && (
            <div className="p-4 overflow-auto" style={{ maxHeight: isMaximized ? 'calc(100vh - 40px)' : '500px' }}>
              {renderComponentContent()}
            </div>
          )}
        </div>
      )}
    </>
  );
}