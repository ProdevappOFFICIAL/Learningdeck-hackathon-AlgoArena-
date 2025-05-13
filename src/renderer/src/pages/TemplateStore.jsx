import React, { useState, useEffect } from 'react'
import TemplateCard from '../components/Template/TemplateCard'
import TemplateDetails from '../components/Template/TemplateDetails'
import { LoaderIcon } from 'react-hot-toast'
import { FiWifiOff, FiX, FiShoppingCart, FiTrash2, FiX as FiClose } from 'react-icons/fi'
import { BiCart, BiCartAdd, BiDollarCircle, BiX } from 'react-icons/bi'
import { AiOutlineClose } from 'react-icons/ai'
import ErroL from '../assets/no_internt.png'
import { useNavigate } from 'react-router-dom'

function TemplateStore() {
  const [templates, setTemplates] = useState([])
  const [downloadedTemplates, setDownloadedTemplates] = useState([])
  const [activeTemplate, setActiveTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadProgress, setDownloadProgress] = useState({})
  const [serverDetails, setServerDetails] = useState({ ip: 'localhost', port: 80 })
  const [currentlyServingTemplateId, setCurrentlyServingTemplateId] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showOfflineWarning, setShowOfflineWarning] = useState(false)
  
  // Cart and drawer state
  const [cartItems, setCartItems] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isBuyDrawerOpen, setIsBuyDrawerOpen] = useState(false)
  const [buyFormData, setBuyFormData] = useState({
    name: '',
    email: '',
    description: '',
    style: 'Modern',
    features: [],
    budget: '100-500'
  })

  // Setup online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineWarning(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load cart items from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('templateCart')
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    }
  }, [])

  // Save cart items to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('templateCart', JSON.stringify(cartItems))
  }, [cartItems])

  // Fetch templates and downloaded templates on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Check if we're online before fetching templates
        if (!navigator.onLine) {
          // We can still display downloaded templates even if offline
          const downloaded = await window.api.getDownloadedTemplates()
          setDownloadedTemplates(downloaded)
          setLoading(false)
          setError('You are offline. Only downloaded templates are available.')
          return
        }

        const fetchedTemplates = await window.api.fetchTemplates()
        const downloaded = await window.api.getDownloadedTemplates()

        // Filter out hidden templates
        const visibleTemplates = fetchedTemplates.filter((template) => template.visible === true)

        setTemplates(visibleTemplates)
        setDownloadedTemplates(downloaded)

        // Check if any template is currently being served
        const servedTemplates = JSON.parse(localStorage.getItem('servedTemplates') || '[]')
        if (servedTemplates.length > 0) {
          setCurrentlyServingTemplateId(servedTemplates[0])
        }

        setLoading(false)
      } catch (err) {
        setError('Failed to fetch templates: ' + err.message)
        setLoading(false)
      }
    }

    fetchData()

    // Set up event listeners for download progress and completion
    const removeProgressListener = window.api.onDownloadProgress((progress) => {
      setDownloadProgress((prev) => ({
        ...prev,
        [progress.templateId]: progress.percent
      }))
    })

    const removeCompleteListener = window.api.onDownloadComplete((templateInfo) => {
      setDownloadedTemplates((prev) => [...prev, templateInfo.name])
      // Reset progress after completion
      setDownloadProgress((prev) => ({
        ...prev,
        [templateInfo.id]: 100
      }))

      // After a second, clear the progress indicator
      setTimeout(() => {
        setDownloadProgress((prev) => {
          const newProgress = { ...prev }
          delete newProgress[templateInfo.id]
          return newProgress
        })
      }, 1000)
    })

    // Get server details
    window.api.getServerInfo().then((details) => {
      setServerDetails(details)
    })

    // Cleanup event listeners on component unmount
    return () => {
      removeProgressListener()
      removeCompleteListener()
    }
  }, [])

  // Check internet connection before download
  const checkInternetConnection = () => {
    if (!navigator.onLine) {
      setShowOfflineWarning(true)
      return false
    }
    return true
  }

  // Handle template download
  const handleDownload = async (template) => {
    // Check internet connection first
    if (!checkInternetConnection()) {
      window.api.logMessage(`Cannot download template: No internet connection`, 'error')
      return
    }

    try {
      // Set initial progress
      setDownloadProgress((prev) => ({
        ...prev,
        [template.id]: 0
      }))

      // Start download
      await window.api.downloadTemplate(template)

      // Log success
      window.api.logMessage(`Template "${template.name}" downloaded successfully`, 'info')
    } catch (err) {
      setError(`Failed to download template: ${err.message}`)
      window.api.logMessage(
        `Failed to download template "${template.name}": ${err.message}`,
        'error'
      )

      // Clear progress on error
      setDownloadProgress((prev) => {
        const newProgress = { ...prev }
        delete newProgress[template.id]
        return newProgress
      })
    }
  }

  // Handle serving a template
  const handleServe = async (templateName) => {
    try {
      // Call API to serve/stop template
      await window.api.serveTemplate(templateName)
      window.api.logMessage(`Template service toggled: ${templateName}`, 'info')

      // Update the currently serving template if necessary
      const servedTemplates = JSON.parse(localStorage.getItem('servedTemplates') || '[]')
      setCurrentlyServingTemplateId(servedTemplates.length > 0 ? servedTemplates[0] : null)

      return true
    } catch (err) {
      setError(`Failed to serve template: ${err.message}`)
      window.api.logMessage(`Failed to serve template "${templateName}": ${err.message}`, 'error')
      return false
    }
  }

  // Open template in browser
  const openInBrowser = async () => {
    await window.api.openTemplateInBrowser()
  }

  // Dismiss offline warning
  const dismissOfflineWarning = () => {
    setShowOfflineWarning(false)
  }

  // Cart Functions
  const addToCart = (template) => {
    // Check if template is already in cart
    if (!cartItems.some(item => item.id === template.id)) {
      setCartItems([...cartItems, template])
      window.api.logMessage(`"${template.name}" added to cart`, 'info')
    } else {
      window.api.logMessage(`"${template.name}" is already in your cart`, 'info')
    }
  }

  const removeFromCart = (templateId) => {
    const updatedCart = cartItems.filter(item => item.id !== templateId)
    setCartItems(updatedCart)
    window.api.logMessage(`Item removed from cart`, 'info')
  }

  const clearCart = () => {
    setCartItems([])
    window.api.logMessage(`Cart cleared`, 'info')
  }

  // Buy Template Form Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setBuyFormData({
      ...buyFormData,
      [name]: value
    })
  }

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target
    if (checked) {
      setBuyFormData({
        ...buyFormData,
        features: [...buyFormData.features, value]
      })
    } else {
      setBuyFormData({
        ...buyFormData,
        features: buyFormData.features.filter(feature => feature !== value)
      })
    }
  }

  const handleSubmitCustomTemplate = (e) => {
    e.preventDefault()
    // Handle submission - could send to API or email service
    window.api.logMessage(`Custom template request submitted`, 'info')
    setIsBuyDrawerOpen(false)
    // Reset form
    setBuyFormData({
      name: '',
      email: '',
      description: '',
      style: 'Modern',
      features: [],
      budget: '100-500'
    })
  }

  const navigate = useNavigate()
  const Refresh = () => {
    navigate(0)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <LoaderIcon />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen border-l border-gray-400/20 text-[10px] dark:text-gray-300 relative">
      <div className="flex items-center justify-between border-b dark:border-gray-700 p-3">
        <span className="flex text-gray-800 dark:text-white text-sm">Template Store</span>

        <div className="flex w-fit items-center justify-end space-x-2">
          <button 
            onClick={() => setIsBuyDrawerOpen(true)}
            className='flex items-center gap-1 px-3 py-1 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors'
          >
            <BiDollarCircle /> Buy a custom template
          </button>
          
          <button 
            className="relative text-gray-800 dark:text-white hover:text-blue-600 transition-colors"
            onClick={() => setIsCartOpen(true)}
          >
            <BiCart className='text-[20px]' />
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">
                {cartItems.length}
              </span>
            )}
          </button>

          {currentlyServingTemplateId && (
            <div className="bg-green-700 text-white px-2 py-1 rounded-full flex items-center gap-1">
              <LoaderIcon />
              <span>
                Active:{' '}
                {localStorage.getItem(`templateName_${currentlyServingTemplateId}`) || 'Template'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Offline warning */}
      {showOfflineWarning && (
        <div className="m-3 bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700 flex items-start">
          <FiWifiOff className="mt-0.5 mr-2 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">No Internet Connection</p>
            <p className="text-xs mt-1">
              You need to be online to download templates. Please check your connection and try
              again.
            </p>
          </div>
          <button
            className="ml-2 text-yellow-600 hover:text-yellow-800"
            onClick={dismissOfflineWarning}
          >
            <FiX size={18} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-y-3 w-full h-full pt-10 items-center justify-center">
          <img src={ErroL} width={outerWidth / 5} height={outerHeight / 5} alt="Error" />
          <p className="font-medium text-sm">Check your Internet Connection</p>
          <p className="text-xs mt-1">LearningDeck need to be online to view/use templates.</p>
          <div className="flex gap-2 items-center">
            <button className="px-3 py-1 rounded-full hover:bg-gray-300/20" onClick={Refresh}>
              Refresh page
            </button>
            <button className="px-3 py-1 rounded-full bg-blue-600 text-white">
              Check connection
            </button>
          </div>
        </div>
      )}

      {templates.length === 0 && !error ? (
        <div className="m-5 bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            {isOnline
              ? 'No templates available at the moment.'
              : "You're offline. Connect to the internet to browse available templates."}
          </p>
        </div>
      ) : (
        <div className="m-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => {
            // Check if this template is being served
            const isServing = currentlyServingTemplateId === template.id
            const isInCart = cartItems.some(item => item.id === template.id)

            return (
              <div key={template.id} className="relative">
                <TemplateCard
                  template={template}
                  isDownloaded={downloadedTemplates.includes(template.name)}
                  progress={downloadProgress[template.id]}
                  isServing={isServing}
                  isOnline={isOnline}
                  onClick={() => setActiveTemplate(template)}
                />
                <button
                  onClick={() => addToCart(template)}
                  disabled={isInCart}
                  className={`absolute top-2 right-2 p-1 rounded-full ${
                    isInCart 
                      ? 'bg-green-500 text-white cursor-not-allowed' 
                      : 'bg-white text-blue-600 hover:bg-blue-600 hover:text-white'
                  } transition-colors shadow-md`}
                  title={isInCart ? "Added to cart" : "Add to cart"}
                >
                  {isInCart ? (
                    <FiShoppingCart size={16} />
                  ) : (
                    <BiCartAdd size={16} />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Template Details Modal */}
      {activeTemplate && (
        <TemplateDetails
          template={activeTemplate}
          isDownloaded={downloadedTemplates.includes(activeTemplate.name)}
          downloadProgress={downloadProgress[activeTemplate.id]}
          onClose={() => setActiveTemplate(null)}
          onDownload={handleDownload}
          onServe={handleServe}
          onOpenInBrowser={openInBrowser}
          isOnline={isOnline}
          onAddToCart={() => addToCart(activeTemplate)}
          isInCart={cartItems.some(item => item.id === activeTemplate.id)}
        />
      )}

      {/* Shopping Cart Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-lg transform ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        } transition-transform duration-300 ease-in-out z-50 flex flex-col`}
      >
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium dark:text-white flex items-center">
            <FiShoppingCart className="mr-2" /> Shopping Cart
          </h3>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <AiOutlineClose size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FiShoppingCart size={48} className="mb-4 opacity-30" />
              <p className="text-center">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map(item => (
                <div 
                  key={item.id} 
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex justify-between items-start"
                >
                  <div>
                    <h4 className="font-medium text-sm dark:text-white">{item.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {item.description?.substring(0, 60)}...
                    </p>
                    <div className="mt-2 text-blue-600 dark:text-blue-400 font-medium">
                      ${item.price || '29.99'}
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-600 p-1"
                    title="Remove from cart"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t dark:border-gray-700">
          {cartItems.length > 0 && (
            <>
              <div className="flex justify-between mb-4">
                <span className="font-medium dark:text-white">Total:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  ${cartItems.reduce((sum, item) => sum + (item.price || 29.99), 0).toFixed(2)}
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={clearCart}
                  className="flex-1 py-2 px-4 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                >
                  Clear Cart
                </button>
                <button 
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Buy Custom Template Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-lg transform ${
          isBuyDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        } transition-transform duration-300 ease-in-out z-50 flex flex-col`}
      >
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium dark:text-white flex items-center">
            <BiDollarCircle className="mr-2" /> Request Custom Template
          </h3>
          <button 
            onClick={() => setIsBuyDrawerOpen(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <AiOutlineClose size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmitCustomTemplate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Name
              </label>
              <input
                type="text"
                name="name"
                value={buyFormData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={buyFormData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Template Style
              </label>
              <select
                name="style"
                value={buyFormData.style}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="Modern">Modern</option>
                <option value="Minimalist">Minimalist</option>
                <option value="Classic">Classic</option>
                <option value="Playful">Playful</option>
                <option value="Corporate">Corporate</option>
                <option value="Educational">Educational</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Budget Range
              </label>
              <select
                name="budget"
                value={buyFormData.budget}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="100-500">$100 - $500</option>
                <option value="500-1000">$500 - $1000</option>
                <option value="1000-2000">$1000 - $2000</option>
                <option value="2000+">$2000+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Desired Features
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="feature-responsive"
                    value="Responsive Design"
                    checked={buyFormData.features.includes("Responsive Design")}
                    onChange={handleCheckboxChange}
                    className="mr-2"
                  />
                  <label htmlFor="feature-responsive" className="text-sm dark:text-gray-300">
                    Responsive Design
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="feature-interactive"
                    value="Interactive Elements"
                    checked={buyFormData.features.includes("Interactive Elements")}
                    onChange={handleCheckboxChange}
                    className="mr-2"
                  />
                  <label htmlFor="feature-interactive" className="text-sm dark:text-gray-300">
                    Interactive Elements
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="feature-animation"
                    value="Animations"
                    checked={buyFormData.features.includes("Animations")}
                    onChange={handleCheckboxChange}
                    className="mr-2"
                  />
                  <label htmlFor="feature-animation" className="text-sm dark:text-gray-300">
                    Animations
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="feature-accessibility"
                    value="Accessibility Features"
                    checked={buyFormData.features.includes("Accessibility Features")}
                    onChange={handleCheckboxChange}
                    className="mr-2"
                  />
                  <label htmlFor="feature-accessibility" className="text-sm dark:text-gray-300">
                    Accessibility Features
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="feature-multilingual"
                    value="Multilingual Support"
                    checked={buyFormData.features.includes("Multilingual Support")}
                    onChange={handleCheckboxChange}
                    className="mr-2"
                  />
                  <label htmlFor="feature-multilingual" className="text-sm dark:text-gray-300">
                    Multilingual Support
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Template Description
              </label>
              <textarea
                name="description"
                value={buyFormData.description}
                onChange={handleInputChange}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Describe what you need in your custom template..."
                required
              ></textarea>
            </div>

            <button 
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Submit Request
            </button>
          </form>
        </div>
      </div>

      {/* Overlay for when either drawer is open */}
      {(isCartOpen || isBuyDrawerOpen) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => {
            setIsCartOpen(false)
            setIsBuyDrawerOpen(false)
          }}
        />
      )}
    </div>
  )
}

export default TemplateStore