import React from "react";
import { Link } from "react-router-dom";

export default function PageHeader({ title, actionButton, children }) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#004AAD]">{title}</h1>
          {actionButton && (
            <Link
              to={actionButton.href}
              className="bg-[#004AAD] text-white px-4 py-2 rounded-lg hover:bg-[#222222] transition-all text-sm font-medium"
            >
              {actionButton.label}
            </Link>
          )}
        </div>
        {children}
      </div>
    </header>
  );
}