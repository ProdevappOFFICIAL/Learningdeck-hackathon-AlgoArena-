import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import React from 'react'

const AnimatedProgressBar = ({ progress: externalProgress, classname }) => {
  const [progress, setProgress] = useState(externalProgress || 0)

  useEffect(() => {
    if (externalProgress !== undefined) {
      setProgress(externalProgress) // Sync with external prop
    } else {
      // Auto-increase progress
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 10))
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [externalProgress])

  return (
      <div className={`relative  bg-gray-200 rounded-full overflow-hidden ${classname}`}>
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
        />
      </div>
  )
}

export default AnimatedProgressBar
