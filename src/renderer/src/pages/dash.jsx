import { useState, useRef, useEffect } from 'react'
import { BsInfoCircle } from 'react-icons/bs'
import { BiImport, BiSync, BiWifi } from 'react-icons/bi'
import { FiRefreshCcw, FiSettings } from 'react-icons/fi'
import Dialog from '../components/dailog'
import axios from 'axios'
import toast, { LoaderIcon, Toaster } from 'react-hot-toast'
import { LuFileJson, LuLaptop, LuNetwork, LuSmartphone, LuWifi } from 'react-icons/lu'
import TabsComponent from '../components/tabs'
import { motion } from 'framer-motion'
import useLogger from '../hook/useLogger'
import { MdOutlineSettingsSuggest, MdRouter } from 'react-icons/md'
import { VscDebugStart } from 'react-icons/vsc'
import { FcInfo } from 'react-icons/fc'
import { ChevronDown, Edit2, RefreshCw } from 'lucide-react'
import Popover from '../components/popover'
import '../assets/animation.css'
import { useNavigate } from 'react-router-dom'
import PluginCards from '../components/pluginsCard'
// Import the server config utilities
import { resetServerConfig, getServerInfo, saveServerConfig } from '../pages/utils/ServerConfig'
import { IoWifiSharp } from 'react-icons/io5'
import DownloadedTemplates from './Downladedtemplates'
import { LuWifiOff } from 'react-icons/lu';
import Security from './Settings'
import WiFiDialog from '../components/WifiConnect'

// Adding this utility function to detect common device patterns
const getDeviceTypeInfo = (ip, customDevices = {}) => {
  // First check if this IP has a custom label from the user
  if (customDevices[ip]) {
    return customDevices[ip];
  }

  // Common IP patterns and their corresponding device types
  if (ip === 'localhost' || ip === '127.0.0.1') {
    return { 
      name: 'My Computer',
      icon: <LuLaptop className="mr-1" />,
      type: 'computer'
    };
  } 
  // Common mobile hotspot patterns - many Android devices use these
  else if (ip.startsWith('192.168.43.') || ip.startsWith('172.20.10.')) {
    return { 
      name: 'Mobile Hotspot',
      icon: <IoWifiSharp className="mr-1" />,
      type: 'mobile_hotspot'
    };
  }
  // Common Windows hotspot/ICS patterns
  else if (ip.startsWith('192.168.137.')) {
    return { 
      name: 'PC Hotspot',
      icon: <LuWifi className="mr-1" />,
      type: 'pc_hotspot'
    };
  }
  // Common home router patterns
  else if (ip.startsWith('192.168.0.') || ip.startsWith('192.168.1.') || ip.startsWith('192.168.2.')) {
    return { 
      name: 'WiFi Router',
      icon: <MdRouter className="mr-1" />,
      type: 'router'
    };
  }
  // Other typical local network ranges
  else if (ip.startsWith('192.168.')) {
    return { 
      name: 'LAN Device',
      icon: <LuNetwork className="mr-1" />,
      type: 'lan'
    };
  } 
  // Private network ranges
  else if (ip.startsWith('10.') || ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
    return { 
      name: 'Private Network',
      icon: <LuNetwork className="mr-1" />,
      type: 'private'
    };
  } 
  // IPv6 local link
  else if (ip.match(/^fe80::/i)) {
    return { 
      name: 'IPv6 Local Link',
      icon: <LuNetwork className="mr-1" />,
      type: 'ipv6_local'
    };
  } 
  // Self-assigned IP (usually means network configuration problems)
  else if (ip.match(/^169\.254\./)) {
    return { 
      name: 'Self-Assigned IP',
      icon: <LuWifiOff className="mr-1" />,
      type: 'self_assigned'
    };
  } 
  // Default fallback
  else {
    return { 
      name: 'Network Device',
      icon: <LuNetwork className="mr-1" />,
      type: 'other'
    };
  }
};



// Modified ServerConfigDialog component with custom device names support

