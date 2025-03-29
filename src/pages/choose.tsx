import React from 'react';
import Link from 'next/link';

const Choose: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-indigo-300 to-fuchsia-700 text-white">
      {/* Logo and Header */}
      <div className="flex flex-col items-center">
        <img src="/assets/OMSLOGO.png" alt="OMS Logo" className="h-32 mb-6" />
        <h1 className="text-3xl font-bold mb-4 text-center">
          Welcome to OMS
        </h1>
        <p className="text-lg text-center mb-8">
          Choose your registration type to get started!
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col space-y-4 px-8">
        <Link
          href="/registerorg"
          className="w-72 py-4 bg-purple-600 hover:bg-purple-200 text-white font-semibold rounded-lg shadow-lg text-center transition"
        >
          Register an Organization
        </Link>
        <Link
          href="/registermember"
          className="w-72 py-4 bg-purple-600 hover:bg-purple-200 text-white font-semibold rounded-lg shadow-lg text-center transition"
        >
          Register as a Member
        </Link>
      </div>

      {/* Footer */}
      <p className="text-center mt-12 text-sm">
        www.organizationmanagementsystem.com
      </p>
    </div>
  );
};

export default Choose;
