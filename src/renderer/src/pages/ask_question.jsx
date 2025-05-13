import React from 'react';
import { Laptop, Shield, Zap, Cloud, Users, Award } from 'lucide-react';

const AskQuestion = () => {
  return (
    <div className="flex flex-col w-full h-full bg-white dark:bg-gray-900 dark:bg-black">
      <div className="flex items-center justify-between border-b p-2">
        <h1 className="text-sm font-semibold">About LearningDeck</h1>
        <div className="flex items-center space-x-2 text-gray-800 px-2 rounded-full py-0.5 bg-zinc-300/20 border border-zinc-300 dark:text-zinc-200">
          <span className="text-xs">Version 2.4.1</span>
        </div>
      </div>
      
      <div className="flex flex-col w-full p-2 overflow-auto">
        <div className="mb-4 flex items-center">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center mr-3">
            <Laptop size={20} className="text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h2 className="text-xs font-bold mb-0.5">LearningDeck</h2>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              A comprehensive exam platform that works both online and offline, 
              designed for educational institutions and training centers.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          <FeatureCard 
            icon={<Shield size={16} />}
            title="Secure Exam Environment"
            description="Locked-down testing to prevent unauthorized access"
          />
          <FeatureCard 
            icon={<Zap size={16} />}
            title="Online & Offline Mode"
            description="Conduct exams with or without internet access"
          />
          <FeatureCard 
            icon={<Cloud size={16} />}
            title="Auto-Sync & Backup"
            description="Automatic cloud sync with local backups"
          />
          <FeatureCard 
            icon={<Users size={16} />}
            title="Multi-User Support"
            description="Collaboration for instructors and test-takers"
          />
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-2 mb-4">
          <h2 className="text-xs font-medium mb-1.5">Capabilities</h2>
          <div className="grid grid-cols-2 gap-y-1 gap-x-2">
            <FeatureListItem>Multiple question types</FeatureListItem>
            <FeatureListItem>Customizable settings</FeatureListItem>
            <FeatureListItem>Automated grading</FeatureListItem>
            <FeatureListItem>Detailed analytics</FeatureListItem>
            <FeatureListItem>Result exports</FeatureListItem>
            <FeatureListItem>Proctoring tools</FeatureListItem>
          </div>
        </div>
        
        <div className="mb-4">
          <h2 className="text-xs font-medium mb-1.5">Ideal For</h2>
          <div className="grid grid-cols-3 gap-2">
            <UserCard 
              title="Educational Institutions"
              icon={<Award size={14} />}
            />
            <UserCard 
              title="Training Centers"
              icon={<Award size={14} />}
            />
            <UserCard 
              title="Testing Facilities"
              icon={<Award size={14} />}
            />
          </div>
        </div>
        
        <div className="border rounded p-2 mb-4">
          <h2 className="text-xs font-medium mb-1.5">Getting Started</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-start">
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-full h-4 w-4 flex items-center justify-center text-xs mr-1.5 flex-shrink-0 mt-0.5">1</div>
              <div>
                <h3 className="text-xs font-medium">Create Exam</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Use the "New Exam" button</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-full h-4 w-4 flex items-center justify-center text-xs mr-1.5 flex-shrink-0 mt-0.5">2</div>
              <div>
                <h3 className="text-xs font-medium">Configure Settings</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Set security and time limits</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-full h-4 w-4 flex items-center justify-center text-xs mr-1.5 flex-shrink-0 mt-0.5">3</div>
              <div>
                <h3 className="text-xs font-medium">Invite Users</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Send access codes to students</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-full h-4 w-4 flex items-center justify-center text-xs mr-1.5 flex-shrink-0 mt-0.5">4</div>
              <div>
                <h3 className="text-xs font-medium">Monitor & Review</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Track progress and results</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-2 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 LearningDeck</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">All rights reserved</p>
          </div>
          <div className="flex space-x-2">
            <button className="px-2 py-1 bg-blue-600 bg-blue-400 hover:bg-blue-700 text-white rounded text-xs">
              Tutorial
            </button>
            <button className="px-2 py-1 border border-gray-300 dark:border-gray-700 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-xs">
              Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="border rounded p-2 bg-white dark:bg-gray-900 dark:bg-black">
      <div className="flex items-start gap-1.5">
        <div className="p-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300">
          {icon}
        </div>
        <div>
          <h3 className="text-xs font-medium">{title}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
};

const FeatureListItem = ({ children }) => (
  <div className="flex items-center">
    <div className="text-green-500 dark:text-green-400 mr-1">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
      </svg>
    </div>
    <p className="text-xs text-gray-700 dark:text-gray-300">{children}</p>
  </div>
);

const UserCard = ({ title, icon }) => (
  <div className="border rounded p-2 flex flex-col items-center justify-center bg-white dark:bg-gray-900 dark:bg-black">
    <div className="mb-1 text-blue-600 dark:text-blue-400">
      {icon}
    </div>
    <h3 className="text-xs font-medium text-center">{title}</h3>
  </div>
);

export default AskQuestion;