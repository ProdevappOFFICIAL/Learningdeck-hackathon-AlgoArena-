import axios from 'axios'
import { BellRing, Copy, Loader, Loader2, LucideRouter, XCircle } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import {
  BiCopy,
  BiDotsHorizontal,
  BiFile,
  BiImage,
  BiImages,
  BiLink,
  BiLoader,
  BiLogIn,
  BiPlay,
  BiStop,
  BiSync,
  BiWifi,
  BiWifiOff
} from 'react-icons/bi'
import { BsFillRouterFill, BsRouter, BsSpeedometer } from 'react-icons/bs'
import { CgSync } from 'react-icons/cg'
import { FiLoader } from 'react-icons/fi'
import { VscRemote, VscVmActive } from 'react-icons/vsc'
import Popover from './popover'
import { LuBellRing } from 'react-icons/lu'
import { LoaderIcon } from 'react-hot-toast'
import { MdSecurity, MdSettingsEthernet, MdWeb } from 'react-icons/md'
import AnimatedProgressBar from './progress'
import { FcGoogle } from 'react-icons/fc'
import Ripple from './RippleEffect'
import NetworkScanner from './RippleEffect'
import { TbLoader, TbLoader2, TbLoader3, TbRadioactive } from 'react-icons/tb'
import { FaRunning } from 'react-icons/fa'

