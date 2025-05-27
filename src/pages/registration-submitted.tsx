import React from 'react';
import { useRouter } from 'next/router';

const RegistrationSubmitted = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-300 to-fuchsia-700 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Registration Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Your organization registration has been submitted for review. Check your status by logging in to your account.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full h-[55px] relative
							font-sans font-semibold text-base text-white
							cursor-pointer border-none rounded-[3px]
							bg-gradient-to-r from-purple-600 via-blue-500 via-purple-600 to-blue-700
							bg-[length:300%_100%] bg-left hover:bg-right
							transition-[background-position] duration-500 ease-in-out
							focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSubmitted; 