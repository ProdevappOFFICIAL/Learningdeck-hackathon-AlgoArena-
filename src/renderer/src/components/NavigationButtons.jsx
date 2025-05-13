import React, { useState, useEffect } from 'react'
import { VscClose, VscChromeMaximize } from 'react-icons/vsc'
import { BiInfoCircle, BiMinus } from 'react-icons/bi'
import './drag.css'
import Dialog from './dailog'
import { resetServerConfig, getServerInfo } from '../pages/utils/ServerConfig'

const NavigationButtons = () => {
  const [serverInfo, setServerInfo] = useState(null)

  useEffect(() => {
    // Get the current server info when component mounts
    const info = getServerInfo()
    setServerInfo(info)

    // Check current theme
  }, [])

  const handleResetServerConfig = () => {
    // Use the utility function with redirect option
    resetServerConfig(
      () => {
        // Update local state to reflect changes
        setServerInfo(null)
      },
      {
        showToast: true,
        redirect: true,
        redirectPath: '/' // Redirect to dashboard after reset
      }
    )
  }

  const minimizeWindow = () => window.api.minimizeWindow()
  const maximizeWindow = () => window.api.maximizeWindow()
  const closeWindow = () => {
    handleResetServerConfig()
    window.api.closeWindow()
  }

  const [opp, setOpp] = useState(false)

  const handleClose = () => {
    setOpp(false)
  
  }

  return (
    <>
      <header className="flex non-draggable">
        <button
          onClick={minimizeWindow}
          className="hover:bg-gray-300/20 px-3  flex items-center justify-center dark:text-white dark:hover:bg-gray-700"
          id="non-draggable"
        >
          <BiMinus size={16} />
        </button>

        <button
          onClick={maximizeWindow}
          className="hover:bg-gray-300/20 px-3  flex items-center justify-center dark:text-white dark:hover:bg-gray-700"
        >
          <VscChromeMaximize size={14} />
        </button>

        <button
          onClick={() => setOpp(true)}
          className="hover:bg-red-500 hover:text-white px-3  flex items-center justify-center dark:text-white"
        >
          <VscClose size={16} />
        </button>
      </header>

      {opp && (
        <Dialog
          title="Close"
          onClose={handleClose}
          im={<BiInfoCircle />}
          children={
            <div className="flex flex-col bg-zinc-300/20 dark:bg-gray-800 dark:border-gray-600 border-t text-[10px] p-3">
              Are you sure you want to close?
              <div className="flex w-full justify-between pt-[10px]">
                <div></div>
                <div className="flex space-x-2">
                  <div
                    onClick={closeWindow}
                    className="non-draggable flex items-center px-3 py-1 bg-blue-600 bg-blue-400 hover:bg-blue-500 rounded-full text-white text-[10px] transition-all shadow cursor-pointer"
                  >
                    EXIT
                  </div>
                </div>
              </div>
            </div>
          }
        />
      )}
    </>
  )
}

export default NavigationButtons