// Modified ServerConfigDialog component without the customize device functionality
const ServerConfigDialog = ({ onClose, onServerStart }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [selectedIP, setSelectedIP] = useState('localhost');
  const [port, setPort] = useState(3000);
  const [ips, setIps] = useState([]);
  const [active, setActive] = useState(false);
  const { log } = useLogger();
  const [loadingIPs, setLoadingIPs] = useState(true);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setIsOpen(false);
  };

  const ReloadIP = () => {
    setLoadingIPs(true);
    setIps([]); // Clear existing IPs to show loading state
    window.api.getLocalIPs().then((newIps) => {
      setIps(newIps);
      setLoadingIPs(false);
      // Ensure localhost is always available as a fallback
      if (newIps.length === 0 || !newIps.includes('localhost')) {
        setIps(prev => [...prev, 'localhost']);
      }
    }).catch(err => {
      console.error("Error loading IPs:", err);
      setLoadingIPs(false);
      // Ensure localhost is available as a fallback
      setIps(['localhost']);
    });
  };

  useEffect(() => {
    // Fetch available local network IPs
    setLoadingIPs(true);
    window.api.getLocalIPs().then((fetchedIps) => {
      // Ensure localhost is always available as a fallback
      if (!fetchedIps.includes('localhost')) {
        fetchedIps.push('localhost');
      }
      setIps(fetchedIps);
      setLoadingIPs(false);
    }).catch(err => {
      console.error("Error loading IPs:", err);
      setLoadingIPs(false);
      // Ensure localhost is available as a fallback
      setIps(['localhost']);
    });

    // Get previously selected IP and port
    window.api.getServerInfo().then(({ ip, port }) => {
      setSelectedIP(ip || 'localhost');
      setPort(port || 3000);
    });
  }, []);

  const handleStartServer = () => {
    setLoading(true);
    window.api.sendServerInfo(selectedIP, port);
    setTimeout(() => {
      window.api.startServer();
      setLoading(false);
      
      // Save server config using the utility function
      saveServerConfig(selectedIP, port);
      log(`${new Date().toLocaleTimeString()} Server started at ${selectedIP}:${port}`);
      
      onServerStart(selectedIP, port);
    }, 1000);
  };
