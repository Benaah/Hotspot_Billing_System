import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface LoadingRouterProps {
  size?: 'small' | 'medium' | 'large';
}

const LoadingRouter: React.FC<LoadingRouterProps> = ({ size = 'medium' }) => {
  const { theme } = useTheme();
  
  const sizeClasses = {
    small: 'w-16 h-16 scale-75',
    medium: 'w-20 h-20',
    large: 'w-24 h-24 scale-150'
  };

  const themeColors = {
    routerColor: theme === 'dark' ? '#1d4ed8' : '#2563eb',
    routerBaseColor: theme === 'dark' ? '#1e40af' : '#1d4ed8',
    routerLightColor: theme === 'dark' ? '#93c5fd' : '#60a5fa',
    signalColor: theme === 'dark' ? '#93c5fd' : '#60a5fa'
  };

  return (
    <div className={`flex justify-center items-center p-4 ${sizeClasses[size]}`}>
      <div className="relative">
        {/* Router body */}
        <div 
          className="router-body"
          style={{
            backgroundColor: themeColors.routerBaseColor,
            border: `3px solid ${themeColors.routerColor}`
          }}
        ></div>

        {/* Router antenna */}
        <div 
          className="router-antenna"
          style={{
            backgroundColor: themeColors.routerColor
          }}
        >
          <div 
            className="router-antenna-tip"
            style={{
              backgroundColor: themeColors.routerLightColor
            }}
          ></div>
        </div>

        {/* Router lights */}
        <div className="router-lights">
          <div 
            className="router-light"
            style={{
              backgroundColor: themeColors.routerLightColor,
              animationDelay: '0.1s',
              boxShadow: theme === 'dark' 
                ? '0 0 5px #93c5fd, 0 0 10px #93c5fd' 
                : '0 0 5px #60a5fa, 0 0 10px #60a5fa'
            }}
          ></div>
          <div 
            className="router-light"
            style={{
              backgroundColor: themeColors.routerLightColor,
              animationDelay: '0.3s'
            }}
          ></div>
          <div 
            className="router-light"
            style={{
              backgroundColor: themeColors.routerLightColor,
              animationDelay: '0.5s'
            }}
          ></div>
        </div>

        {/* WiFi signal */}
        <div className="wifi-signal">
          <span 
            style={{
              backgroundColor: themeColors.signalColor,
              animationDelay: '0.2s'
            }}
          ></span>
          <span 
            style={{
              backgroundColor: themeColors.signalColor,
              animationDelay: '0.4s'
            }}
          ></span>
          <span 
            style={{
              backgroundColor: themeColors.signalColor,
              animationDelay: '0.6s'
            }}
          ></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingRouter;