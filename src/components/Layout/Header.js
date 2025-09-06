// src/components/Layout/Header.js
import React from 'react';

const Header = ({ currentUser, onSignOut }) => {
  return (
    <header className="bg-[#5D1F1F] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/c-ball.png" 
              alt="Cawood Tennis Club" 
              className="w-10 h-10 shadow object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-10 h-10 bg-[#4A1818] rounded-full flex items-center justify-center shadow" style={{display: 'none'}}>
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Cawood Tennis Club</h1>
              <p className="text-red-100 text-sm">Welcome, {currentUser?.name}</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="text-red-100 hover:text-white text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;