import { useEffect, useState } from 'react'
import {
  BiBookContent,
  BiBookOpen,
  BiLayout,
} from 'react-icons/bi'
import { useNavigate } from 'react-router-dom'
import Dash from './dash'
import '../components/scroll.css'
import { FiUsers } from 'react-icons/fi'
import { BsPass } from 'react-icons/bs'
import Exams from './exams'
import Ques from './ques'
import Students from './student'
import Result from './result'
import Tooltip from '../components/tooltip'
import Web from './web'
import { motion } from 'framer-motion'

const Su_Home = () => {
  const navigate = useNavigate()
  const lds =
    'data:image/png;base64,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'

  const [ips, setIps] = useState([])
  const [status, setStatus] = useState('Checking...')
  const [loading, setLoading] = useState(false)

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
  // Render different content based on the selected page
  const renderPageContent = () => {
    switch (selectedPage) {
      case 'home':
        return <Dash />
      case 'result':
        return <Result />
      case 'student':
        return <Students />
      case 'ques':
        return <Ques />
      case 'exam':
        return <Exams />
      case 'web':
        return <Web />
      default:
        return <h1 className="">404 page not found</h1>
    }
  }

  return (
    <div className="flex w-full h-screen bg-white dark:bg-gray-800 dark:bg-gray-900   custom-scrollbar overflow-y-auto overflow-x-auto max-h-screen   ">
      {/* Sidebar */}

      <div className="flex flex-col h-full  bg-white dark:bg-gray-800 dark:bg-gray-900 dark:border-gray-700  px-1 border-l  ">
        <div className="flex flex-col h-full items-center justify-start w-[40px] h-full  text-gray-500 px-3  ">
          <nav>
            <Tooltip text="Dashboard" position="right">
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
                                <BiLayout width={14} height={14}/>
                              </motion.div>
                            ) : (
                              <div className="flex items-center rounded-md p-2 hover:bg-gray-300/20">
                                <BiLayout width={14} height={14}/>
                              </div>
                            )}
                          </motion.button>

            </Tooltip>

            <Tooltip text="Exams" position="right">
            <motion.button
                            initial="initial"
                            whileHover="hover"
                            whileTap="tap"
                            animate={selectedPage === 'exam' ? "selected" : "initial"}
                            variants={navButtonVariants}
                            className={`${
                              selectedPage === 'exam'
                                ? 'flex items-center text-blue-600 '
                                : 'flex items-center'
                            } w-full p-3 text-center mb-2 transition-colors`}
                            onClick={() => handleNavigation('exam')}
                          >
                            {selectedPage === 'exam' ? (
                              <motion.div 
                                className="flex items-center text-blue-600 rounded-md bg-white dark:bg-gray-800 border dark:border-gray-800 shadow p-2"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <BiBookOpen width={14} height={14}/>
                              </motion.div>
                            ) : (
                              <div className="flex items-center rounded-md p-2 hover:bg-gray-300/20">
                                <BiBookOpen width={14} height={14}/>
                              </div>
                            )}
                          </motion.button>
            </Tooltip>

            <Tooltip text="Questions" position="right">
            <motion.button
                            initial="initial"
                            whileHover="hover"
                            whileTap="tap"
                            animate={selectedPage === 'ques' ? "selected" : "initial"}
                            variants={navButtonVariants}
                            className={`${
                              selectedPage === 'ques'
                                ? 'flex items-center text-blue-600 '
                                : 'flex items-center'
                            } w-full p-3 text-center mb-2 transition-colors`}
                            onClick={() => handleNavigation('ques')}
                          >
                            {selectedPage === 'ques' ? (
                              <motion.div 
                                className="flex items-center text-blue-600 rounded-md bg-white dark:bg-gray-800 border dark:border-gray-800 shadow p-2"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <BiBookContent width={14} height={14}/>
                              </motion.div>
                            ) : (
                              <div className="flex items-center rounded-md p-2 hover:bg-gray-300/20">
                                <BiBookContent width={14} height={14}/>
                              </div>
                            )}
                          </motion.button>

            </Tooltip>

            <Tooltip text="Students" position="right">
            <motion.button
                            initial="initial"
                            whileHover="hover"
                            whileTap="tap"
                            animate={selectedPage === 'student' ? "selected" : "initial"}
                            variants={navButtonVariants}
                            className={`${
                              selectedPage === 'student'
                                ? 'flex items-center text-blue-600 '
                                : 'flex items-center'
                            } w-full p-3 text-center mb-2 transition-colors`}
                            onClick={() => handleNavigation('student')}
                          >
                            {selectedPage === 'student' ? (
                              <motion.div 
                                className="flex items-center text-blue-600 rounded-md bg-white dark:bg-gray-800 border dark:border-gray-800 dark:border-gray-800 shadow p-2"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <FiUsers width={14} height={14}/>
                              </motion.div>
                            ) : (
                              <div className="flex items-center rounded-md p-2 hover:bg-gray-300/20">
                                <FiUsers width={14} height={14}/>
                              </div>
                            )}
                          </motion.button>
          
            </Tooltip>

            <Tooltip text="Results" position="right">
            <motion.button
                            initial="initial"
                            whileHover="hover"
                            whileTap="tap"
                            animate={selectedPage === 'result' ? "selected" : "initial"}
                            variants={navButtonVariants}
                            className={`${
                              selectedPage === 'result'
                                ? 'flex items-center text-blue-600 '
                                : 'flex items-center'
                            } w-full p-3 text-center mb-2 transition-colors`}
                            onClick={() => handleNavigation('result')}
                          >
                            {selectedPage === 'result' ? (
                              <motion.div 
                                className="flex items-center text-blue-600 rounded-md bg-white dark:bg-gray-800 border dark:border-gray-800 shadow p-2"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <BsPass width={14} height={14}/>
                              </motion.div>
                            ) : (
                              <div className="flex items-center rounded-md p-2 hover:bg-gray-300/20">
                                <BsPass width={14} height={14}/>
                              </div>
                            )}
                          </motion.button>
     
            </Tooltip>
          </nav>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex flex-col w-full h-full overflow-y-auto ">
        <div className="flex h-full w-full ">
          <div className=" w-full h-full custom-scrollbar  max-h-full">
            <div className="flex flex-col w-full h-full items-center justify-center bg-white dark:bg-gray-800 dark:bg-gray-900 border-l border-gray-400/20 ">
              {renderPageContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Su_Home
