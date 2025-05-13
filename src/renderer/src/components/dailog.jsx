import React, { useEffect } from 'react'
import { BiX } from 'react-icons/bi'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'

const Dialog = ({ im, title, onClose, children, other }) => {
  // Add effect to prevent background scrolling when dialog is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  // Create portal to render dialog directly to body
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ease-in-out rounded-t-md select-none">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      ></div>

      {/* Dialog content with animation */}
      <div
        className="relative w-fit min-w-[300px]  bg-white rounded-md shadow-xl border dark:bg-gray-800 dark:border-gray-600  dark:text-gray-300 max-w-full transition-all duration-300 transform scale-100"
        style={{ animation: '0.2s ease-out 0s 1 normal none running dialogIn' }}
      >
        <div className="flex items-center justify-between border-b dark:bg-gray-800 dark:border-gray-600 ">
          <div className="flex items-center space-x-2 px-3 py-2  text-[10px]">
            {im} <p className="font-medium">{title}</p>
          </div>

          <div className="flex items-center text-[10px]">
            {other}
            <div
              className="p-1 m-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={onClose}
            >
              <BiX className="text-gray-600 hover:text-black" size={16} />
            </div>
          </div>
        </div>
      
          {children}
     
      </div>

      {/* Add keyframe animation directly in the component */}
      <style jsx>{`
        @keyframes dialogIn {
          0% {
            opacity: 0;
            transform: scale(0.4);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>,
    document.body
  )
}

export default Dialog
