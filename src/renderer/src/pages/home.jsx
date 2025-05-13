import { useEffect, useState } from 'react'
import {
  BiBook,
  BiBookContent,
  BiBookOpen,
  BiCart,
  BiCode,
  BiHome,
  BiInfoCircle,
  BiLayout,
  BiNote,
  BiPlus,
  BiSearch,
  BiSolidBookOpen
} from 'react-icons/bi'
import { useNavigate } from 'react-router-dom'
import Dash from './dash'
import '../components/scroll.css'
import { motion, AnimatePresence } from 'framer-motion'
import { VscAccount, VscEditSession } from 'react-icons/vsc'
import { FaBolt, FaFacebook, FaLinkedin, FaTools, FaUsers } from 'react-icons/fa'
import { BsPass, BsTools, BsTwitterX, BsYoutube } from 'react-icons/bs'
import Su_Home from './sub_hom'
import { CgAdd, CgBolt } from 'react-icons/cg'
import Su_Se from './sub_settings'
import Su_In from './sub_info'
import { RiSettings6Line } from "react-icons/ri";
import { IoIosApps } from "react-icons/io";
import { CgHomeAlt } from "react-icons/cg";
import { TbHome, TbSettings } from "react-icons/tb";
import UserSet from './Settings'
import TemplateStore from './TemplateStore'
import { IoSparklesOutline, IoClose } from 'react-icons/io5'
import { PiDevicesDuotone } from "react-icons/pi";
import DeviceMonitor from './DeviceMonitor'
import DeviceMonitorPage from './DeviceSecurity'
import { MdSell } from 'react-icons/md'
import { BugPlay } from 'lucide-react'

const Overview = () => <h1>Dashboard Overview</h1>
const Reports = () => <h1>Dashboard Reports</h1>

