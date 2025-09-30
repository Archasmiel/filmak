import React from 'react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
        <p className="text-2xl text-gray-700 mb-6">Oops! Page not found.</p>
        <a href="/" className="text-blue-600 hover:underline">Go back to Home</a>
      </div>
    </div>
  );
};

export default NotFoundPage;
