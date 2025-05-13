import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import '../components/drag.css'
import AnimatedProgressBar from '../components/progress'
import LearnDeck from '../assets/lds.png'
import Settings from '../pages/Settings'
const Splash = () => {
  const navi = useNavigate()
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const frameRef = useRef(null)

  const UseOffline = () => {
      navi('/home')
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let particles = []
    let animationFrameId

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      initParticles()
    }

    const initParticles = () => {
      particles = []
      const particleCount = Math.floor(canvas.width * canvas.height / 10000)
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 1,
          color: `rgba(100, 149, 237, ${Math.random() * 0.5 + 0.1})`, // Cornflower blue with varying opacity
          vx: Math.random() * 1 - 0.5,
          vy: Math.random() * 1 - 0.5,
          sinOffset: Math.random() * Math.PI * 2
        })
      }
      particlesRef.current = particles
    }

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw particles
      particles.forEach(particle => {
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.fill()
      })
      
      // Draw connections
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.1)'
      ctx.lineWidth = 0.5
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
    }

    const updateParticles = () => {
      const time = Date.now() * 0.001
      
      particles.forEach(particle => {
        // Add a gentle wave motion
        particle.x += particle.vx + Math.sin(time + particle.sinOffset) * 0.2
        particle.y += particle.vy + Math.cos(time + particle.sinOffset) * 0.2
        
        // Wrap around screen edges
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0
      })
    }

    const animate = () => {
      updateParticles()
      drawParticles()
      frameRef.current = requestAnimationFrame(animate)
    }

    // Initial setup
    resizeCanvas()
    
    // Start animation
    frameRef.current = requestAnimationFrame(animate)
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return (
    <div
      className="draggable flex flex-col h-full w-full items-center justify-center relative rounded-md
      bg-white dark:bg-gray-900 text-gray-600 space-y-4 overflow-hidden"
    >
    <div className='hidden'>
    <Settings/>
    </div>
      {/* Background canvas for particles */}
      <canvas 
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />
      
      <div className="z-10 flex flex-col items-center gap-4">
        <img
          src={LearnDeck}
          width={90}
          height={180}
          className="rounded-full bg-blend-multiply scale-95 bg-white dark:bg-gray-900 px-2 py-[1px] border"
        />
     <div className='flex h-8 w-[3px] rounded-full animate-pulse bg-blue-400'/>
   <div className='flex w-full items-center space-x-4 text-[10px]  p-2 rounded-md bg-white dark:bg-transparent border dark:border-gray-600 no-draggable non-draggable select-none'>
   <div className='px-2 py-1 rounded-full bg-blue-600 text-white hover:bg-blue-400 cursor-pointer'>
    Connect to Web
   </div>
    <div onClick={UseOffline} className='px-2 py-1 rounded-full border hover:bg-gray-300/20 cursor-pointer dark:border-gray-600 dark:text-gray-300'>
      Use Offline
   </div>
   </div>
      </div>
    </div>
  )
}

export default Splash