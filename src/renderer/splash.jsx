import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import '../renderer/src/assets/main.css'
import '../renderer/src/components/drag.css'
import LearnDeck from '../renderer/src/assets/lds.png'
import LearnDeckLogo from '../renderer/src/assets/icon.png'
import { BiMinus } from 'react-icons/bi'
import { VscChromeMaximize, VscClose } from 'react-icons/vsc'
import { TbLoader, TbLoader2, TbLoader3 } from 'react-icons/tb'

const SplashScreen = () => {
  const minimizeWindow = () => window?.api?.minimizeWindow();
  const closeWindow = () => window?.api?.closeSplashWindow();
  
  // State for loading status and percentage
  const [loadingStatus, setLoadingStatus] = useState("Starting LearningDeck Exam Manager");
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  
  // Effect to handle the loading sequence
  useEffect(() => {
    const statusSequence = [
      { status: "Starting LearningDeck Exam Manager", duration: 1500 },
      { status: "Initializing", duration: 1500 },
      { status: "Almost done", duration: 4000 },
      { status: "Opening Application", duration: 1500 },
      { status: "Opening Application....", duration: 1600 },
      { status: "Opening Application......", duration: 1500 },
      { status: "Opening Application........", duration: 1600 }
    ];
    
    let currentIndex = 0;
    let timer;
    
    // Function to update loading status
    const updateStatus = () => {
      if (currentIndex < statusSequence.length) {
        setLoadingStatus(statusSequence[currentIndex].status);
        
        // Start percentage counter when we reach "Almost done"
        if (statusSequence[currentIndex].status === "Almost done") {
          startPercentageCounter();
        }
        
        timer = setTimeout(() => {
          currentIndex++;
          updateStatus();
        }, statusSequence[currentIndex].duration);
      }
    };
    
    // Function to increment percentage from 1 to 100
    const startPercentageCounter = () => {
      let percentage = 1;
      const percentageInterval = setInterval(() => {
        if (percentage <= 100) {
          setLoadingPercentage(percentage);
          percentage++;
        } else {
          clearInterval(percentageInterval);
        }
      }, 40); // Roughly 4 seconds to reach 100%
      
      // Clean up the interval
      return () => clearInterval(percentageInterval);
    };
    
    // Start the status sequence
    updateStatus();
    
    // Clean up timers if component unmounts
    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50 rounded draggable text-[10px] p-4 border">
      <div className="flex flex-row w-full items-center justify-between">
        <img
          src={LearnDeck}
          width={90}
          height={180}
          className="rounded-full bg-blend-multiply scale-95 bg-white dark:bg-gray-900 px-2 py-[1px] border"
        />
        <header className="px-2 flex gap-x-3 py-1 text-black non-draggable bg-gray-300/20 border bg-white dark:bg-gray-900300 rounded-full">
          <button
            onClick={minimizeWindow}
            className="hover:bg-gray-600/20 p-[1px] hover:rounded-full dark:text-white"
            id="non-draggable"
          >
            <BiMinus width={14} height={14} />
          </button>

          <button
            className="hover:bg-gray-600/20 p-[1px] hover:rounded-full dark:text-white"
            onClick={() => {
              closeWindow()
            }}
          >
            <VscClose width={14} height={14} />
          </button>
        </header>
      </div>

      <div className="flex flex-col w-full h-full items-center justify-center gap-3">
        <img
          src={LearnDeckLogo}
          width={90}
          height={180}
          className="rounded-full bg-blend-multiply bg-white dark:bg-gray-900 px-2 py-[1px] border"
        />
        <p className="font-medium">LearningDeck | CBT Examination Manager</p>
      </div>
    
      <div className="w-full mt-8 w-64">
             <div className="flex items-center italic text-gray-600 mb-2">
               <TbLoader3 className="animate-spin mr-2" size={16} />
               <span>
                 {loadingStatus}
                 {loadingStatus === "Almost done" && loadingPercentage > 0 && ` ${loadingPercentage}%`}
               </span>
             </div>
             <div hidden className="w-full bg-gray-200 rounded-full h-1">
               <div 
                 className="bg-blue-500 h-1 rounded-full transition-all duration-300 ease-out" 
                 style={{ width: `${loadingStatus === "Almost done" ? loadingPercentage : 
                   loadingStatus === "Starting LearningDeck Exam Manager" ? 25 : 
                   loadingStatus === "Initializing" ? 50 : 
                   loadingStatus === "Getting started" ? 75 : 0}%` }}
               ></div>
             </div>
           </div>
          
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('splash')).render(
  <React.StrictMode>
    <SplashScreen />
  </React.StrictMode>
)