const ButtomBar = () => {
  const [exam, setExam] = useState(null) // Changed from '' to null
  const [serverInfo, setServerInfo] = useState({ ip: '', port: '' })
  const [isServerInfoLoaded, setIsServerInfoLoaded] = useState(false)
  const [assets, setAssets] = useState([])
  const [fileTypeFilter, setFileTypeFilter] = useState('all')
  const [serverError, setServerError] = useState(false) // Added to track server connection errors
  const [lastChecked, setLastChecked] = useState(null) // Added to track last check time

  // Load server info first
  useEffect(() => {
    const loadServerInfo = async () => {
      try {
        const info = await window.api.getServerInfo()
        setServerInfo(info)
        setIsServerInfoLoaded(true)
      } catch (error) {
        console.error("Failed to load server info:", error)
        setServerError(true)
      }
    }
    
    loadServerInfo()
  }, [])

  // Only fetch exams after server info is loaded and periodically check the server status
  useEffect(() => {
    const getAllExam = async () => {
      if (!isServerInfoLoaded || !serverInfo.ip || !serverInfo.port) return;
      
      try {
        const response = await axios.get(
          `http://${serverInfo.ip}:${serverInfo.port}/api/ExamCombination`
        )
        setExam(response.data.length)
        setServerError(false) // Reset server error on successful connection
        setLastChecked(new Date()) // Update last checked timestamp
      } catch (error) {
        console.error("Failed to fetch exams:", error)
        setServerError(true)
        setLastChecked(new Date()) // Update last checked timestamp even on error
      }
    }
    
    // Initial fetch when server info is loaded
    if (isServerInfoLoaded) {
      getAllExam()
      
      // Load assets after server info is loaded
      window.api.getAssets().then(setAssets).catch(err => {
        console.error("Failed to load assets:", err)
      })
      
      // Set up real-time polling interval (check every 3 seconds)
      const interval = setInterval(() => {
        getAllExam();
      }, 3000);
      
      // Clean up interval on component unmount
      return () => clearInterval(interval);
    }
  }, [isServerInfoLoaded, serverInfo])

  // Handle Drag & Drop
  const handleDrop = async (event) => {
    event.preventDefault()
    const files = [...event.dataTransfer.files].map((file) => file.path)
    const importedFiles = await window.api.importFiles(files)
    setAssets((prev) => [...prev, ...importedFiles])
  }

  // Render server status based on different states with real-time indication
  const renderServerStatus = () => {
    // Format last checked time if available
    const lastCheckDisplay = lastChecked ? 
      `Last checked: ${lastChecked.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}` : '';
    
    if (!isServerInfoLoaded) {
      return (
        <div className="flex items-center px-2 py-1 hover:bg-gray-300/20 hover:rounded-md hover:cursor-pointer">
          <TbLoader3 className="mr-1 animate-spin" /> Loading server info...
        </div>
      )
    } else if (serverError || exam === null) {
      return (
        <Popover
          placement="top-left-live"
          trigger={
            <div className="flex items-center px-2 py-1 hover:bg-gray-300/20 hover:rounded-md hover:cursor-pointer">
              <BiStop className="mr-1 text-red-600" /> Server is not running
              <span className="ml-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            </div>
          }
        >
          <div className="p-2 text-xs">
            <p>Server status: <span className="text-red-500 font-bold">OFFLINE</span></p>
            <p>{lastCheckDisplay}</p>
            <p>Checking every 3 seconds...</p>
          </div>
        </Popover>
      )
    } else {
      return (
        <Popover
          placement="top-left-live"
          trigger={
            <div className="flex items-center px-2 py-1 hover:bg-gray-300/20 hover:rounded-md hover:cursor-pointer text-blue-600">
              <TbRadioactive className="mr-1 animate-spin" /> Server is running
              <span className="ml-1 w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>
          }
        >
          <div className="p-2 text-xs">
            <p>Server status: <span className="text-green-500 font-bold">ONLINE</span></p>
            <p>{lastCheckDisplay}</p>
          
            <p>Auto-refreshing every 3 seconds</p>
          </div>
        </Popover>
      )
    }
  }

  return (
    <div className="flex w-full justify-between items-center border-t dark:border-gray-700 text-gray-700 dark:text-gray-300 text-[10px]">
      <div className="flex items-center p-[2px] px-[2px] h-full bg-blue-600 text-white mr-1">
        <Popover
          className=""
          placement="top-right-live"
          trigger={<VscRemote className="p-[2px] px-[2px] h-full text-[15px]" />}
        >
          <div className="flex items-center bg-blue-300/20 rounded-full mx-2 px-2 py-1 border hover:cursor-pointer text-black">
            <div className="flex text-white rounded-full px-[4px] bg-blue-600 mr-2">P</div>
            <p>Prutotech@gmail.com</p>
          </div>
        </Popover>
      </div>

      <div className="flex w-full justify-between items-center text-[10px] py-1">
        <div className="flex items-center">
          <XCircle className="text-red-600 mr-1" width={10} height={10} />
          <p>0</p>
          <Popover
            placement="top-right-live"
            trigger={
              <div className="flex space-x-3">
                <div className="hidden items-center bg-blue-300/20 rounded-full mx-2 px-2 py-1 border hover:cursor-pointer">
                  <div className="flex text-white rounded-full px-[4px] bg-blue-600 mr-2">P</div>
                  <p>Prutotech@gmail.com</p>
                </div>
              </div>
            }
          >
            <div className="flex items-center bg-blue-300/20 rounded-full mx-2 px-2 py-1 border hover:cursor-pointer">
              <div className="flex text-white rounded-full px-[4px] bg-blue-600 mr-2">P</div>
              <p>Prutotech@gmail.com</p>
            </div>
          </Popover>
        </div>
        
        <div className="flex items-center justify-end w-full space-x-2">
          {renderServerStatus()}

          <div className="hidden flex items-center hover:cursor-pointer">
            <TbLoader3 className="animate-spin mr-1" />{' '}
            <p className="flex animate-pulse">Syncing</p>
            <p className="flex animate-pulse">...</p>
          </div>

     

          <Popover
            placement="top-left-live"
            trigger={
              <div className="flex items-center px-2 py-1 hover:bg-gray-300/20 hover:rounded-md hover:cursor-pointer mr-1">
                <BellRing className="" width={10} height={10} />
              </div>
            }
          >
            <div className="flex flex-col w-full h-full items-center">
              <div className="flex w-full h-full items-center justify-between">
                {' '}
                <p className="text-gray-700">Notifications</p>{' '}
                <div className="px-2 rounded-sm border">UNREAD</div>
              </div>
              <div className="flex flex-col w-full p-2 space-y-2 rounded-md bg-gray-300/20 mt-5 text-[10px] border">
                <p className="">🚀 Fixed Performance issues</p>
                <p className="border-t pt-[4px]">🚀 Added log for advanced debugging</p>
                <p className="border-t pt-[4px]">🚀 Added DB Sessions</p>
                <p className="border-t pt-[4px]">🚀 Added Nested Sidebar</p>
                <p className="border-t pt-[4px]">🚀 Added Security for Client App</p>
                <p className="">🚀 Fixed Performance issues</p>
                <p className="border-t pt-[4px]">🚀 Added log for advanced debugging</p>
                <p className="border-t pt-[4px]">🚀 Added DB Sessions</p>
                <p className="border-t pt-[4px]">🚀 Added Nested Sidebar</p>
                <p className="border-t pt-[4px]">🚀 Added Security for Client App</p>
                <p className="">🚀 Fixed Performance issues</p>
                <p className="border-t pt-[4px]">🚀 Added log for advanced debugging</p>
                <p className="border-t pt-[4px]">🚀 Added DB Sessions</p>
                <p className="border-t pt-[4px]">🚀 Added Nested Sidebar</p>
                <p className="border-t pt-[4px]">🚀 Added Security for Client App</p>
              </div>
            </div>
          </Popover>
        </div>
      </div>
    </div>
  )
}

export default ButtomBar