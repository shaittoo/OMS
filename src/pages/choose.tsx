import React from 'react';
import Link from 'next/link';

const Choose: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-tr from-purple-400 via-fuchsia-500 to-indigo-700">
      {/* Glass Container */}
      <div className="w-full max-w-3xl mx-4 p-8 rounded-2xl backdrop-blur-md bg-white/70 shadow-2xl">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-12">
          <img
            src="/assets/OMSLOGO.png"
            alt="OMS Logo"
            className="h-32 mb-8 drop-shadow-2xl transform hover:scale-105 transition-transform duration-300"
          />
          <h1 className="text-4xl font-bold mb-1 text-purple-800 text-center tracking-wide">
            Welcome to OMS
          </h1>
          <p className="text-xl text-purple-800  text-center font-light max-w-md">
            Choose your registration type to get started
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col space-y-6 max-w-lg mx-auto mb-12">
          <Link
            href="/registerorg"
            className="group relative px-8 py-4 overflow-hidden
              bg-gradient-to-r from-[#D848EF] to-[#4838CB]
              hover:shadow-lg hover:shadow-purple-500/30
              transform hover:translate-y-[-2px] 
              transition-all duration-300"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <div className="relative flex items-center justify-between">
              <span className="text-lg font-semibold text-white tracking-wide">
                Register an Organization
              </span>
              <svg className="w-6 h-6 text-white transform group-hover:translate-x-1 transition-transform" 
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            href="/registermember"
            className="group relative px-8 py-4 overflow-hidden
              bg-gradient-to-r from-[#D848EF] to-[#4838CB]
              hover:shadow-lg hover:shadow-purple-500/30
              transform hover:translate-y-[-2px]
              transition-all duration-300"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <div className="relative flex items-center justify-between">
              <span className="text-lg font-semibold text-white tracking-wide">
                Register as a Member
              </span>
              <svg className="w-6 h-6 text-white transform group-hover:translate-x-1 transition-transform" 
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-purple-800 text-sm font-light tracking-wider">
          www.organizationmanagementsystem.com
        </p>
      </div>
    </div>
  );
};

export default Choose;