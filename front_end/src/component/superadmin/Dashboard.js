"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Layout from "./Layout"
import { useNavigate } from "react-router-dom"
import Select from "react-select"

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

// TrainersList Component
function TrainersList({ trainers = [], selectedTrainer, onTrainerSelect }) {
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

  return (
    <div className="space-y-3">
      {trainers.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun formateur disponible</p>
      ) : (
        trainers.map((trainer) => (
          <div
            key={trainer._id}
            onClick={() => onTrainerSelect(trainer)}
            className={`p-3 border rounded-lg hover:bg-gray-50 transition-colors bg-white shadow-sm cursor-pointer ${
              selectedTrainer?._id === trainer._id ? "border-green-500 border-2" : "border-gray-200"
            }`}
          >
            <div className={`w-3 h-3 rounded-full mr-2 inline-block ${getFormateurColor(trainer.name)}`}></div>
            <p className="font-medium text-gray-700 inline-block">{trainer.name}</p>
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

// Main DashboardSchedules Component
export default function Dashboard() {
  const [trainers, setTrainers] = useState([])
  const [etablissements, setEtablissements] = useState({ data: [] })
  const [filieres, setFilieres] = useState([])
  const [schedule, setSchedule] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [warning, setWarning] = useState("")
  const [selectedTrainer, setSelectedTrainer] = useState(null)
  const [selectedEtablissement, setSelectedEtablissement] = useState(null)
  const [selectedSalle, setSelectedSalle] = useState(null)
  const [selectedFiliere, setSelectedFiliere] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [selectedModule, setSelectedModule] = useState(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [modalTrainer, setModalTrainer] = useState("")
  const [modalSalle, setModalSalle] = useState("")
  const [modalGroup, setModalGroup] = useState("")
  const [modalModule, setModalModule] = useState("")
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

  const fetchData = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      setError("Authentification requise. Veuillez vous connecter.")
      setIsLoading(false)
      navigate("/")
      return
    }

    const apiUrl = process.env.REACT_APP_API_URL
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }

    try {
      setIsLoading(true)

      // Fetch trainers
      console.log("Fetching formateurs in DashboardSchedules")
      const trainersResponse = await axios.get(`${apiUrl}/api/formateurs`, { headers })
      const trainersData = Array.isArray(trainersResponse.data.data)
        ? trainersResponse.data.data.filter((trainer) => trainer.role === "Formateur")
        : []
      setTrainers(trainersData)
      console.log("Trainers:", trainersData)

      // Fetch etablissements
      const etablissementsResponse = await axios.get(`${apiUrl}/api/etablissements`, { headers })
      setEtablissements({
        data: Array.isArray(etablissementsResponse.data.data) ? etablissementsResponse.data.data : [],
      })

      // Fetch filieres
      const filieresResponse = await axios.get(`${apiUrl}/api/filieres`, { headers })
      setFilieres(Array.isArray(filieresResponse.data.data) ? filieresResponse.data.data : [])

      // Fetch all schedules
      console.log("Fetching all schedules")
      const scheduleResponse = await axios.get(`${apiUrl}/api/schedules`, { headers })
      const dayMap = { LUNDI: 1, MARDI: 2, MERCREDI: 3, JEUDI: 4, VENDREDI: 5, SAMEDI: 6 }
      setSchedule(
        Array.isArray(scheduleResponse.data.data)
          ? scheduleResponse.data.data.map((entry) => ({
              _id: entry.id,
              dayId: dayMap[entry.jour] || 1,
              slotId: entry.slot,
              formateur: { _id: entry.formateur?._id || null, name: entry.formateur?.name || "N/A" },
              salle: entry.salle,
              filiere: entry.filiere ? { _id: entry.filiere._id, name: entry.filiere.name } : null,
              groupe: entry.groupe || "N/A",
              module: entry.module ? { name: entry.module.name, formateur: entry.module.formateur } : null,
            }))
          : [],
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

  const handleViewAssignment = (assignment) => {
    setEditingAssignment(assignment)
    setModalTrainer(assignment.formateur.name)
    setModalSalle(assignment.salle)
    setModalGroup(assignment.groupe)
    setModalModule(assignment.module ? assignment.module.name : "")
    setEditModalOpen(true)
  }

  const filteredTrainers = trainers.filter((trainer) =>
    trainer.name.toLowerCase().includes(trainerSearch.toLowerCase()),
  )

  const filteredAssignments = schedule.filter((entry) => {
    const matchesTrainer = selectedTrainer ? entry.formateur._id === selectedTrainer._id : true
    const matchesGroup = selectedGroup ? entry.groupe === selectedGroup : true
    const matchesSalle = selectedSalle ? entry.salle === selectedSalle : true
    const matchesFiliere = selectedFiliere ? entry.filiere?._id === selectedFiliere : true
    const matchesModule = selectedModule ? entry.module?.name === selectedModule : true
    return matchesTrainer && matchesGroup && matchesSalle && matchesFiliere && matchesModule
  })

  const etablissementOptions = etablissements.data.map((etablissement) => ({
    value: etablissement._id,
    label: etablissement.name,
    salles: etablissement.salles,
  }))

  const salleOptions =
    selectedEtablissement?.salles.map((salle) => ({
      value: salle,
      label: salle,
    })) || []

  const filiereOptions = Array.isArray(filieres)
    ? filieres.map((filiere) => ({
        value: filiere._id,
        label: filiere.name,
      }))
    : []

  const groupOptions =
    filieres
      .find((f) => f._id === selectedFiliere)
      ?.groups.map((group) => ({
        value: group.name,
        label: group.name,
      })) || []

  const moduleOptions =
    filieres
      .find((f) => f._id === selectedFiliere)
      ?.modules.map((module) => ({
        value: module.name,
        label: module.name,
      })) || []

  return (
    <Layout>
      <main className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-[calc(100vh-64px)]">
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

        {warning && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-600 rounded-lg text-sm flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {warning}
            <button onClick={() => setWarning("")} className="ml-auto text-yellow-600">
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
                  value={modalSalle}
                  disabled
                  className="mt-1 block w-full p-2 border rounded-md bg-gray-100 text-gray-700"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Groupe</label>
                <input
                  type="text"
                  value={modalGroup}
                  disabled
                  className="mt-1 block w-full p-2 border rounded-md bg-gray-100 text-gray-700"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Module</label>
                <input
                  type="text"
                  value={modalModule}
                  disabled
                  className="mt-1 block w-full p-2 border rounded-md bg-gray-100 text-gray-700"
                />
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
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
          <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_250px] gap-6 flex-grow">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-semibold text-gray-800">Établissements</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/superadmin/etablissements/create")}
                  className="text-[#ff0033] hover:text-[#222222] bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
                >
                  <span className="text-base">+</span>
                </Button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Établissement</label>
                <Select
                  options={etablissementOptions}
                  value={etablissementOptions.find((option) => option.value === selectedEtablissement?._id) || null}
                  onChange={(option) => {
                    setSelectedEtablissement(option ? { _id: option.value, salles: option.salles } : null)
                    setSelectedSalle(null)
                  }}
                  placeholder="Sélectionner un établissement..."
                  isClearable
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: "#d1d5db",
                      "&:hover": { borderColor: "#ff0033" },
                      boxShadow: "none",
                      borderRadius: "0.375rem",
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected ? "#ff0033" : state.isFocused ? "#f9fafb" : "white",
                      color: state.isSelected ? "white" : "#374151",
                    }),
                  }}
                />
              </div>
              {selectedEtablissement && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Salles disponibles</label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedEtablissement.salles.map((salle) => (
                      <div
                        key={salle}
                        onClick={() => setSelectedSalle(salle)}
                        className={`p-3 border rounded-lg hover:bg-gray-50 transition-colors bg-white shadow-sm cursor-pointer ${
                          selectedSalle === salle ? "border-[#ff0033] border-2" : "border-gray-200"
                        }`}
                      >
                        <p className="font-medium text-gray-700">{salle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-5">Planification hebdomadaire</h2>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="w-full md:w-64">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
                  <Select
                    options={filiereOptions}
                    value={filiereOptions.find((option) => option.value === selectedFiliere) || null}
                    onChange={(option) => {
                      setSelectedFiliere(option ? option.value : null)
                      setSelectedGroup(null)
                      setSelectedModule(null)
                    }}
                    placeholder="Sélectionner une filière..."
                    isClearable
                    className="text-sm"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: "#d1d5db",
                        "&:hover": { borderColor: "#ff0033" },
                        boxShadow: "none",
                        borderRadius: "0.375rem",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected ? "#ff0033" : state.isFocused ? "#f9fafb" : "white",
                        color: state.isSelected ? "white" : "#374151",
                      }),
                    }}
                  />
                </div>

                {selectedFiliere && (
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Groupes</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {groupOptions.map((group) => (
                        <div
                          key={group.value}
                          onClick={() => setSelectedGroup(group.value)}
                          className={`p-2 border rounded-lg hover:bg-gray-50 transition-colors bg-white shadow-sm cursor-pointer ${
                            selectedGroup === group.value ? "border-[#ff0033] border-2" : "border-gray-200"
                          }`}
                        >
                          <p className="font-medium text-gray-700 text-sm">{group.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedFiliere && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                  <Select
                    options={moduleOptions}
                    value={moduleOptions.find((option) => option.value === selectedModule) || null}
                    onChange={(option) => setSelectedModule(option ? option.value : null)}
                    placeholder="Sélectionner un module..."
                    isClearable
                    className="text-sm"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: "#d1d5db",
                        "&:hover": { borderColor: "#ff0033" },
                        boxShadow: "none",
                        borderRadius: "0.375rem",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected ? "#ff0033" : state.isFocused ? "#f9fafb" : "white",
                        color: state.isSelected ? "white" : "#374151",
                      }),
                    }}
                  />
                  {selectedFiliere && moduleOptions.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">Aucun module disponible pour cette filière.</p>
                  )}
                </div>
              )}
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
                          const assignments = filteredAssignments.filter(
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