const Home = () => {
  const navigate = useNavigate()

  const [ips, setIps] = useState([])
  const [status, setStatus] = useState('Checking...')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleDeactivate = async () => {
    navigate('/')
    await window.api.deactivate()
    setIsActivated(false)
  }
  
  const HanUp = async () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 3000)
  }

  const navButtonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.1 } },
    selected: { 
      scale: 1.05,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 15 
      }
    }
  }
  
  // Updated sidebar variants for right side animation
  const sidebarVariants = {
    hidden: { x: "100%", opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: {
      x: "100%",
      opacity: 0,
      transition: { 
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  useEffect(() => {
    try {
      if (window.api && typeof window.api.onServerStatusChange === 'function') {
        // window.api.onServerStatusChange((newStatus) => setStatus(newStatus));
      } else {
        console.error('window.api.onServerStatusChange is not defined or is not a function')
      }
    } catch (error) {
      console.error('Error in onServerStatusChange effect:', error)
    }
  }, [])

  const [selectedIp, setSelectedIp] = useState('') // State for selected IP

  const [selectedPage, setSelectedPage] = useState('home')

  // Handle page navigation
  const handleNavigation = (page) => {
    setSelectedPage(page)
  }
  const [isOpen, setIsOpen] = useState(true)
  const HandleClose = () => {
    setIsOpen(false)
  }

  // Render different content based on the selected page
  const renderPageContent = () => {
    switch (selectedPage) {
      case 'home':
        return <Su_Home />
      case 'settings':
        return <UserSet />
      case 'market':
        return <TemplateStore />
      case 'monitor':
        return <DeviceMonitorPage />
      case 'school':
        return <Dash />
      default:
        return <h1 className="text-2xl">Welcome to the Home Page</h1>
    }
  }

  // Feature items for the expanded sidebar
  const featureItems = [
    { id: 'features', label: 'AI Features', icon: <IoSparklesOutline className="mr-2" /> },
    { id: 'templates', label: 'Templates', icon: <BiNote className="mr-2" /> },
    { id: 'tools', label: 'Smart Tools', icon: <FaTools className="mr-2" /> },
    { id: 'assistant', label: 'Personal Assistant', icon: <VscAccount className="mr-2" /> },
  ]

  return (
    <div className="flex w-full h-screen custom-scrollbar overflow-y-auto overflow-x-auto max-h-screen ">
      {/* Original Sidebar */}
      <div className="flex flex-col h-full px-1 bg-gray-300/20 dark:bg-gray-800/40">
        <div className="flex flex-col items-center w-[40px] h-full text-gray-500 px-3">
          <nav>
          <motion.button
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              animate={selectedPage === 'home' ? "selected" : "initial"}
              variants={navButtonVariants}
              className={`${
                selectedPage === 'home'
                  ? 'flex items-center text-blue-600 '
                  : 'flex items-center'
              } w-full p-3 text-center mb-2 transition-colors`}
              onClick={() => handleNavigation('home')}
            >
              {selectedPage === 'home' ? (
                <motion.div 
                  className="flex items-center text-blue-600 rounded-md bg-white dark:bg-gray-800 border dark:border-gray-800 shadow p-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <TbHome width={14} height={14}/>
                </motion.div>
              ) : (
                <div className="flex items-center rounded-md p-2 hover:bg-gray-300/20">
                  <TbHome width={14} height={14}/>
                </div>
              )}
            </motion.button>
            <motion.button
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              animate={selectedPage === 'market' ? "selected" : "initial"}
              variants={navButtonVariants}
              className={`${
                selectedPage === 'market'
                  ? 'flex items-center text-blue-600 '
                  : 'flex items-center'
              } w-full p-3 text-center mb-2 transition-colors`}
              onClick={() => handleNavigation('market')}
            >
              {selectedPage === 'market' ? (
                <motion.div 
                  className="flex items-center text-blue-600 rounded-md bg-white dark:bg-gray-800 border dark:border-gray-800 shadow p-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <BiCart width={14} height={14}/>
                </motion.div>
              ) : (
                <div className="flex items-center rounded-md p-2 hover:bg-gray-300/20">
                  <BiCart width={14} height={14}/>
                </div>
              )}
            </motion.button>
            <motion.button
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              animate={selectedPage === 'settings' ? "selected" : "initial"}
              variants={navButtonVariants}
              className={`${
                selectedPage === 'settings'
                  ? 'flex items-center text-blue-600 '
                  : 'flex items-center'
              } w-full p-3 text-center mb-2 transition-colors`}
              onClick={() => handleNavigation('settings')}
            >
              {selectedPage === 'settings' ? (
                <motion.div 
                  className="flex items-center text-blue-600 rounded-md bg-white dark:bg-gray-800 border dark:border-gray-800 shadow p-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <TbSettings width={14} height={14}/>
                </motion.div>
              ) : (
                <div className="flex items-center rounded-md p-2 hover:bg-gray-300/20">
                  <TbSettings width={14} height={14}/>
                </div>
              )}
            </motion.button>
            <motion.button
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              animate={selectedPage === 'monitor' ? "selected" : "initial"}
              variants={navButtonVariants}
              className={`${
                selectedPage === 'monitor'
                  ? 'flex items-center text-blue-600 '
                  : 'flex items-center'
              } w-full p-3 text-center mb-2 transition-colors hidden`}
              onClick={() => handleNavigation('monitor')}
            >
              {selectedPage === 'monitor' ? (
                <motion.div 
                  className="flex items-center text-blue-600 rounded-md bg-white dark:bg-gray-800 border dark:border-gray-800 shadow p-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                 <PiDevicesDuotone                 width={14} height={14}/>
                </motion.div>
              ) : (
                <div className="flex items-center rounded-md p-2 hover:bg-gray-300/20">
                 <PiDevicesDuotone            width={14} height={14}/>
                </div>
              )}
            </motion.button>
          </nav>

          <div className="flex flex-col h-full p-1 rounded-full">
            <a className="hidden w-full p-2 text-center mb-2 transition-colors text-blue-600 rounded-full" target="_blank" href='' >
              <FaLinkedin width={10} height={10} />
            </a>
            <a className="w-full p-2 text-center mb-2 transition-colors text-red-600 rounded-full" target="_blank" href='https://www.youtube.com/@Learningdeckorg'>
              <BsYoutube width={10} height={10} />
            </a>
            <a className="w-full p-2 text-center mb-2 transition-colors text-black rounded-full" target="_blank" href='https://x.com/learningdeckorg?t=vuWwbwS0xsc3yQJXzDYCEg&s=09' >
              <BsTwitterX width={14} height={14} />
            </a>
          </div>
          <div className="flex h-full items-end">
            <button
              className={`w-full p-2 text-center mb-2 transition-colors rounded-full ${
                sidebarOpen ? 'bg-blue-500 text-white' : 'bg-blue-300/20'
              }`}
              onClick={toggleSidebar}
            >
              <IoSparklesOutline width={14} height={14} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col w-full h-full">
        <div className="hidden w-full bg-blue-600 bg-blue-400 p-[1px] border-b rounded-full"></div>
        <div className="w-full h-full custom-scrollbar overflow-y-auto">
          <div className="flex flex-col border-gray-400/20 rounded-md over">
            {renderPageContent()}
          </div>
        </div>
      </div>

      {/* Features Sidebar - Now positioned on the right */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            className="fixed right-0 top-0 h-full z-10 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={sidebarVariants}
          >
            <div className="flex flex-col h-full text-[10px]">
              <div className="flex items-center justify-between p-1 px-2 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-medium text-sm flex items-center">
                  <IoSparklesOutline className="mr-2 text-blue-500" />
                  AI Features
                </h2>
                <button 
                  onClick={toggleSidebar} 
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <IoClose size={20} />
                </button>
              </div>
              
              <div className="p-4 flex-grow overflow-y-auto">
                <ul className="space-y-2">
                  {featureItems.map((item) => (
                    <li key={item.id}>
                      <button
                        className="w-full text-left p-3 rounded-lg flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-medium mb-2">Pro Features</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Unlock advanced AI capabilities with our premium plan
                  </p>
                  <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors">
                    Upgrade Now
                  </button>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center text-gray-500">
                  <FaBolt className="mr-2 text-yellow-500" />
                  AI Credits: 100 remaining
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Home