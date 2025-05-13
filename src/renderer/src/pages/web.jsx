import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, Play, Pause } from 'lucide-react';
import axios from 'axios';

export default function PersistentCountdownTimer() {
  const [timerData, setTimerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isServerActive, setIsServerActive] = useState(false);
  const [error, setError] = useState(null);
  const [localRemainingTime, setLocalRemainingTime] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Use the correct API endpoint as specified
  const API_URL = `http://localhost:80/api/Others`;

  // Function to fetch timer data from the server
  const fetchTimerData = async () => {
    try {
      const response = await axios.get(API_URL);
      const data = response.data.official_template_time; // Access the nested structure
      
      // Check if we received valid timer data
      if (!data || !data.totalTime) {
        throw new Error("Invalid timer data format");
      }
      
      setTimerData(data);
      
      // Calculate actual remaining time based on server data
      let remainingMs = data.remainingTime;
      
      // Calculate true remaining time if timer is running
      if (data.startTime && !isCompleted) {
        const startTimeMs = new Date(data.startTime).getTime();
        const currentTimeMs = new Date().getTime();
        const elapsedSinceStartMs = currentTimeMs - startTimeMs;
        
        // Calculate based on total time and elapsed time
        remainingMs = Math.max(0, data.totalTime - data.usedTime - elapsedSinceStartMs);
      }
      
      // If timer is completed
      if (remainingMs <= 0) {
        setIsCompleted(true);
        setLocalRemainingTime(0);
        setIsRunning(false);
        
        // Notify server if we detected completion
        notifyTimerCompleted();
      } else {
        setLocalRemainingTime(remainingMs);
        // Check if timer is actively running according to server
        setIsRunning(data.startTime !== null);
      }
      
      setIsServerActive(true);
      setIsLoading(false);
      setError(null);
    } catch (err) {
      setIsServerActive(false);
      setError(err.message || "Couldn't connect to server");
      setIsLoading(false);
    }
  };
  
  // Notify server when timer completes
  const notifyTimerCompleted = async () => {
    try {
      await axios.post(API_URL, {
        official_template_time: {
          totalTime: timerData.totalTime,
          startTime: timerData.startTime,
          usedTime: timerData.totalTime,
          remainingTime: 0
        }
      });
    } catch (err) {
      console.error("Error notifying timer completion:", err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchTimerData();
    
    // Set up frequent syncing with server
    const syncInterval = setInterval(() => {
      if (isServerActive && !isCompleted) {
        fetchTimerData();
      }
    }, 30000); // Sync every 30 seconds
    
    // Register an event listener for when the page becomes visible again
    // This ensures we get fresh data when user returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isServerActive) {
        fetchTimerData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup function
    return () => {
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isServerActive, isCompleted]);
  
  // Sync timer progress with server periodically when running
  useEffect(() => {
    let syncProgressInterval;
    
    if (isRunning && isServerActive && !isCompleted) {
      syncProgressInterval = setInterval(() => {
        // Sync progress with server
        syncTimerProgress();
      }, 60000); // Sync progress every minute
    }
    
    return () => {
      clearInterval(syncProgressInterval);
    };
  }, [isRunning, isServerActive, isCompleted]);
  
  // Function to sync timer progress with server
  const syncTimerProgress = async () => {
    if (!isServerActive || !timerData || !isRunning || isCompleted) return;
    
    // Calculate used time
    const usedTime = timerData.totalTime - localRemainingTime;
    
    try {
      await axios.post(API_URL, {
        official_template_time: {
          totalTime: timerData.totalTime,
          startTime: timerData.startTime,
          usedTime: usedTime,
          remainingTime: localRemainingTime
        }
      });
    } catch (err) {
      console.error("Error syncing timer progress:", err);
    }
  };

  // Local timer countdown when running
  useEffect(() => {
    let intervalId;
    let lastTickTime = Date.now();
    
    if (isRunning && localRemainingTime !== null && localRemainingTime > 0) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const elapsedMs = now - lastTickTime;
        lastTickTime = now;
        
        // More accurate time tracking by using actual elapsed time
        setLocalRemainingTime(prevTime => {
          const newTime = Math.max(0, prevTime - elapsedMs);
          
          // Check if timer completed
          if (newTime <= 0) {
            setIsCompleted(true);
            setIsRunning(false);
            notifyTimerCompleted();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    // When component unmounts or timer state changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      // If we're running when the component unmounts or changes state, 
      // sync with server one last time to preserve progress
      if (isRunning && localRemainingTime > 0 && !isCompleted) {
        syncTimerProgress();
      }
    };
  }, [isRunning, isCompleted]);
  
  // Save timer state to local storage as a backup
  useEffect(() => {
    if (timerData && localRemainingTime !== null) {
      localStorage.setItem('timerState', JSON.stringify({
        remainingTime: localRemainingTime,
        isRunning,
        isCompleted,
        lastUpdated: new Date().toISOString()
      }));
    }
  }, [localRemainingTime, isRunning, isCompleted, timerData]);

  // Format time in DD:HH:MM:SS
  const formatTimeRemaining = (milliseconds) => {
    if (!milliseconds && milliseconds !== 0) return '0D : 0H : 0M : 0S';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${days}D : ${hours}H : ${minutes}M : ${seconds}S`;
  };

  // Calculate percentage of time remaining
  const calculatePercentage = () => {
    if (!timerData || localRemainingTime === null) return 0;
    return (localRemainingTime / timerData.totalTime) * 100;
  };

  // Start the timer - both locally and on server
  const startTimer = async () => {
    if (!isServerActive || !timerData || isCompleted) return;
    
    try {
      const startTime = new Date().toISOString();
      
      // Update local state immediately for responsiveness
      setIsRunning(true);
      setTimerData(prev => ({
        ...prev,
        startTime: startTime
      }));
      
      // Calculate used time (should be 0 at start)
      const usedTime = 0;
      
      // Make actual API call to start timer on server
      await axios.post(API_URL, {
        official_template_time: {
          totalTime: timerData.totalTime,
          startTime: startTime,
          usedTime: usedTime,
          remainingTime: timerData.totalTime
        }
      });
      
      // Fetch updated timer data from server
      await fetchTimerData();
    } catch (err) {
      setError("Failed to start timer: " + err.message);
      console.error(err);
      // Reset running state if server update failed
      setIsRunning(false);
    }
  };

  // Pause the timer - both locally and on server
  const pauseTimer = async () => {
    if (!isServerActive || !timerData || isCompleted) return;
    
    try {
      // Update local state immediately for responsiveness
      setIsRunning(false);
      
      // Calculate current used time based on remaining time
      const usedTime = timerData.totalTime - localRemainingTime;
      
      // Make actual API call to pause timer on server
      await axios.post(API_URL, {
        official_template_time: {
          totalTime: timerData.totalTime,
          startTime: null, // Set to null when paused
          usedTime: usedTime,
          remainingTime: localRemainingTime
        }
      });
      
      // Fetch updated timer data from server
      await fetchTimerData();
    } catch (err) {
      setError("Failed to pause timer: " + err.message);
      console.error(err);
      // Reset running state if server update failed
      setIsRunning(true);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Persistent Timer</h2>
        {isServerActive ? (
          <span className="flex items-center text-green-500">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">Server Connected</span>
          </span>
        ) : (
          <span className="flex items-center text-red-500">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">Server Offline</span>
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading timer data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md flex items-start">
          <AlertCircle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-medium text-red-800">Connection Error</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <p className="text-red-700 mt-1">Timer is inactive until connection is restored.</p>
          </div>
        </div>
      ) : isCompleted ? (
        <div className="text-center py-6">
          <div className="bg-red-100 text-red-800 rounded-lg p-6 mb-6">
            <h3 className="text-2xl font-bold mb-2">Time Expired</h3>
            <p>Your timer has reached zero.</p>
          </div>
          <Clock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <div className="text-3xl font-bold text-gray-700">
            {formatTimeRemaining(0)}
          </div>
          <p className="text-gray-500 mt-2">Time remaining</p>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">Refresh the page or come back later - your timer status will persist.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <div className="absolute inset-0">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    className="text-gray-200"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                  {/* Progress circle */}
                  <circle
                    className="text-blue-600"
                    strokeWidth="8"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (calculatePercentage() / 100) * 264}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
              </div>
              <div className="flex flex-col items-center">
                <Clock className="h-12 w-12 text-blue-600 mb-2" />
                {isRunning ? (
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">RUNNING</span>
                ) : (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">PAUSED</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-800">
              {formatTimeRemaining(localRemainingTime)}
            </h3>
            <p className="text-gray-600 mt-1">remaining time</p>
          </div>

          <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full"
              style={{ width: `${calculatePercentage()}%` }}
            ></div>
          </div>

          <div className="flex justify-center mt-4">
            <button
              onClick={isRunning ? pauseTimer : startTimer}
              disabled={!isServerActive}
              className={`flex items-center px-4 py-2 rounded-lg ${
                isRunning
                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              } transition-colors ${
                !isServerActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause Timer
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Timer
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-500 block mb-1">Total Time</span>
              <span className="font-medium">
                {formatTimeRemaining(timerData?.totalTime)}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-500 block mb-1">Used Time</span>
              <span className="font-medium">
                {formatTimeRemaining(timerData?.totalTime - localRemainingTime)}
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-4">
            {timerData?.startTime ? (
              <div>Started: {new Date(timerData.startTime).toLocaleString()}</div>
            ) : (
              <div>Not started yet</div>
            )}
            <div className="mt-2 text-blue-600">
              Timer will persist across page reloads
            </div>
          </div>
        </div>
      )}
    </div>
  );
}