import React from 'react';
import { FiCheckCircle, FiDownload, FiClock } from 'react-icons/fi';

function TemplateCard({ template, isDownloaded, progress, onClick }) {
  const { name, price, status, pictures } = template;
  
  return (
    <div 
      className="border rounded  overflow-hidden transition cursor-pointer text-[10px]"
      onClick={onClick}
    >
      {/* Preview image */}
      <div className="h-48  overflow-hidden relative border-b">
        {pictures && pictures.length > 0 ? (
          <img 
            src={pictures[0]} 
            alt={`${name} preview`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-500">No preview available</p>
          </div>
        )}
        
        {/* Download progress overlay */}
        {progress !== undefined && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center text-white">
            <div className="w-16 h-16 mb-2 relative">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <circle 
                  cx="18" cy="18" r="16" 
                  fill="none" 
                  stroke="#e6e6e6" 
                  strokeWidth="2" 
                />
                <circle 
                  cx="18" cy="18" r="16" 
                  fill="none" 
                  stroke="#3f51b5" 
                  strokeWidth="2" 
                  strokeDasharray={`${progress} 100`}
                  transform="rotate(-90 18 18)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-semibold">
                {progress}%
              </div>
            </div>
            <p>Downloading...</p>
          </div>
        )}
      </div>
      
      {/* Template info */}
      <div className="p-4 hover:bg-gray-200/20">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg truncate" title={name}>{name}</h3>
          <span className={`px-2 py-1  rounded-full ${
            status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {status === 'available' ? 'Available' : 'Coming Soon'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">{price === 0 ? 'Free' : `$${price}`}</span>
          
          {isDownloaded ? (
            <span className="flex items-center text-green-600 text-[10px] font-medium">
              <FiCheckCircle className="mr-1" /> Downloaded
            </span>
          ) : (
            <span className="text-gray-500 flex items-center">
              {status === 'available' ? (

                 <div className='flex items-center bg-blue-600 text-white px-3 py-1 rounded-full'><FiDownload className="mr-1" /> Ready to download</div>
              ) : (
                <><FiClock className="mr-1" /> Coming soon</>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default TemplateCard;