import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiServer, FiExternalLink, FiWifiOff } from 'react-icons/fi';
import Dialog from '../components/dailog';

function DownloadedTemplates() {
  const [downloadedTemplates, setDownloadedTemplates] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentlyServingTemplateId, setCurrentlyServingTemplateId] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [serverInfo, setServerInfo] = useState({ ip: '', port: '' });

  // Load server info immediately on component mount
  useEffect(() => {
    const getServerInfo = async () => {
      try {
        const info = await window.api.getServerInfo();
        setServerInfo(info);
      } catch (error) {
        console.error('Error fetching server info:', error);
      }
    };

    getServerInfo();
  }, []);

  // Setup online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch downloaded templates and auto-serve last template
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const downloaded = await window.api.getDownloadedTemplates();
        
        // Add additional metadata to each template
        const enhancedTemplates = await Promise.all(downloaded.map(async (templateName) => {
          try {
            const metadata = await window.api.getTemplateMetadata(templateName);
            return metadata || { 
              name: templateName, 
              id: templateName.toLowerCase().replace(/\s+/g, '-') 
            };
          } catch (err) {
            return { 
              name: templateName, 
              id: templateName.toLowerCase().replace(/\s+/g, '-') 
            };
          }
        }));

        setDownloadedTemplates(enhancedTemplates);

        // Check if there's a last served template in localStorage
        const lastServedTemplateId = localStorage.getItem('lastServedTemplateId');
        const lastServedTemplateName = localStorage.getItem('lastServedTemplateName');
        
        if (lastServedTemplateId && lastServedTemplateName) {
          // Automatically serve the last template
          setCurrentlyServingTemplateId(lastServedTemplateId);
          
          // Check if the template actually exists in the downloaded templates
          const templateExists = enhancedTemplates.some(t => t.id === lastServedTemplateId);
          
          if (templateExists) {
            try {
              await window.api.serveTemplate(lastServedTemplateName);
              console.log(`Auto-serving previous template: ${lastServedTemplateName}`);
            } catch (err) {
              console.error(`Failed to auto-serve template: ${err.message}`);
            }
          } else {
            // If the template no longer exists, clear localStorage
            localStorage.removeItem('lastServedTemplateId');
            localStorage.removeItem('lastServedTemplateName');
            setCurrentlyServingTemplateId(null);
            
            // If we have any templates, serve the first one
            if (enhancedTemplates.length > 0) {
              await handleServe(enhancedTemplates[0].name);
            }
          }
        } else if (enhancedTemplates.length > 0) {
          // If no template was previously served but we have templates, serve the first one
          await handleServe(enhancedTemplates[0].name);
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch downloaded templates: ' + err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle serving a template
  const handleServe = async (templateName) => {
    try {
      const templateId = templateName.toLowerCase().replace(/\s+/g, '-');
      
      // Don't allow stopping - only switching
      if (currentlyServingTemplateId === templateId) {
        // If clicking the same template, do nothing
        return true;
      }
      
      // Stop current template and serve the new one
      await window.api.serveTemplate(templateName);
      setCurrentlyServingTemplateId(templateId);
      
      // Update localStorage with the new template
      localStorage.setItem('lastServedTemplateId', templateId);
      localStorage.setItem('lastServedTemplateName', templateName);
      
      return true;
    } catch (err) {
      console.error(`Failed to serve template: ${err.message}`);
      return false;
    }
  };
  const HandleClose = () => {
    setIsOpen(false)
  }

  // Open template in browser
  const openInBrowser = async () => {
    if (currentlyServingTemplateId) {
      try {
        await window.api.openTemplateInBrowser();
      } catch (err) {
        console.error("Failed to open template in browser:", err);
        // Fallback: Construct URL manually and open
        const url = `http://${serverInfo.ip}:${serverInfo.port}`;
        window.open(url, '_blank');
      }
    }
  };

  // If loading, show a loading spinner
  if (loading) {
    return (
      <div className="relative ">
        <button
          className="flex items-center justify-between w-full px-4 py-2 text-[10px] bg-white gap-1 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full "
          disabled
        >
          <span>Loading templates...</span>
          <div className="animate-spin h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent"></div>
        </button>
      </div>
    );
  }

  // If there's an error, show an error message
  if (error) {
    return (
      <div className="relative ">
        <button
          className="flex items-center justify-between w-full px-4 py-2 text-[10px] bg-white dark:bg-gray-800 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-full "
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>Error loading templates</span>
          <FiWifiOff size={16} />
        </button>
      </div>
    );
  }

  // If no templates are downloaded
  if (downloadedTemplates.length === 0) {
    return (
      <div className="relative ">
        <button
          className="flex items-center justify-between w-full px-4 py-2 text-[10px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full "
          disabled
        >
          <span>No templates downloaded</span>
          <FiChevronDown size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative text-[10px]">
      <button
        className="flex items-center justify-between w-fit px-3 py-1 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="">
          {currentlyServingTemplateId
            ? `Serving: ${downloadedTemplates.find(t => t.id === currentlyServingTemplateId)?.name || 'Template'}`
            : 'Downloaded Templates'}
        </span>
        {isOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
      </button>
  {isOpen && (
   <Dialog
   title={'Please select a template'}
   onClose={HandleClose}
   children={
        <div className=" bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded max-h-60 overflow-auto text-[10px]">
          <ul className="py-1">
       
            {downloadedTemplates.map((template) => {
              const isServing = currentlyServingTemplateId === template.id;
              
              return (
                <li key={template.id} className="px-2 py-1">
                  <div className="flex items-center justify-between border px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700  dark:bg-gray-800 dark:border-gray-600  rounded-md">
                    <span className="text-gray-700 dark:text-gray-300">{template.name}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleServe(template.name)}
                        className={`px-2 py-1 rounded-full ${
                          isServing
                            ? 'bg-green-600 text-white dark:bg-green-800 dark:text-green-200'
                            : 'bg-blue-600 text-white dark:bg-blue-800 dark:text-blue-200'
                        }`}
                      >
                        <div className="flex items-center">
                          <FiServer className="mr-1" />
                          {isServing ? 'Active' : 'Serve'}
                        </div>
                      </button>
                      
                      {isServing && (
                        <button
                          onClick={openInBrowser}
                          className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-full"
                          title="Open in browser"
                        >
                          <FiExternalLink />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          
       
        </div>
   }
   />
    
    
      )}
    </div>
  );
}

export default DownloadedTemplates;