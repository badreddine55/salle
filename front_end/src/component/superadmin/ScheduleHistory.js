"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Layout from "./Layout"
import { useNavigate } from "react-router-dom"

// Button Component
function Button({ className = "", variant = "default", size = "default", children, disabled = false, ...props }) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"

  const variantStyles = {
    default: "bg-gray-900 text-white hover:bg-gray-800",
    outline: "border border-gray-200 bg-transparent hover:bg-gray-100",
    ghost: "bg-transparent hover:bg-gray-100",
    link: "bg-transparent underline-offset-4 hover:underline text-gray-900",
  }

  const sizeStyles = {
    default: "h-10 py-2 px-4",
    sm: "h-8 px-3 text-sm",
    lg: "h-12 px-6",
  }

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`

  return (
    <button className={combinedClassName} disabled={disabled} {...props}>
      {children}
    </button>
  )
}

// Main ScheduleHistory Component
export default function ScheduleHistory() {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [sortOrder, setSortOrder] = useState("desc") // desc: newest first, asc: oldest first
  const [expandedSections, setExpandedSections] = useState({}) // Track expanded/collapsed sections
  const navigate = useNavigate()

  const timeSlots = [
    { id: 1, start: "8:30", end: "11:00" },
    { id: 2, start: "11:00", end: "13:30" },
    { id: 3, start: "13:30", end: "16:00" },
    { id: 4, start: "16:00", end: "18:30" },
  ]

  const fetchData = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      setError("Authentification requise. Veuillez vous connecter.")
      setIsLoading(false)
      navigate("/")
      return
    }

    const apiUrl = process.env.REACT_APP_API_URL
    if (!apiUrl) {
      setError("Erreur de configuration : REACT_APP_API_URL manquant.")
      setIsLoading(false)
      return
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }

    try {
      setIsLoading(true)
      console.log("Fetching schedule history")
      const historyResponse = await axios.get(`${apiUrl}/api/schedules/history`, { headers })
      console.log("Raw history response:", historyResponse.data)

      if (!historyResponse.data.success) {
        throw new Error(historyResponse.data.message || "Échec de la récupération des données")
      }

      // Validate response data
      if (!historyResponse.data.data || !Array.isArray(historyResponse.data.data)) {
        console.warn("Invalid history data:", historyResponse.data.data)
        setError("Les données d'historique sont invalides ou absentes.")
        setHistory([])
        return
      }

      const transformedHistory = historyResponse.data.data
        .filter((group) => {
          const isValid = group && group.confirmationDate && Array.isArray(group.schedules);
          if (!isValid) {
            console.warn("Invalid group:", group);
          }
          return isValid;
        })
        .map((group) => {
          console.log("Processing group confirmationDate:", group.confirmationDate, typeof group.confirmationDate)
          const confirmationDate = new Date(group.confirmationDate)
          if (isNaN(confirmationDate.getTime())) {
            console.warn("Invalid confirmationDate:", group.confirmationDate)
            return null
          }
          return {
            confirmationDate,
            entries: group.schedules
              .filter((entry) => entry && entry.id && entry.formateur && entry.filiere)
              .map((entry) => ({
                id: entry.id,
                scheduleId: entry.scheduleId || entry.id,
                formateur: entry.formateur ? { _id: entry.formateur._id, name: entry.formateur.name || "N/A" } : null,
                salle: entry.salle || "N/A",
                groupe: entry.groupe || "N/A",
                filiere: entry.filiere ? { _id: entry.filiere._id, name: entry.filiere.name || "N/A" } : null,
                jour: entry.jour || "N/A",
                slotId: entry.slot || 0,
                module: entry.module ? {
                  name: entry.module.name || "Aucun",
                  formateur: entry.module.formateur ? { _id: entry.module.formateur._id, name: entry.module.formateur.name || "N/A" } : null,
                } : null,
                action: entry.action || "CONFIRMED",
                createdAt: new Date(entry.createdAt || group.createdAt),
              })),
          }
        })
        .filter((group) => group !== null);

      setHistory(transformedHistory);

      if (transformedHistory.length === 0) {
        setError(historyResponse.data.message || "Aucun historique disponible.")
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message
      console.error("Error details:", {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
      })
      if (error.response?.status === 403 && errorMessage.includes("Token expiré")) {
        setError("Session expirée. Veuillez vous reconnecter.")
        localStorage.removeItem("token")
        navigate("/")
      } else {
        setError(`Échec du chargement des données : ${errorMessage}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [navigate])

  const handleSortToggle = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc")
  }

  const toggleSection = (confirmationDate) => {
    setExpandedSections((prev) => ({
      ...prev,
      [confirmationDate.toISOString()]: !prev[confirmationDate.toISOString()],
    }))
  }

  const handleViewSchedule = (confirmationDate) => {
    if (!(confirmationDate instanceof Date) || isNaN(confirmationDate.getTime())) {
      console.error("Invalid confirmationDate for navigation:", confirmationDate)
      setError("Date de confirmation invalide.")
      return
    }
    navigate(`/schedule-history/${confirmationDate.toISOString()}`)
  }

  const sortedHistory = [...history].sort((a, b) => {
    const dateA = a.confirmationDate
    const dateB = b.confirmationDate
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB
  })

  return (
    <Layout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-[calc(100vh-64px)]">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
            <button onClick={() => setError("")} className="ml-auto text-red-600">
              ✕
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center flex-grow">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff0033]"></div>
            <span className="ml-3 text-gray-700 text-lg">Chargement...</span>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold text-gray-800">Historique des planifications</h2>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSortToggle}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Trier par date ({sortOrder === "desc" ? "Récent" : "Ancien"})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchData}
                  className="ml-2 border-gray-300 hover:bg-gray-100"
                  disabled={isLoading}
                >
                  {isLoading ? "Chargement..." : "Rafraîchir"}
                </Button>
              </div>
            </div>

            {sortedHistory.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun historique disponible.</p>
            ) : (
              <div className="space-y-4">
                {sortedHistory.map((group) => (
                  <div
                    key={group.confirmationDate.toISOString()}
                    className="border border-gray-200 rounded-lg shadow-sm"
                  >
                    <div
                      className="flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer rounded-t-lg"
                      onClick={() => {
                        toggleSection(group.confirmationDate)
                        handleViewSchedule(group.confirmationDate)
                      }}
                    >
                      <div>
                        <h3 className="text-lg font-medium text-gray-800">
                          Confirmation du{" "}
                          {group.confirmationDate.toLocaleString("fr-FR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </h3>
                        <p className="text-sm text-gray-500">{group.entries.length} planification(s)</p>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-500 transform transition-transform ${
                          expandedSections[group.confirmationDate.toISOString()] ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {expandedSections[group.confirmationDate.toISOString()] && (
                      <div className="p-4 space-y-4">
                        {group.entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Date:</span>{" "}
                                {entry.createdAt.toLocaleString("fr-FR", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Action:</span>{" "}
                                {entry.action === "CREATED" ? "Créé" : entry.action}
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Formateur:</span>{" "}
                                {entry.formateur?.name || "N/A"}
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Salle:</span> {entry.salle}
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Groupe:</span> {entry.groupe}
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Filière:</span>{" "}
                                {entry.filiere?.name || "N/A"}
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Jour:</span> {entry.jour}
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Créneau:</span>{" "}
                                {timeSlots.find((slot) => slot.id === entry.slotId)?.start || "N/A"} -{" "}
                                {timeSlots.find((slot) => slot.id === entry.slotId)?.end || "N/A"}
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Module:</span>{" "}
                                {entry.module?.name || "Aucun"}
                                {entry.module?.formateur && (
                                  <span> (Formateur: {entry.module.formateur.name || "N/A"})</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </Layout>
  )
}