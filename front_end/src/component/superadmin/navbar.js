import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react";
import logo from "../../assets/logo1.png";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    setRole(userRole);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  // Determine profile route based on role
  const profileRoute = role === "Formateur" ? "/formateur/profile" : "/superadmin/profile";

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img src={logo} alt="Logo" className="h-20 w-15 object-contain" />
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {role === "Superadmin" && [
                <Link
                  key="Dashboard"
                  to="/Dashboard"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-[#004AAD] hover:border-[#004AAD]"
                >
                  Tableau de bord
                </Link>,
                <Link
                  key="SalleManagement"
                  to="/SalleManagement"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-[#004AAD] hover:border-[#004AAD]"
                >
                  Salles 
                </Link>,
                <Link
                  key="FormateurManagement"
                  to="/FormateurManagement"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-[#004AAD] hover:border-[#004AAD]"
                >
                  Formateurs 
                </Link>,
                <Link
                  key="ScheduleHistory"
                  to="/schedule/history"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-[#004AAD] hover:border-[#004AAD]"
                >
                  Historique
                </Link>,
                <Link
                  key="FilterPage"
                  to="/FilterPage"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-[#004AAD] hover:border-[#004AAD]"
                >
                  Filtrer
                </Link>,
              ]}
            </div>
          </div>
          <div className="hidden md:ml-6 md:flex md:items-center">
            <div className="ml-3 relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center text-sm font-medium text-gray-700 hover:text-[#004AAD] focus:outline-none"
              >
                <span className="mr-2">Mon compte</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {dropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <Link
                    to={profileRoute}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-[#004AAD] hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">Ouvrir le menu principal</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
        {isOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {role === "Superadmin" && [
                <Link
                  key="Dashboard"
                  to="/Dashboard"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-[#004AAD] hover:bg-gray-50 hover:border-[#004AAD]"
                  onClick={() => setIsOpen(false)}
                >
                  Tableau de bord
                </Link>,
                <Link
                  key="SalleManagement"
                  to="/SalleManagement"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-[#004AAD] hover:bg-gray-50 hover:border-[#004AAD]"
                  onClick={() => setIsOpen(false)}
                >
                  Salles
                </Link>,
                <Link
                  key="FormateurManagement"
                  to="/FormateurManagement"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-[#004AAD] hover:bg-gray-50 hover:border-[#004AAD]"
                  onClick={() => setIsOpen(false)}
                >
                  Formateurs
                </Link>,
                <Link
                  key="ScheduleHistory"
                  to="/schedule/history"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-[#004AAD] hover:bg-gray-50 hover:border-[#004AAD]"
                  onClick={() => setIsOpen(false)}
                >
                  Historique
                </Link>,
                <Link
                  key="FilterPage"
                  to="/FilterPage"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-[#004AAD] hover:bg-gray-50 hover:border-[#004AAD]"
                  onClick={() => setIsOpen(false)}
                >
                  Filtrer
                </Link>,
              ]}
              {role === "Formateur" && [
                <Link
                  key="FormateurDashboard"
                  to="/FormateurDashboard"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-[#004AAD] hover:bg-gray-50 hover:border-[#004AAD]"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>,
                <Link
                  key="Scheduled"
                  to="/Scheduled"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-[#004AAD] hover:bg-gray-50 hover:border-[#004AAD]"
                  onClick={() => setIsOpen(false)}
                >
                  Scheduled
                </Link>,
                <Link
                  key="import-leads"
                  to="/formateur/import-leads"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-[#004AAD] hover:bg-gray-50 hover:border-[#004AAD]"
                  onClick={() => setIsOpen(false)}
                >
                  Import Leads
                </Link>,
                <Link
                  key="leads"
                  to="/leads"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-[#004AAD] hover:bg-gray-50 hover:border-[#004AAD]"
                  onClick={() => setIsOpen(false)}
                >
                  Leads
                </Link>,
                <Link
                  key="resender"
                  to="/formateur/resender"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-[#004AAD] hover:bg-gray-50 hover:border-[#004AAD]"
                  onClick={() => setIsOpen(false)}
                >
                  Resender
                </Link>,
                <Link
                  key="messages"
                  to="/formateur/messages"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-[#004AAD] hover:bg-gray-50 hover:border-[#004AAD]"
                  onClick={() => setIsOpen(false)}
                >
                  Messages
                </Link>,
              ]}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">Mon compte</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  to={profileRoute}
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-[#004AAD] hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Profil
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-[#004AAD] hover:bg-gray-100"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}