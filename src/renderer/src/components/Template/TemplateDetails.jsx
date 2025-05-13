import React, { useEffect, useState } from 'react';
import { LoaderIcon } from 'react-hot-toast';
import { FiDownload, FiChevronLeft, FiChevronRight, FiExternalLink, FiCheckCircle, FiClock, FiX, FiServer, FiStopCircle, FiAlertTriangle } from 'react-icons/fi';

function TemplateDetails({ 
  template, 
  isDownloaded, 
  downloadProgress, 
  onClose, 
  onDownload, 
  onServe, 
  onOpenInBrowser,
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isServing, setIsServing] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentlyServingTemplate, setCurrentlyServingTemplate] = useState(null);
  
  useEffect(() => {
    // Check localStorage on component mount to see if this template is being served
    const servedTemplates = JSON.parse(localStorage.getItem('servedTemplates') || '[]');
    setIsServing(servedTemplates.includes(template.id));
    
    // Check if any template is being served
    if (servedTemplates.length > 0 && !servedTemplates.includes(template.id)) {
      // Find the name of the currently serving template
      const servingTemplateId = servedTemplates[0]; // We're assuming only one template can be served at a time
      const servingTemplateName = localStorage.getItem(`templateName_${servingTemplateId}`);
      setCurrentlyServingTemplate(servingTemplateName || "another template");
    }
  }, [template.id]);

  if (!template) return null;
  
  const { name, price, status, pictures } = template;
  
  // Navigate through template images
  const nextImage = (e) => {
    e.stopPropagation();
    if (!pictures || pictures.length <= 1) return;
    setCurrentImageIndex((prev) => (prev + 1) % pictures.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (!pictures || pictures.length <= 1) return;
    setCurrentImageIndex((prev) => (prev - 1 + pictures.length) % pictures.length);
  };

  // Handle serve/stop template
  const handleServeToggle = async () => {
    try {
      // If we're already serving this template, we can just stop it
      if (isServing) {
        await onServe(template.name);
        setIsServing(false);
        
        // Update localStorage
        localStorage.setItem('servedTemplates', JSON.stringify([]));
        return;
      }
      
      // Check if any other template is being served
      const servedTemplates = JSON.parse(localStorage.getItem('servedTemplates') || '[]');
      if (servedTemplates.length > 0 && !servedTemplates.includes(template.id)) {
        // Show prompt to confirm stopping the other template
        setShowPrompt(true);
        return;
      }
      
      // No other template is being served, we can serve this one
      await serveThisTemplate();
    } catch (error) {
      console.error('Error toggling template serve state:', error);
    }
  };
  
  // Function to actually serve the template after checks
  const serveThisTemplate = async () => {
    await onServe(template.name);
    setIsServing(true);
    setShowPrompt(false);
    
    // Update localStorage with the new serving template
    localStorage.setItem('servedTemplates', JSON.stringify([template.id]));
    // Store the template name for reference
    localStorage.setItem(`templateName_${template.id}`, template.name);
  };
  
  // Handle confirmation from prompt
  const handleConfirmSwitch = async () => {
    await serveThisTemplate();
  };
  
  return (
    <div className="fixed inset-0 bg-black backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50 p-20 text-[10px]" onClick={onClose}>
      <div className="bg-white rounded-md shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium">{name}</h2>
            <button 
              className="text-gray-500 hover:text-gray-700" 
              onClick={onClose}
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Template image gallery */}
          <div className="relative mb-6">
            {pictures && pictures.length > 0 ? (
              <div className="relative h-64 md:h-96 rounded-lg overflow-hidden">
                <img 
                  src={pictures[currentImageIndex]} 
                  alt={`${name} preview ${currentImageIndex + 1}`}
                  className="object-contain w-full h-full border rounded-md"
                />
                
                {pictures.length > 1 && (
                  <>
                    <button 
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white border rounded-full p-2"
                      onClick={prevImage}
                    >
                      <FiChevronLeft className="text-gray-800" size={20} />
                    </button>
                    <button 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white border rounded-full p-2"
                      onClick={nextImage}
                    >
                      <FiChevronRight className="text-gray-800" size={20} />
                    </button>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
                      {currentImageIndex + 1} / {pictures.length}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No preview images available</p>
              </div>
            )}
          </div>

          {/* Template info and actions */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-600">Price: </span>
                <span className="font-semibold">{price === 0 ? 'Free' : `$${price}`}</span>
              </div>
              <div>
                <span className="text-gray-600">Status: </span>
                <span className={`font-semibold ${status === 'available' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {status === 'available' ? 'Available' : 'Coming Soon'}
                </span>
              </div>
            </div>

            {/* Confirmation prompt */}
            {showPrompt && (
              <div className="border border-yellow-300 bg-yellow-50 p-3 rounded-md mb-3">
                <div className="flex items-start gap-2">
                  <FiAlertTriangle className="text-yellow-500 mt-1" size={18} />
                  <div>
                    <p className="text-yellow-800 font-medium mb-2">
                      {currentlyServingTemplate} is currently being served
                    </p>
                    <p className="text-yellow-700 text-xs mb-3">
                      Only one template can be active at a time. Do you want to stop the current template and serve {name} instead?
                    </p>
                    <div className="flex gap-2">
                      <button 
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
                        onClick={handleConfirmSwitch}
                      >
                        Switch templates
                      </button>
                      <button 
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-xs"
                        onClick={() => setShowPrompt(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              {status === 'available' ? (
                <>
                  {isDownloaded ? (
                    <>
                      <button
                        className={`flex-1 flex items-center justify-center gap-2 py-1 px-3 rounded-full transition ${
                          isServing 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        onClick={handleServeToggle}
                      >
                        {isServing ? (
                          <>
                            <FiStopCircle />
                            Stop Serving
                          </>
                        ) : (
                          <>
                            <FiServer />
                            Serve Template
                          </>
                        )}
                      </button>
                      <button
                        className="flex items-center justify-center gap-2 bg-gray-100 text-gray-800 py-1 px-3 rounded-full hover:bg-gray-200 transition"
                        onClick={onOpenInBrowser}
                      >
                        <FiExternalLink />
                        Open in Browser
                      </button>
                    </>
                  ) : (
                    <button
                      className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-3 py-1 rounded-full hover:bg-indigo-700 transition"
                      onClick={() => onDownload(template)}
                      disabled={downloadProgress !== undefined}
                    >
                      {downloadProgress !== undefined ? (
                        <>
                          <LoaderIcon/>
                          Downloading {downloadProgress}%
                        </>
                      ) : (
                        <>
                          <FiDownload />
                          Download Template
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <button
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-400 text-white py-2 px-4 rounded-lg cursor-not-allowed"
                  disabled
                >
                  <FiClock />
                  Coming Soon
                </button>
              )}
            </div>
            
            {isServing && (
              <div className="mt-2 bg-green-50 border border-green-200 rounded-md p-2 text-green-700 text-xs">
                <p className="flex items-center gap-1">
                  <FiServer className="text-green-600" />
                  This template is currently being served
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplateDetails;