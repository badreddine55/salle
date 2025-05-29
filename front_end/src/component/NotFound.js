import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800">404 - Page Not Found</h1>
        <p className="mt-4 text-gray-600">The page you are looking for does not exist.</p>
        <Link
          to="/"
          className="mt-6 inline-block px-4 py-2 bg-[#004AAD] text-white rounded-md hover:bg-blue-700"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}