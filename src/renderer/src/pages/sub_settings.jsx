import Header from '../components/header'
import { useEffect, useState } from 'react'
import { BiCctv, BiExtension } from 'react-icons/bi'
import { useNavigate } from 'react-router-dom'
import Dash from './dash'
import '../components/scroll.css'
import { FiSettings } from 'react-icons/fi'
import { BsDatabase } from 'react-icons/bs'
import { MdOutlineManageAccounts, MdOutlineQuiz } from 'react-icons/md'
import { LuSheet } from 'react-icons/lu'
import PluginManger from './pluginManger'
import PageSettings from './pageSettings'
import Settings from './Settings'

const Su_Se = () => {
  const [selectedPage, setSelectedPage] = useState('userset')

  // Handle page navigation
  const handleNavigation = (page) => {
    setSelectedPage(page)
  }

  // Render different content based on the selected page
  const renderPageContent = () => {
    switch (selectedPage) {
      case 'userset':
        return <Settings />
      case 'about':
        return <Dash />
      case 'notify':
        return <Dash />
      case 'ok':
        return <Dash />
      case 'pageSettings':
        return <PageSettings />
      case 'plugin':
        return <PluginManger />
      case 'school':
        return <Dash />
      default:
        return <h1 className="text-2xl">Welcome to the Home Page</h1>
    }
  }

  return (
    <div className="flex w-full h-full bg-white dark:bg-gray-900   custom-scrollbar overflow-y-auto overflow-x-auto max-h-screen    ">
      {/* Sidebar */}

      <div className="flex flex-col h-screen  bg-white dark:bg-gray-900 ">
        <div className="flex flex-col items-center justify-start w-[40px] h-full  text-gray-500 pl-2 ">
          <nav>
            <button
              className={`${
                selectedPage === 'userset'
                  ? 'flex items-center text-black'
                  : 'flex items-center  rounded-full m-3'
              } w-full p-3 text-center  mb-2 transition-colors    `}
              onClick={() => handleNavigation('userset')}
            >
              {selectedPage === 'userset' ? (
                <div className="bg-blue-600 bg-blue-400 h-[20px] w-[3px] mr-2 rounded-full"></div>
              ) : (
                <div></div>
              )}

              <MdOutlineManageAccounts width={14} height={14} />
            </button>

            <button
              className={`${
                selectedPage === 'homee'
                  ? 'flex items-center text-black'
                  : 'flex items-center  rounded-full m-3'
              } w-full p-3 text-center  mb-2 transition-colors    `}
              onClick={() => handleNavigation('home')}
            >
              {selectedPage === 'homee' ? (
                <div className="bg-blue-600 bg-blue-400 h-[20px] w-[3px] mr-2 rounded-full"></div>
              ) : (
                <div></div>
              )}

              <FiSettings width={14} height={14} />
            </button>

            <button
              className={`${
                selectedPage === 'school'
                  ? 'flex items-center text-black'
                  : 'flex items-center   m-3'
              } w-full p-3 text-center  mb-2 transition-colors   `}
              onClick={() => handleNavigation('school')}
            >
              {selectedPage === 'school' ? (
                <div className="bg-blue-600 bg-blue-400 h-[20px] w-[3px] mr-2 rounded-full"></div>
              ) : (
                <div></div>
              )}
              <BsDatabase width={14} height={14} />
            </button>

            <button
              className={`${
                selectedPage === 'school'
                  ? 'flex items-center text-black'
                  : 'flex items-center   m-3'
              } w-full p-3 text-center  mb-2 transition-colors   `}
              onClick={() => handleNavigation('school')}
            >
              {selectedPage === 'school' ? (
                <div className="bg-blue-600 bg-blue-400 h-[20px] w-[3px] mr-2 rounded-full"></div>
              ) : (
                <div></div>
              )}
              <BiCctv width={14} height={14} />
            </button>
            <button
              className={`${
                selectedPage === 'school'
                  ? 'flex items-center text-black'
                  : 'flex items-center   m-3'
              } w-full p-3 text-center  mb-2 transition-colors   `}
              onClick={() => handleNavigation('school')}
            >
              {selectedPage === 'school' ? (
                <div className="bg-blue-600 bg-blue-400 h-[20px] w-[3px] mr-2 rounded-full"></div>
              ) : (
                <div></div>
              )}
              <MdOutlineQuiz width={14} height={14} />
            </button>

            <button
              className={`${
                selectedPage === 'pageSettings'
                  ? 'flex items-center text-black'
                  : 'flex items-center   m-3'
              } w-full p-3 text-center  mb-2 transition-colors   `}
              onClick={() => handleNavigation('pageSettings')}
            >
              {selectedPage === 'pageSettings' ? (
                <div className="bg-blue-600 bg-blue-400 h-[20px] w-[3px] mr-2 rounded-full"></div>
              ) : (
                <div></div>
              )}
              <LuSheet width={14} height={14} />
            </button>

            <button
              className={`${
                selectedPage === 'plugin'
                  ? 'flex items-center text-black'
                  : 'flex items-center  m-3'
              } w-full p-3 text-center  mb-2 transition-colors   `}
              onClick={() => handleNavigation('plugin')}
            >
              {selectedPage === 'plugin' ? (
                <div className="bg-blue-600 bg-blue-400 h-[20px] w-[3px] mr-2 rounded-full"></div>
              ) : (
                <div></div>
              )}
              <BiExtension width={14} height={14} />
            </button>
          </nav>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex flex-col w-full h-screen ">
        <div className="flex h-full w-full ">
          <div className=" w-full h-full custom-scrollbar  max-h-full">
            <div className="flex flex-col w-full h-full items-center justify-center bg-white dark:bg-gray-900 border-l border-gray-400/20 ">
              {renderPageContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Su_Se
