"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import logo from "../../assets/logo1.png";
import {
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  LayoutDashboard,
  Building,
  BookOpen,
  Users,
  History,
  Upload,
  List,
  FileText,
} from "lucide-react"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [role, setRole] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const userRole = localStorage.getItem("role")
    setRole(userRole)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    navigate("/")
  }

  // Determine profile route based on role
  const profileRoute = role === "Formateur" ? "/formateur/profile" : "/superadmin/profile"

  // Navigation links based on role
  const superadminLinks = [
    { name: "Tableau de bord", href: "/Dashboard", icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
    { name: "Établissements", href: "/EtablissementManagement", icon: <Building className="mr-2 h-4 w-4" /> },
    { name: "Filières", href: "/superadmin/filieres", icon: <BookOpen className="mr-2 h-4 w-4" /> },
    { name: "Formateurs", href: "/FormateurManagement", icon: <Users className="mr-2 h-4 w-4" /> },
    { name: "Historique", href: "/schedule/history", icon: <History className="mr-2 h-4 w-4" /> },
    { name: "Importer Données", href: "/ImportData", icon: <Upload className="mr-2 h-4 w-4" /> },
    { name: "Importer Formateurs", href: "/ImportProfs", icon: <Upload className="mr-2 h-4 w-4" /> },
    { name: "Formateur List", href: "/FormateurList", icon: <List className="mr-2 h-4 w-4" /> },
    { name: "Drafts", href: "/DashboardDrafts", icon: <FileText className="mr-2 h-4 w-4" /> },
  ]

  const formateurLinks = [
    { name: "Dashboard", href: "/FormateurDashboard", icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
    { name: "Scheduled", href: "/Scheduled", icon: <History className="mr-2 h-4 w-4" /> },
    { name: "Import Leads", href: "/formateur/import-leads", icon: <Upload className="mr-2 h-4 w-4" /> },
    { name: "Leads", href: "/leads", icon: <List className="mr-2 h-4 w-4" /> },
    { name: "Resender", href: "/formateur/resender", icon: <Upload className="mr-2 h-4 w-4" /> },
    { name: "Messages", href: "/formateur/messages", icon: <FileText className="mr-2 h-4 w-4" /> },
  ]

  const links = role === "Superadmin" ? superadminLinks : role === "Formateur" ? formateurLinks : []

  return (
    <nav className="sticky top-0 z-40 w-full bg-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img src={logo} alt="Logo" className="h-20 w-15 object-contain" />
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              {links.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="group inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 transition-colors hover:text-[#004AAD]"
                >
                  <span className="relative py-2">
                    {link.name}
                    <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#004AAD] transition-all duration-300 group-hover:w-full"></span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:ml-6 md:flex md:items-center">
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center text-sm font-medium text-gray-700 hover:text-[#004AAD] focus:outline-none"
              >
                <span className="mr-2">Mon compte</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-10">
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
                      handleLogout()
                      setDropdownOpen(false)
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 hover:text-red-700"
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
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-[#004AAD] focus:outline-none"
            >
              <span className="sr-only">Ouvrir le menu principal</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden ${isOpen ? "block" : "hidden"}`}>
          <div className="space-y-1 pb-3 pt-2">
            {links.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="flex items-center border-l-4 border-transparent px-3 py-2 text-base font-medium text-gray-600 transition-colors hover:border-[#004AAD] hover:bg-gray-50 hover:text-[#004AAD]"
                onClick={() => setIsOpen(false)}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
          </div>
          <div className="border-t border-gray-200 pb-3 pt-4">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
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
                className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-[#004AAD]"
                onClick={() => setIsOpen(false)}
              >
                <User className="mr-2 h-4 w-4" />
                Profil
              </Link>
              <button
                onClick={() => {
                  handleLogout()
                  setIsOpen(false)
                }}
                className="flex w-full items-center px-4 py-2 text-base font-medium text-red-500 hover:bg-gray-100 hover:text-red-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
