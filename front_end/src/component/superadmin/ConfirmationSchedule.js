"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Layout from "./Layout"
import { useNavigate, useParams } from "react-router-dom"

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

// Main ConfirmationSchedule Component
export default function ConfirmationSchedule() {
  const [schedule, setSchedule] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingAssignment, setViewingAssignment] = useState(null)
  const navigate = useNavigate()
  const { confirmationDate } = useParams()

  const timeSlots = [
    { id: 1, start: "8:30", end: "11:00" },
    { id: 2, start: "11:00", end: "13:30" },
    { id: 3, start: "13:30", end: "16:00" },
    { id: 4, start: "16:00", end: "18:30" },
  ]

  const daysOfWeek = [
    { id: 1, name: "Lundi" },
    { id: 2, name: "Mardi" },
    { id: 3, name: "Mercredi" },
    { id: 4, name: "Jeudi" },
    { id: 5, name: "Vendredi" },
    { id: 6, name: "Samedi" },
  ]

  const colors = [
    "bg-blue-200",
    "bg-green-200",
    "bg-yellow-200",
    "bg-purple-200",
    "bg-pink-200",
    "bg-teal-200",
    "bg-orange-200",
    "bg-red-200",
    "bg-indigo-200",
    "bg-gray-200",
  ]

  function getFormateurColor(formateurName) {
    const hash = Array.from(formateurName).reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  function getWeekDates(date = new Date()) {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(date.setDate(diff))

    const weekDates = []
    for (let i = 0; i < 6; i++) {
      const currentDate = new Date(monday)
      currentDate.setDate(monday.getDate() + i)
      weekDates.push(currentDate)
    }

    return weekDates
  }

  function formatDate(date) {
    return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" })
  }

  const currentWeek = getWeekDates()

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
      console.log("Fetching schedule history for confirmation date:", confirmationDate)
      // Validate confirmationDate
      if (!confirmationDate) {
        throw new Error("Date de confirmation manquante dans l'URL.")
      }
      const parsedDate = new Date(confirmationDate)
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Date de confirmation invalide.")
      }

      const historyResponse = await axios.get(
        `${apiUrl}/api/schedules/history?date=${confirmationDate}`,
        { headers }
      )
      console.log("Raw history response:", historyResponse.data)

      if (!historyResponse.data.success) {
        throw new Error(historyResponse.data.message || "Échec de la récupération des données")
      }

      if (!historyResponse.data.data || historyResponse.data.data.length === 0) {
        setError("Aucune planification trouvée pour cette date de confirmation.")
        setSchedule([])
        setIsLoading(false)
        return
      }

      // Use the first group (should be only one due to date filter)
      const group = historyResponse.data.data[0]
      setSchedule(
        group.schedules.map((entry) => {
          const dayIndex = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'].indexOf(entry.jour)
          return {
            _id: entry.id,
            dayId: dayIndex !== -1 ? dayIndex + 1 : 0,
            slotId: entry.slot || 0,
            formateur: entry.formateur ? { _id: entry.formateur._id, name: entry.formateur.name || "N/A" } : null,
            salle: entry.salle || "N/A",
            groupe: entry.groupe || "N/A",
            filiere: entry.filiere ? { _id: entry.filiere._id, name: entry.filiere.name || "N/A" } : null,
            module: entry.module ? {
              name: entry.module.name || "Aucun",
              formateur: entry.module.formateur ? { _id: entry.module.formateur._id, name: entry.module.formateur.name || "N/A" } : null,
            } : null,
          }
        })
      )
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
  }, [navigate, confirmationDate])

  const handleViewAssignment = (assignment) => {
    setViewingAssignment(assignment)
    setViewModalOpen(true)
  }

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

        {viewModalOpen && viewingAssignment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Détails de l'emploi du temps</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Formateur</label>
                <p className="text-sm text-gray-900">{viewingAssignment.formateur?.name || "N/A"}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Salle</label>
                <p className="text-sm text-gray-900">{viewingAssignment.salle}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Groupe</label>
                <p className="text-sm text-gray-900">{viewingAssignment.groupe}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Module</label>
                <p className="text-sm text-gray-900">{viewingAssignment.module?.name || "Aucun"}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Filière</label>
                <p className="text-sm text-gray-900">{viewingAssignment.filiere?.name || "N/A"}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Jour</label>
                <p className="text-sm text-gray-900">{daysOfWeek.find((day) => day.id === viewingAssignment.dayId)?.name || "N/A"}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Créneau</label>
                <p className="text-sm text-gray-900">
                  {timeSlots.find((slot) => slot.id === viewingAssignment.slotId)?.start || "N/A"} -{" "}
                  {timeSlots.find((slot) => slot.id === viewingAssignment.slotId)?.end || "N/A"}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Statut</label>
                <p className="text-sm text-gray-900">Confirmé</p>
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={() => setViewModalOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
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
              <h2 className="text-xl font-semibold text-gray-800">
                Planification pour confirmation du{" "}
                {confirmationDate
                  ? new Date(confirmationDate).toLocaleString("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Date invalide"}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/schedule-history")}
                className="border-gray-300 hover:bg-gray-100"
              >
                Retour à l'historique
              </Button>
            </div>

            {schedule.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune planification disponible pour cette date.</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    {formatDate(currentWeek[0])} - {formatDate(currentWeek[currentWeek.length - 1])}
                  </h3>
                </div>

                <div className="min-w-[800px]">
                  <div className="grid grid-cols-6 gap-0.5 mb-0.5">
                    {daysOfWeek.map((day, index) => (
                      <div
                        key={day.id}
                        className="bg-gray-100 p-3 text-center font-semibold text-gray-800 rounded-t-xl"
                      >
                        <div>{day.name}</div>
                        <div className="text-xs text-gray-500">{formatDate(currentWeek[index])}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-6 gap-0.5">
                    {daysOfWeek.map((day) => (
                      <div key={day.id} className="grid grid-rows-4 gap-0.5">
                        {timeSlots.map((slot) => {
                          const assignments = schedule.filter(
                            (s) => s.dayId === day.id && s.slotId === slot.id
                          )
                          return (
                            <div
                              key={slot.id}
                              className="border p-3 h-36 bg-gray-50 rounded-xl cursor-default"
                            >
                              <div className="text-xs text-gray-600">
                                {slot.start} - {slot.end}
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {assignments.map((assignment) => (
                                    <div key={assignment._id} className="group relative flex items-center">
                                      <div
                                        className={`px-2 py-1 text-xs font-medium text-gray-800 rounded-xl transition-transform group-hover:scale-105 ${getFormateurColor(
                                          assignment.formateur.name
                                        )}`}
                                      >
                                        {assignment.formateur.name.charAt(0).toUpperCase()}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleViewAssignment(assignment)
                                          }}
                                          className="ml-2 text-gray-600 hover:text-gray-800"
                                        >
                                          👁️
                                        </button>
                                      </div>
                                      <div
                                        className="absolute z-10 hidden group-hover:block bg-white text-gray-800 text-sm rounded-lg p-3 mt-2 left-0 shadow-lg border border-gray-200 w-48"
                                        style={{ top: "100%", transform: "translateY(5px)" }}
                                      >
                                        <div className="absolute -top-2 left-3 w-4 h-4 bg-white transform rotate-45 border-l border-t border-gray-200"></div>
                                        <div className="font-medium mb-1">
                                          Formateur: {assignment.formateur.name}
                                        </div>
                                        <div className="font-medium mb-1">Salle: {assignment.salle}</div>
                                        <div className="font-medium mb-1">Groupe: {assignment.groupe}</div>
                                        <div className="font-medium">
                                          Module: {assignment.module?.name || "Aucun"}
                                        </div>
                                        <div className="font-medium mt-1">Statut: Confirmé</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </Layout>
  )
}