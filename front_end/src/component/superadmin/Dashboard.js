"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Layout from "./Layout"
import { useNavigate } from "react-router-dom"

// Button Component
function Button({ className = "", variant = "default", size = "default", children, ...props }) {
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
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  )
}

// RoomsList Component
function RoomsList({ rooms = { data: [] }, selectedRoom, onRoomSelect }) {
  const roomsData = rooms?.data || []

  return (
    <div className="space-y-3">
      {roomsData.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune salle disponible</p>
      ) : (
        roomsData.map((room) => (
          <div
            key={room._id}
            onClick={() => onRoomSelect(room.name)}
            className={`p-3 border rounded-lg hover:bg-gray-50 transition-colors bg-white shadow-sm cursor-pointer ${
              selectedRoom === room.name ? "border-[#ff0033] border-2" : "border-gray-200"
            }`}
          >
            <p className="font-medium text-gray-700">{room.name}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {room.secteur &&
                room.secteur.map((sector, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600"
                  >
                    {sector}
                  </span>
                ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// TrainersList Component
function TrainersList({ trainers = [], selectedTrainer, onTrainerSelect }) {
  const colors = [
    'bg-blue-200',
    'bg-green-200',
    'bg-yellow-200',
    'bg-purple-200',
    'bg-pink-200',
    'bg-teal-200',
    'bg-orange-200',
    'bg-red-200',
    'bg-indigo-200',
    'bg-gray-200',
  ]

  function getFormateurColor(formateurName) {
    const hash = Array.from(formateurName).reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <div className="space-y-3">
      {trainers.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun formateur disponible</p>
      ) : (
        trainers.map((trainer) => (
          <div
            key={trainer.id}
            onClick={() => onTrainerSelect(trainer.name)}
            className={`p-3 border rounded-lg hover:bg-gray-50 transition-colors bg-white shadow-sm cursor-pointer flex items-center ${
              selectedTrainer === trainer.name ? "border-[#ff0033] border-2" : "border-gray-200"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full mr-2 ${getFormateurColor(trainer.name)}`}
            ></div>
            <p className="font-medium text-gray-700">{trainer.name}</p>
          </div>
        ))
      )}
    </div>
  )
}

// Utility Function
function classNames(...classes) {
  return classes.filter(Boolean).join(" ")
}

// Main Dashboard Component
export default function Dashboard() {
  const [trainers, setTrainers] = useState([])
  const [rooms, setRooms] = useState({ data: [] })
  const [schedule, setSchedule] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [warning, setWarning] = useState("")
  const [selectedTrainer, setSelectedTrainer] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [modalTrainer, setModalTrainer] = useState("")
  const [modalRoom, setModalRoom] = useState("")
  const [roomSearch, setRoomSearch] = useState("")
  const [trainerSearch, setTrainerSearch] = useState("")
  const navigate = useNavigate()

  // Calendar-specific state and logic
  const [currentWeek] = useState(getWeekDates())

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
    'bg-blue-200',
    'bg-green-200',
    'bg-yellow-200',
    'bg-purple-200',
    'bg-pink-200',
    'bg-teal-200',
    'bg-orange-200',
    'bg-red-200',
    'bg-indigo-200',
    'bg-gray-200',
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

  const fetchData = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      setError("Authentification requise. Veuillez vous connecter.")
      setIsLoading(false)
      navigate("/")
      return
    }

    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000"
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }

    try {
      setIsLoading(true)
      // Fetch trainers
      const trainersResponse = await axios.get(`${apiUrl}/api/formateurs`, { headers })
      setTrainers(trainersResponse.data.filter((trainer) => trainer.role === "Formateur"))

      // Fetch rooms
      const roomsResponse = await axios.get(`${apiUrl}/api/salles`, { headers })
      setRooms(roomsResponse.data)

      // Fetch schedule
      const scheduleResponse = await axios.get(`${apiUrl}/api/schedule`, { headers })
      setSchedule(
        scheduleResponse.data.data.map((entry) => ({
          _id: entry._id,
          dayId: entry.dayId,
          slotId: entry.slotId,
          trainer: entry.formateur,
          room: entry.salle,
        }))
      )
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message
      setError(`Échec du chargement des données : ${errorMessage}`)
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [navigate])

  const checkConstraints = (dayId, slotId, trainer, room, excludeId = null) => {
    const duplicateAssignment = schedule.find(
      (s) =>
        s.dayId === dayId &&
        s.slotId === slotId &&
        s.trainer === trainer &&
        s.room === room &&
        s._id !== excludeId
    )
    if (duplicateAssignment) {
      return "Conflit : Cet formateur et cette salle sont déjà assignés à ce créneau."
    }

    const formateurConflict = schedule.find(
      (s) =>
        s.dayId === dayId &&
        s.slotId === slotId &&
        s.trainer === trainer &&
        s.room !== room &&
        s._id !== excludeId
    )
    if (formateurConflict) {
      console.warn(
        `Conflict detected: Formateur ${trainer} assigned to ${formateurConflict.room} in dayId ${dayId}, slotId ${slotId}`
      )
      return `Conflit : Cet formateur est déjà assigné à la salle "${formateurConflict.room}" dans ce créneau.`
    }

    const salleConflict = schedule.find(
      (s) =>
        s.dayId === dayId &&
        s.slotId === slotId &&
        s.room === room &&
        s._id !== excludeId
    )
    if (salleConflict) {
      console.warn(
        `Conflict detected: Salle ${room} already assigned in dayId ${dayId}, slotId ${slotId}`
      )
      return "Conflit : Cette salle est déjà assignée à ce créneau."
    }

    return null
  }

  const handleSlotClick = async (dayId, slotId) => {
    if (!selectedTrainer || !selectedRoom) {
      setError("Veuillez sélectionner un formateur et une salle avant d'assigner.")
      setTimeout(() => setError(""), 3000)
      return
    }

    if (!trainers.some((t) => t.name === selectedTrainer)) {
      setError("Formateur sélectionné non valide.")
      setTimeout(() => setError(""), 3000)
      return
    }
    if (!rooms.data.some((r) => r.name === selectedRoom)) {
      setError("Salle sélectionnée non valide.")
      setTimeout(() => setError(""), 3000)
      return
    }

    const conflictMessage = checkConstraints(dayId, slotId, selectedTrainer, selectedRoom)
    if (conflictMessage) {
      setWarning(conflictMessage)
      return
    }

    const token = localStorage.getItem("token")
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000"
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }

    try {
      await axios.patch(
        `${apiUrl}/api/schedule`,
        {
          dayId,
          slotId,
          trainerName: selectedTrainer,
          roomName: selectedRoom,
        },
        { headers }
      )
      await fetchData() // Refetch all data after creating/updating
      setSelectedTrainer(null)
      setSelectedRoom(null)
      setError("") // Clear any previous errors
      setWarning("") // Clear any previous warnings
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message
      setError(`Échec de l'enregistrement : ${errorMessage}`)
      setTimeout(() => setError(""), 5000)
    }
  }

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment)
    setModalTrainer(assignment.trainer)
    setModalRoom(assignment.room)
    setEditModalOpen(true)
  }

  const handleDeleteAssignment = async () => {
    const token = localStorage.getItem("token")
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000"
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }

    try {
      await axios.delete(`${apiUrl}/api/schedule/${editingAssignment._id}`, { headers })
      await fetchData() // Refetch all data after deleting
      setEditModalOpen(false)
      setEditingAssignment(null)
      setModalTrainer("")
      setModalRoom("")
      setError("") // Clear any previous errors
      setWarning("") // Clear any previous warnings
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message
      setError(`Échec de la suppression : ${errorMessage}`)
      setTimeout(() => setError(""), 5000)
    }
  }

  const filteredRooms = {
    data: rooms.data.filter((room) =>
      room.name.toLowerCase().includes(roomSearch.toLowerCase())
    ),
  }
  const filteredTrainers = trainers.filter((trainer) =>
    trainer.name.toLowerCase().includes(trainerSearch.toLowerCase())
  )

  const canClick = !!selectedTrainer && !!selectedRoom
  const useNewTooltipStyle = true

  return (
    <Layout>
      <main className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-[calc(100vh-64px)]">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center">
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-800"
            >
              ✕
            </button>
          </div>
        )}

        {warning && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-600 rounded-lg text-sm flex items-center">
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {warning}
            <button
              onClick={() => setWarning("")}
              className="ml-auto text-yellow-800"
            >
              ✕
            </button>
          </div>
        )}

        {editModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Détails de l'assignation</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Formateur</label>
                <input
                  type="text"
                  value={modalTrainer}
                  disabled
                  className="mt-1 block w-full p-2 border rounded-md bg-gray-100 text-gray-700"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Salle</label>
                <input
                  type="text"
                  value={modalRoom}
                  disabled
                  className="mt-1 block w-full p-2 border rounded-md bg-gray-100 text-gray-700"
                />
              </div>
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDeleteAssignment}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  Supprimer
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
          <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_250px] gap-6 flex-grow">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-semibold text-gray-800">Salles</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/superadmin/salles/create")}
                  className="text-[#ff0033] hover:text-[#222222] bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
                >
                  <span className="text-base">+</span>
                </Button>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Rechercher une salle..."
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0033]"
                />
              </div>
              <RoomsList
                rooms={filteredRooms}
                selectedRoom={selectedRoom}
                onRoomSelect={setSelectedRoom}
              />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-5">Planification hebdomadaire</h2>
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
                          const hasConflict = schedule.some(
                            (s) =>
                              s.dayId === day.id &&
                              s.slotId === slot.id &&
                              schedule.some(
                                (other) =>
                                  other.dayId === day.id &&
                                  other.slotId === slot.id &&
                                  ((other.trainer === s.trainer && other.room !== s.room) ||
                                   other.room === s.room)
                              )
                          )
                          return (
                            <div
                              key={slot.id}
                              onClick={canClick ? () => handleSlotClick(day.id, slot.id) : undefined}
                              className={`border p-3 h-36 bg-white rounded-xl ${
                                canClick
                                  ? "hover:bg-gray-50 transition-colors cursor-pointer"
                                  : "cursor-default"
                              } ${assignments.length > 0 ? "bg-red-50" : ""} ${
                                hasConflict ? "border-red-500 border-2" : "border-gray-200"
                              }`}
                            >
                              <div className="text-xs text-gray-600">
                                {slot.start} - {slot.end}
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {assignments.map((assignment, index) => (
                                    <div
                                      key={index}
                                      className="group relative flex items-center"
                                    >
                                      <div
                                        className={`px-2 py-1 text-xs font-medium text-gray-800 rounded-xl transition-transform group-hover:scale-105 ${getFormateurColor(assignment.trainer)}`}
                                      >
                                        {assignment.trainer.charAt(0).toUpperCase()}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleEditAssignment(assignment)
                                          }}
                                          className="ml-2 text-gray-600 hover:text-gray-800"
                                        >
                                          ✏️
                                        </button>
                                      </div>
                                      <div className="absolute z-10 hidden group-hover:block bg-white text-gray-800 text-sm rounded-lg p-3 mt-1 -top-20 left-0 shadow-lg border border-gray-200 w-48">
                                        <div className="absolute -bottom-2 left-3 w-4 h-4 bg-white transform rotate-45 border-r border-b border-gray-200"></div>
                                        <div className="font-medium mb-1">Formateur: {assignment.trainer}</div>
                                        <div className="font-medium">Salle: {assignment.room}</div>
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
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-semibold text-gray-800">Formateurs</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/superadmin/formateurs/create")}
                  className="text-[#ff0033] hover:text-[#222222] bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
                >
                  <span className="text-base">+</span>
                </Button>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Rechercher un formateur..."
                  value={trainerSearch}
                  onChange={(e) => setTrainerSearch(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0033]"
                />
              </div>
              <TrainersList
                trainers={filteredTrainers}
                selectedTrainer={selectedTrainer}
                onTrainerSelect={setSelectedTrainer}
              />
            </div>
          </div>
        )}
      </main>
    </Layout>
  )
}