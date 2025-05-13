// src/utils/serverConfig.js

import toast from 'react-hot-toast';

/**
 * Utility functions for managing server configuration throughout the application
 */

/**
 * Reset the server configuration and clear stored server state
 * @param {Function} [callback] - Optional callback function to execute after reset
 * @param {Object} [options] - Options for the reset operation
 * @param {boolean} [options.showToast=true] - Whether to show a toast notification
 * @param {boolean} [options.redirect=false] - Whether to redirect to the dashboard
 * @param {string} [options.redirectPath='/'] - Path to redirect to if redirect is true
 */
export const resetServerConfig = (callback, options = {}) => {
  const { showToast = true, redirect = false, redirectPath = '/' } = options;
  
  // Clear all server-related data from localStorage
  localStorage.removeItem('serverStarted');
  localStorage.removeItem('serverIP');
  localStorage.removeItem('serverPort');
  
  // Add any additional cleanup here
  
  // Show toast notification if enabled
  if (showToast) {
    toast.success('Server configuration reset');
  }
  
  // Log the action
  console.log(`${new Date().toLocaleTimeString()} Server configuration reset`);
  
  // Execute callback if provided
  if (typeof callback === 'function') {
    callback();
  }
  
  // Redirect if enabled
  if (redirect) {
    window.location.href = redirectPath;
  }
};

/**
 * Get current server information
 * @returns {Object|null} Server information or null if not configured
 */
export const getServerInfo = () => {
  const serverStarted = localStorage.getItem('serverStarted') === 'true';
  const serverIP = localStorage.getItem('serverIP');
  const serverPort = localStorage.getItem('serverPort');
  
  if (serverStarted && serverIP && serverPort) {
    return {
      ip: serverIP,
      port: parseInt(serverPort),
      isRunning: true
    };
  }
  
  return null;
};

/**
 * Check if server is configured
 * @returns {boolean} True if server is configured
 */
export const isServerConfigured = () => {
  return localStorage.getItem('serverStarted') === 'true';
};

/**
 * Save server configuration
 * @param {string} ip - Server IP address
 * @param {number|string} port - Server port
 */
export const saveServerConfig = (ip, port) => {
  localStorage.setItem('serverStarted', 'true');
  localStorage.setItem('serverIP', ip);
  localStorage.setItem('serverPort', port.toString());
};