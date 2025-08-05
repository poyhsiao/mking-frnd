import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
        </div>
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. 
            It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="btn btn-primary inline-flex items-center gap-2 px-6 py-3"
          >
            <HomeIcon className="h-5 w-5" />
            Go Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn btn-secondary inline-flex items-center gap-2 px-6 py-3"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Go Back
          </button>
        </div>
        
        <div className="mt-12">
          <p className="text-sm text-gray-500">
            If you think this is an error, please{' '}
            <a
              href="mailto:support@mkingfriend.com"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              contact our support team
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;