const [wifi,  setwifi] = useState(false)
const Wfi = () => {
  setwifi(true)
  if(wifi){
    setwifi(false)
  }

}
  return (
    <Dialog
      title={'Server Configuration'}
      im={<FiSettings />}
      onClose={onClose}
      other={
        <div className='flex items-center gap-1 text-blue-700 space-x-4'>
          <div className="hidden items-center px-2 py-1 rounded-full text-white bg-blue-600 hover:cursor-pointer hover:bg-blue-500" onClick={Wfi}><BiWifi className="mr-1"/> Wifi Connect</div>
          {loadingIPs ? "Loading devices..." : `${ips.length} devices found`}
          <FiRefreshCcw
            onClick={ReloadIP}
            size={18}
            className={`p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer ${loadingIPs ? "animate-spin" : ""}`}
          />
        </div>
      }
      children={
        <div className="flex flex-col border-t dark:border-gray-700 text-[10px] px-3 select-none">
          <div className="flex flex-col text-[10px]">
            <div className="flex flex-col items-start">
              {wifi &&    <WiFiDialog/>}
           
              <div className="flex w-full items-center justify-between p-2 mr-2">
                {' '}
                Select host device:{' '}
                <div className="flex items-center gap-1">
                  <div
                    className="relative"
                    ref={dropdownRef}
                    onKeyDown={handleKeyDown}
                  >
                    <button
                      onClick={() => setIsOpen(!isOpen)}
                      className="flex items-center justify-between w-fit px-2 py-1 text-[10px] border dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase text-gray-500 transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
                      aria-haspopup="true"
                      aria-expanded={isOpen}
                    >
                      <div className="flex w-full items-center">
                        {getDeviceTypeInfo(selectedIP).icon}
                        {getDeviceTypeInfo(selectedIP).name}
                        <span className="ml-1 text-gray-400 text-[8px]">({selectedIP})</span>
                      </div>
                      <ChevronDown
                        className={`ml-2 h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isOpen && (
                      <div
                        className="absolute z-10 w-48 mt-1 origin-top bg-white dark:hover:bg-gray-700 dark:bg-gray-900 rounded shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-slide-down"
                        role="menu"
                      >
                        <div className="py-1 bg-white dark:bg-gray-800">
                          {loadingIPs ? (
                            <div className="flex items-center justify-center p-2">
                              <LoaderIcon size={12} />
                              <span className="ml-2 text-[10px]">Loading devices...</span>
                            </div>
                          ) : ips.length > 0 ? (
                            ips.map((ip) => {
                              const deviceInfo = getDeviceTypeInfo(ip);
                              return (
                                <div
                                  key={ip}
                                  onClick={() => {
                                    setSelectedIP(ip);
                                    setIsOpen(false);
                                  }}
                                  className="flex items-center px-2 py-1 text-[10px] text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                  role="menuitem"
                                >
                                  {deviceInfo.icon}
                                  <div className="flex flex-col">
                                    <span>{deviceInfo.name}</span>
                                    <span className="text-gray-400 text-[8px] lowercase">{ip}</span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="flex items-center justify-center p-2 text-[10px] text-gray-500">
                              No devices found. Using localhost.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <Popover
                    placement="buttom"
                    trigger={<FcInfo className="text-[16px]" />}
                  >
                    Make sure you have read 
                   <a className=" w-full pl-1 text-center mb-2 transition-colors text-blue-600 rounded-full hover:underline" target="_blank" href='https://learningdeck.vercel.app/guide' >
                   LearningDeck guide
                             </a>
                  </Popover>
                </div>
              </div>
            </div>

        

            <div className="flex w-full justify-between pt-[10px]">
              <Popover
                placement="buttom-left-live"
                trigger={
                  <div className="flex w-fit items-center hover:cursor-pointer justify-center px-3 py-1 bg-blue-300/20 dark:bg-transparent dark:border-gray-500 dark:border rounded-full hover:bg-blue-100 text-blue-600 text-[10px] transition-all">
                    <MdOutlineSettingsSuggest className="text-[15px] mr-1" /> Advanced
                    settings
                  </div>
                }
              >
                <div className="flex w-full items-center justify-between p-2">
                  {' '}
                  Server_port:{' '}
                  <input
                    type="number"
                    className="w-fit items-center px-2 py-1 text-[10px] border dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase text-gray-500"
                    value={port}
                    onChange={(e) => setPort(parseInt(e.target.value))}
                  />
                </div>
              </Popover>

              <div className="flex space-x-2 pb-2">
                {loading ? (
                  <div className="flex w-fit hover:cursor-pointer items-center px-3 py-1 bg-blue-400 rounded-full text-white text-[10px] transition-all shadow">
                    <LoaderIcon color="white" className="mr-1" /> Starting...
                  </div>
                ) : (
                  <div
                    className="flex w-fit hover:cursor-pointer items-center px-3 py-1 bg-blue-600 rounded-full focus:bg-blue-300 hover:bg-blue-500 text-white text-[10px] transition-all shadow"
                    onClick={handleStartServer}
                  >
                    <VscDebugStart className="mr-1" /> Start server{' '}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
};


const Dash = () => {
  const [showServerConfig, setShowServerConfig] = useState(false)
  const [serverInfo, setServerInfo] = useState({ ip: '', port: '' })
  const [serverInfoLoaded, setServerInfoLoaded] = useState(false)
  const [opp, seopp] = useState(false)
  const [exam, setExam] = useState('Updating...')
  const [question, setQuestion] = useState('Updating...')
  const [user, setUser] = useState('Updating...')
  const [classes, setClasses] = useState('Updating...')
  const [subjects, setSubjects] = useState('Updating...')
  const { log } = useLogger()
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const [nameOrg, setNameOrg] = useState('')
  const [iconBase64, setIconBase64] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Check localStorage on component mount using the utility function
  useEffect(() => {
    const serverConfig = getServerInfo();
    
    if (serverConfig) {
      // If server was previously started, don't show config dialog
      setServerInfo({ ip: serverConfig.ip, port: serverConfig.port })
      setServerInfoLoaded(true)
      setShowServerConfig(false)
      
      // Log that we're using saved server config
      log(`${new Date().toLocaleTimeString()} Using saved server configuration: ${serverConfig.ip}:${serverConfig.port}`)
    } else {
      // Show config dialog if no saved state
      setShowServerConfig(true)
    }
  }, [])

  const handleServerStart = (ip, port) => {
    setServerInfo({ ip, port })
    setServerInfoLoaded(true)
    setShowServerConfig(false)
  }

  const HanC = () => {
    seopp(true)
  }

  const HanCX = () => {
    seopp(false)
  }

  const importDatabase = async () => {
    log(`${new Date().toLocaleTimeString()}  Importing Database...`)
    const result = await window.api.ipcRenderer.invoke('import-db')
    setMessage(result.message)
    log(`${new Date().toLocaleTimeString()}  ${result.message}`)
    window.location.reload()
  }

  // Handle server config reset with logging
  const handleResetServerConfig = () => {
    resetServerConfig(() => {
      setShowServerConfig(true)
      setServerInfoLoaded(false)
      log(`${new Date().toLocaleTimeString()} Server configuration reset from dashboard`)
    });
  }

  // Fetch dashboard data when server info is available
  useEffect(() => {
    if (!serverInfoLoaded || !serverInfo.ip || !serverInfo.port) {
      return
    }

    const fetchData = async () => {
      try {
        setExam('Updating...')
        setQuestion('Updating...')
        setUser('Updating...')

        const [examResponse, questionResponse, userResponse, subjectResponse, classResponse] =
          await Promise.all([
            axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/ExamCombination`),
            axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/Question`),
            axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/User`),
            axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/Subject`),
            axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/Classes`)
          ])

        setExam(examResponse.data.length)
        setQuestion(questionResponse.data.length)
        setUser(userResponse.data.length)
        setSubjects(subjectResponse.data.length)
        setClasses(classResponse.data.length)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setExam('')
        setQuestion('')
        setUser('')
        setSubjects('')
        setClasses('')
        
        // If we can't connect, maybe the server is not running
        toast.error('Could not connect to server. Server may not be running.')
      }
    }

    fetchData()

    // Fetch organization info
    const fetchOrgData = async () => {
      try {
        const API_URL = `http://${serverInfo.ip}:${serverInfo.port}/api/Information`
        const res = await fetch(API_URL)
        if (res.ok) {
          const data = await res.json()
          if (data.length > 0) {
            const firstData = data[0]
            setNameOrg(firstData.name_org)
            setIconBase64(firstData.icon)
            setIsUpdating(true)
          }
        }
      } catch (error) {
        console.error('Error fetching organization data:', error)
      }
    }

    fetchOrgData()
  }, [serverInfoLoaded, serverInfo])

  // If server config should be shown, render only that dialog
  if (showServerConfig) {
    return (
      <div className="flex flex-col w-full h-full bg-white dark:bg-gray-900">
        <ServerConfigDialog 
          onClose={() => setShowServerConfig(false)} 
          onServerStart={handleServerStart} 
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-full bg-white dark:bg-gray-900">
      <Toaster position="top-right" />
      
      {!serverInfoLoaded ? (
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center space-y-4">
            <LoaderIcon />
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between border-b dark:border-gray-700 p-3">
            <div className="flex items-center gap-2 dark:text-gray-300">
              👋 Good morning, <p className="font-medium">Admin</p>
            </div>

            <div className="flex items-center space-x-2 text-[10px]">
            <DownloadedTemplates/>
              <div className="hidden sm:flex items-center space-x-2 text-gray-800 bg-blue-300/20 px-3 rounded-full py-1 border dark:border-gray-700 cursor-pointer border-zinc-300 dark:text-zinc-200 text-[10px]">
                <BiSync className="mr-1" /> Sync with learningDeck Web
              </div>
              <div onClick={HanC} className="hidden sm:flex items-center space-x-2 text-gray-800 bg-blue-300/20 px-3 rounded-full py-1 border dark:border-gray-700 cursor-pointer border-zinc-300 dark:text-zinc-200 text-[10px]">
                <BiImport className="mr-1" /> Import Database
              </div>
            </div>
          </div>

          {opp && (
            <Dialog
              title="Import Local DB"
              onClose={HanCX}
              im={<FiSettings />}
              children={
                <div className="flex flex-col bg-zinc-300/20 border-t text-[10px] p-3">
                  <div className="flex flex-col items-center justify-center">
                    <LuFileJson
                      onClick={importDatabase}
                      width={60}
                      height={60}
                      className="w-10 h-10"
                    />
                    {message && <p className="mt-3 text-gray-700">{message}</p>}
                  </div>

                  <div className="flex w-full justify-between pt-[10px]">
                    <div></div>
                    <div className="flex space-x-2">
                      <div
                        onClick={HanCX}
                        className="hidden px-2 py-1 rounded border dark:border-gray-700 text-[10px] bg-zinc-600 text-white hover:border-white hover:border-[1px] hover:cursor-pointer"
                      >
                        IMPORT{' '}
                      </div>
                    </div>
                  </div>
                </div>
              }
            />
          )}
          <div className="hidden">
            <Security/>
            </div>

          <div className="flex flex-col space-y-4 items-center p-3">
            <motion.div
              className="flex flex-row border dark:border-gray-700 rounded-md items-center p-3 w-full space-x-4 bg-gray-50 dark:bg-gray-800 dark:text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1 }}
            >
              <div className="flex flex-row items-center w-full px-2 py-2 h-[20px] border dark:border-gray-700 rounded-full text-[8px] sm:text-[11px] p-[2px] font-medium gap-1">
                <BsInfoCircle className="mr-1" /> <div className="flex-1">Number of Exams:</div>{' '}
                {exam === 'Updating...' ? (
                  <div>
                    <LoaderIcon />
                  </div>
                ) : (
                  <div className="px-2 text-white bg-blue-600 rounded-full">{exam}</div>
                )}{' '}
              </div>
              <div className="flex items-center justify-between w-full px-2 py-2 h-[20px] border dark:border-gray-700 rounded-full text-[8px] sm:text-[11px] p-[2px] font-medium gap-1">
                <BsInfoCircle className="mr-1" /> Number of Ques:{' '}
                {question === 'Updating...' ? (
                  <div>
                    <LoaderIcon />
                  </div>
                ) : (
                  <div className="px-2 text-white bg-blue-600 rounded-full">{question}</div>
                )}
              </div>

              <div className="flex items-center justify-between w-full px-2 py-2 h-[20px] border dark:border-gray-700 rounded-full text-[8px] sm:text-[11px] p-[2px] font-medium gap-1">
                <BsInfoCircle className="mr-1" /> Number of Subjects:{' '}
                {exam === 'Updating...' ? (
                  <div>
                    <LoaderIcon />
                  </div>
                ) : (
                  <div className="px-2 text-white bg-blue-600 rounded-full">{subjects}</div>
                )}{' '}
              </div>
              <div className="flex items-center justify-between w-full px-2 py-2 h-[20px] border dark:border-gray-700 rounded-full text-[8px] sm:text-[11px] p-[2px] font-medium gap-1">
                <BsInfoCircle className="mr-1" /> Number of Students:{' '}
                {exam === 'Updating...' ? (
                  <div>
                    <LoaderIcon />
                  </div>
                ) : (
                  <div className="px-2 text-white bg-blue-600 rounded-full">{user}</div>
                )}{' '}
              </div>
            </motion.div>

            <motion.div
              className="flex flex-row border dark:border-gray-700 rounded-md items-center p-3 w-full space-x-4 max-w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1 }}
            >
              <PluginCards />
            </motion.div>
          </div>

          <div className="flex flex-col w-full p-3 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1 }}
              className="flex flex-col w-full border dark:border-gray-700 rounded-md items-center justify-center"
            >
              <TabsComponent />
            </motion.div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dash