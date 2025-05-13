import { useState } from 'react'
import { BiInfoCircle } from 'react-icons/bi'
import { BsQuestion } from 'react-icons/bs'
import AskQuestion from './ask_question'

const Su_In = () => {
  const [selectedPage, setSelectedPage] = useState('faq')

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
      case 'faq':
        return <AskQuestion />
      case 'info':
        return <InfoPage />
      default:
        return <h1 className="text-[10px]"> 404 page not found</h1>
    }
  }

  return (
    <div className="flex w-full h-full bg-white dark:bg-gray-900   custom-scrollbar overflow-y-auto overflow-x-auto max-h-screen    ">
      {/* Sidebar */}

      <div className="flex flex-col h-screen  bg-white dark:bg-gray-900 ">
        <div className="flex flex-col items-center justify-start w-[40px] h-full  text-gray-500 pl-2 ">
          <nav>
            <button
              className={` ${
                selectedPage === 'infoo' ? 'flex items-center text-black' : 'flex items-center  m-3'
              } w-full p-3 text-center  mb-2 transition-colors   `}
              onClick={() => handleNavigation('faq')}
            >
              {selectedPage === 'faq' ? (
                <div className="bg-blue-600 bg-blue-400 h-[20px] w-[3px] mr-1 rounded-full"></div>
              ) : (
                <div></div>
              )}
              <BsQuestion width={14} height={14} />
            </button>

            <button
              className={`  ${
                selectedPage === 'info' ? 'flex items-center text-black' : 'flex items-center  m-3'
              } w-full p-3 text-center  mb-2 transition-colors   `}
              onClick={() => handleNavigation('info')}
            >
              {selectedPage === 'info' ? (
                <div className="bg-blue-600 bg-blue-400 h-[20px] w-[3px] mr-2 rounded-full"></div>
              ) : (
                <div></div>
              )}
              <BiInfoCircle width={14} height={14} />
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

export default Su_In
