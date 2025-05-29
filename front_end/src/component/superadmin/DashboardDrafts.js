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
function TrainersList({ trainers = [], selectedTrainer, onTrainerSelect, isTrainerAvailable }) {
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
            className={`p-3 border rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer ${
              selectedTrainer?._id === trainer._id ? "border-green-500 border-2" : "border-gray-200"
            } ${isTrainerAvailable && !isTrainerAvailable(trainer._id) ? "bg-red-50" : "bg-white"}`}
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

// Validate ObjectId
const isValidObjectId = (id) => id && /^[0-9a-fA-F]{24}$/.test(id);

// Main DashboardDrafts Component
export default function DashboardDrafts() {
  const [trainers, setTrainers] = useState([])
  const [etablissements, setEtablissements] = useState({ data: [] })
  const [filieres, setFilieres] = useState([])
  const [drafts, setDrafts] = useState([])
  const [schedules, setSchedules] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState("")
  const [warning, setWarning] = useState("")
  const [selectedTrainer, setSelectedTrainer] = useState(null)
  const [selectedEtablissement, setSelectedEtablissement] = useState(null)
  const [selectedSalle, setSelectedSalle] = useState(null)
  const [selectedFiliere, setSelectedFiliere] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [selectedModule, setSelectedModule] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null) // { dayId, slotId }
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingAssignment, setViewingAssignment] = useState(null)
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
    const dayMap = { LUNDI: 1, MARDI: 2, MERCREDI: 3, JEUDI: 4, VENDREDI: 5, SAMEDI: 6 }

    try {
      setIsLoading(true)

      // Fetch trainers
      try {
        console.log("Fetching formateurs in DashboardDrafts")
        const trainersResponse = await axios.get(`${apiUrl}/api/formateurs`, { headers })
        const trainersData = Array.isArray(trainersResponse.data.data)
          ? trainersResponse.data.data.filter((trainer) => trainer.role === "Formateur")
          : []
        setTrainers(trainersData)
        console.log("Trainers:", trainersData)
      } catch (err) {
        console.error("Failed to fetch trainers:", err.response?.data?.message || err.message)
      }

      // Fetch etablissements
      try {
        const etablissementsResponse = await axios.get(`${apiUrl}/api/etablissements`, { headers })
        setEtablissements({
          data: Array.isArray(etablissementsResponse.data.data) ? etablissementsResponse.data.data : [],
        })
      } catch (err) {
        console.error("Failed to fetch etablissements:", err.response?.data?.message || err.message)
      }

      // Fetch filieres
      try {
        const filieresResponse = await axios.get(`${apiUrl}/api/filieres`, { headers })
        setFilieres(Array.isArray(filieresResponse.data.data) ? filieresResponse.data.data : [])
      } catch (err) {
        console.error("Failed to fetch filieres:", err.response?.data?.message || err.message)
      }

      // Fetch all drafts
      try {
        console.log("Fetching all drafts")
        const draftsResponse = await axios.get(`${apiUrl}/api/schedules/drafts`, { headers })
        setDrafts(
          Array.isArray(draftsResponse.data.data)
            ? draftsResponse.data.data
                .filter((entry) => isValidObjectId(entry.id))
                .map((entry) => ({
                  _id: entry.id,
                  dayId: dayMap[entry.jour] || 1,
                  slotId: entry.slot,
                  formateur: {
                    _id: isValidObjectId(entry.formateur?._id) ? entry.formateur._id : null,
                    name: entry.formateur?.name || "N/A",
                  },
                  salle: entry.salle || "N/A",
                  filiere: entry.filiere && isValidObjectId(entry.filiere._id)
                    ? { _id: entry.filiere._id, name: entry.filiere.name }
                    : null,
                  groupe: entry.groupe || "N/A",
                  module: entry.module ? { 
                    name: entry.module.name, 
                    formateur: isValidObjectId(entry.module.formateur?._id) 
                      ? { _id: entry.module.formateur._id, name: entry.module.formateur.name || "N/A" }
                      : null 
                  } : null,
                  isDraft: true,
                }))
            : []
        )
      } catch (err) {
        console.error("Failed to fetch drafts:", err.response?.data?.message || err.message)
        throw err
      }

      // Fetch all confirmed schedules
      try {
        console.log("Fetching all schedules")
        const schedulesResponse = await axios.get(`${apiUrl}/api/schedules`, { headers })
        setSchedules(
          Array.isArray(schedulesResponse.data.data)
            ? schedulesResponse.data.data
                .filter((entry) => isValidObjectId(entry.id))
                .map((entry) => ({
                  _id: entry.id,
                  dayId: dayMap[entry.jour] || 1,
                  slotId: entry.slot,
                  formateur: {
                    _id: isValidObjectId(entry.formateur?._id) ? entry.formateur._id : null,
                    name: entry.formateur?.name || "N/A",
                  },
                  salle: entry.salle || "N/A",
                  filiere: entry.filiere && isValidObjectId(entry.filiere._id)
                    ? { _id: entry.filiere._id, name: entry.filiere.name }
                    : null,
                  groupe: entry.groupe || "N/A",
                  module: entry.module ? { 
                    name: entry.module.name, 
                    formateur: isValidObjectId(entry.module.formateur?._id) 
                      ? { _id: entry.module.formateur._id, name: entry.module.formateur.name || "N/A" }
                      : null 
                  } : null,
                  isDraft: false,
                }))
            : []
        )
      } catch (err) {
        console.error("Failed to fetch schedules:", err.response?.data?.message || err.message)
      }
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

  const checkAvailability = (dayId, slotId, excludeId = null) => {
    if (!selectedTrainer) {
      if (selectedSalle) {
        const salleConflict = [...drafts, ...schedules]
          .filter((s) => s._id !== excludeId)
          .some((s) => s.dayId === dayId && s.slotId === slotId && s.salle === selectedSalle)
        if (salleConflict) return false
      }

      if (selectedGroup) {
        const groupConflict = [...drafts, ...schedules]
          .filter((s) => s._id !== excludeId)
          .some((s) => s.dayId === dayId && s.slotId === slotId && s.groupe === selectedGroup)
        if (groupConflict) return false
      }

      return true
    }

    const trainerConflict = [...drafts, ...schedules]
      .filter((s) => s._id !== excludeId)
      .some((s) => s.dayId === dayId && s.slotId === slotId && s.formateur._id === selectedTrainer._id)
    if (trainerConflict) return false

    if (selectedSalle) {
      const salleConflict = [...drafts, ...schedules]
        .filter((s) => s._id !== excludeId)
        .some((s) => s.dayId === dayId && s.slotId === slotId && s.salle === selectedSalle)
      if (salleConflict) return false
    }

    if (selectedGroup) {
      const groupConflict = [...drafts, ...schedules]
        .filter((s) => s._id !== excludeId)
        .some((s) => s.dayId === dayId && s.slotId === slotId && s.groupe === selectedGroup)
      if (groupConflict) return false
    }

    return true
  }

  const isSalleAvailable = (salle, dayId, slotId, useTrainer = false, excludeId = null) => {
    if (!dayId || !slotId) return true
    return ![...drafts, ...schedules]
      .filter((s) => s._id !== excludeId)
      .some((s) => s.dayId === dayId && s.slotId === slotId && s.salle === salle)
  }

  const isGroupeAvailable = (groupe, dayId, slotId, useTrainer = false, excludeId = null) => {
    if (!dayId || !slotId) return true
    return ![...drafts, ...schedules]
      .filter((s) => s._id !== excludeId)
      .some((s) => s.dayId === dayId && s.slotId === slotId && s.groupe === groupe)
  }

  const isModuleAvailable = (moduleName, dayId, slotId, useTrainer = false, excludeId = null) => {
    if (!dayId || !slotId) return true
    return ![...drafts, ...schedules]
      .filter((s) => s._id !== excludeId)
      .some((s) => s.dayId === dayId && s.slotId === slotId && s.module?.name === moduleName)
  }

  const isTrainerAvailable = (trainerId, dayId, slotId, excludeId = null) => {
    if (!dayId || !slotId) return true
    return ![...drafts, ...schedules]
      .filter((s) => s._id !== excludeId)
      .some((s) => s.dayId === dayId && s.slotId === slotId && s.formateur._id === trainerId)
  }

  const handleSlotClick = async (dayId, slotId) => {
    if (!selectedTrainer || !selectedSalle || !selectedFiliere || !selectedGroup || !selectedModule) {
      setError("Veuillez sélectionner un formateur, une salle, une filière, un groupe et un module avant d'assigner.")
      setTimeout(() => setError(""), 3000)
      return
    }

    if (![1, 2, 3, 4, 5, 6].includes(dayId)) {
      setError("Jour invalide.")
      setTimeout(() => setError(""), 3000)
      return
    }

    if (![1, 2, 3, 4].includes(slotId)) {
      setError("Créneau horaire invalide.")
      setTimeout(() => setError(""), 3000)
      return
    }

    if (!trainers.some((t) => t._id === selectedTrainer._id)) {
      setError("Formateur sélectionné non valide.")
      setTimeout(() => setError(""), 3000)
      return
    }

    if (!selectedEtablissement?.salles.includes(selectedSalle)) {
      setError("Salle sélectionnée non valide.")
      setTimeout(() => setError(""), 3000)
      return
    }

    const selectedFiliereData = filieres.find((f) => f._id === selectedFiliere)
    if (!selectedFiliereData) {
      setError("Filière sélectionnée non valide.")
      setTimeout(() => setError(""), 3000)
      return
    }

    if (!selectedFiliereData.groups.some((g) => g.name === selectedGroup)) {
      setError("Groupe sélectionné non valide pour cette filière.")
      setTimeout(() => setError(""), 3000)
      return
    }

    if (!selectedFiliereData.modules.some((m) => m.name === selectedModule)) {
      setError("Module sélectionné non valide pour cette filière.")
      setTimeout(() => setError(""), 3000)
      return
    }

    if (!checkAvailability(dayId, slotId)) {
      setError("Conflit détecté : formateur, salle ou groupe déjà assigné à ce créneau.")
      setTimeout(() => setError(""), 3000)
      return
    }

    const token = localStorage.getItem("token")
    const apiUrl = process.env.REACT_APP_API_URL
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }

    try {
      await axios.post(
        `${apiUrl}/api/schedules/drafts`,
        {
          dayId,
          slotId,
          trainerName: selectedTrainer.name,
          trainerId: selectedTrainer._id,
          salleName: selectedSalle,
          filiereId: selectedFiliere,
          groupName: selectedGroup,
          moduleName: selectedModule,
        },
        { headers },
      )
      await fetchData()
      setSelectedTrainer(null)
      setSelectedEtablissement(null)
      setSelectedSalle(null)
      setSelectedFiliere(null)
      setSelectedGroup(null)
      setSelectedModule(null)
      setSelectedSlot(null)
      setError("")
      setWarning("")
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message
      setError(`Échec de l'enregistrement : ${errorMessage}`)
      setTimeout(() => setError(""), 5000)
    }
  }

  const handleConfirmAllDrafts = async () => {
    if (drafts.length === 0) {
      setWarning("Aucun brouillon à confirmer.")
      setTimeout(() => setWarning(""), 3000)
      return
    }

    const confirmed = window.confirm(
      "Voulez-vous confirmer tous les brouillons ? Cette action transférera les brouillons vers les emplois du temps et les supprimera des brouillons. Cette action est irréversible."
    )
    if (!confirmed) return

    const token = localStorage.getItem("token")
    const apiUrl = process.env.REACT_APP_API_URL
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }

    try {
      setIsConfirming(true)
      const response = await axios.post(`${apiUrl}/api/schedules/drafts/confirm-all`, {}, { headers })
      console.log("Confirm all response:", response.data)
      await fetchData()

      if (response.status === 207) {
        const errorMessages = response.data.errors?.length
          ? response.data.errors.map((err) => `Brouillon ${err.draftId}: ${err.message}`).join("; ")
          : "Certains brouillons ont échoué sans détails spécifiques."
        setWarning(`Confirmation partielle : ${errorMessages}`)
        setTimeout(() => setWarning(""), 12000)
      } else {
        setWarning("Tous les brouillons ont été confirmés et transférés vers les emplois du temps avec succès.")
        setTimeout(() => setWarning(""), 5000)
      }

      setError("")
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message
      setError(`Échec de la confirmation : ${errorMessage}`)
      setTimeout(() => setError(""), 7000)
    } finally {
      setIsConfirming(false)
    }
  }

  const handleEditAssignment = (assignment) => {
    if (!assignment || !isValidObjectId(assignment._id)) {
      setError("Identifiant invalide.")
      setTimeout(() => setError(""), 3000)
      return
    }
    setViewingAssignment(assignment)
    setViewModalOpen(true)
  }

  const handleDeleteAssignment = async (assignment) => {
    if (!assignment || !isValidObjectId(assignment._id)) {
      setError("Identifiant invalide.")
      setTimeout(() => setError(""), 3000)
      return
    }

    const token = localStorage.getItem("token")
    const apiUrl = process.env.REACT_APP_API_URL
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }

    try {
      const endpoint = assignment.isDraft
        ? `${apiUrl}/api/schedules/drafts/${assignment._id}`
        : `${apiUrl}/api/schedules/${assignment._id}`
      await axios.delete(endpoint, { headers })
      await fetchData()
      setViewModalOpen(false)
      setViewingAssignment(null)
      setError("")
      setWarning(assignment.isDraft ? "Brouillon supprimé avec succès." : "Emploi du temps supprimé avec succès.")
      setTimeout(() => setWarning(""), 3000)
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message
      setError(`Échec de la suppression : ${errorMessage}`)
      setTimeout(() => setError(""), 5000)
    }
  }

  const filteredTrainers = trainers.filter((trainer) =>
    trainer.name.toLowerCase().includes(trainerSearch.toLowerCase()),
  )

  const filteredAssignments = [...drafts, ...schedules].filter((entry) => {
    const matchesTrainer = selectedTrainer ? entry.formateur._id === selectedTrainer._id : true
    const matchesGroup = selectedGroup ? entry.groupe === selectedGroup : true
    const matchesSalle = selectedSalle ? entry.salle === selectedSalle : true
    const matchesFiliere = selectedFiliere ? entry.filiere?._id === selectedFiliere : true
    const matchesModule = selectedModule ? entry.module?.name === selectedModule : true
    return matchesTrainer && matchesGroup && matchesSalle && matchesFiliere && matchesModule
  })

  const canClick = !!selectedTrainer && !!selectedSalle && !!selectedGroup && !!selectedFiliere && !!selectedModule

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

        {viewModalOpen && viewingAssignment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Détails de l'emploi du temps</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Formateur</label>
                <p className="text-sm text-gray-900">{viewingAssignment.formateur.name}</p>
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
                <p className="text-sm text-gray-900">{daysOfWeek.find((day) => day.id === viewingAssignment.dayId)?.name}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Créneau</label>
                <p className="text-sm text-gray-900">
                  {timeSlots.find((slot) => slot.id === viewingAssignment.slotId)?.start} -{" "}
                  {timeSlots.find((slot) => slot.id === viewingAssignment.slotId)?.end}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Statut</label>
                <p className="text-sm text-gray-900">{viewingAssignment.isDraft ? "Brouillon" : "Confirmé"}</p>
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setViewModalOpen(false)}>
                  Fermer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDeleteAssignment(viewingAssignment)}
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
                        className={`p-3 border rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer ${
                          selectedSalle === salle ? "border-[#ff0033] border-2" : "border-gray-200"
                        } ${isSalleAvailable(salle, selectedSlot?.dayId, selectedSlot?.slotId) ? "bg-white" : "bg-red-50"}`}
                      >
                        <p className="font-medium text-gray-700">{salle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-semibold text-gray-800">Planifications</h2>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleConfirmAllDrafts}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={drafts.length === 0 || isConfirming}
                >
                  {isConfirming ? "Confirmation..." : "Confirmer tous les brouillons"}
                </Button>
              </div>
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
                          className={`p-2 border rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer ${
                            selectedGroup === group.value ? "border-[#ff0033] border-2" : "border-gray-200"
                          } ${isGroupeAvailable(group.value, selectedSlot?.dayId, selectedSlot?.slotId) ? "bg-white" : "bg-red-50"}`}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Module *</label>
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
                        backgroundColor: state.isSelected
                          ? "#ff0033"
                          : state.isFocused
                          ? "#f9fafb"
                          : isModuleAvailable(state.data.value, selectedSlot?.dayId, selectedSlot?.slotId)
                          ? "white"
                          : "rgba(254, 242, 242, 1)",
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
                          const availability = checkAvailability(day.id, slot.id)

                          const bgColor = availability ? "bg-green-50" : "bg-red-50"
                          const borderStyle = availability ? "border-green-500 border-2" : "border-red-500 border-2"

                          return (
                            <div
                              key={slot.id}
                              onClick={() => {
                                if (canClick && availability) {
                                  setSelectedSlot({ dayId: day.id, slotId: slot.id })
                                  handleSlotClick(day.id, slot.id)
                                }
                              }}
                              className={`border p-3 h-36 ${bgColor} rounded-xl ${
                                canClick && availability
                                  ? "hover:bg-green-100 transition-colors cursor-pointer"
                                  : "cursor-default"
                              } ${assignments.length > 0 ? "bg-opacity-60" : ""} ${borderStyle}`}
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
                                        {assignment.isDraft && (
                                          <span className="ml-1 text-[10px] text-gray-800">(Brouillon)</span>
                                        )}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleEditAssignment(assignment)
                                          }}
                                          className="ml-2 text-gray-600 hover:text-gray-800"
                                        >
                                          ℹ️
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
                                        <div className="font-medium mt-1">
                                          Statut: {assignment.isDraft ? "Brouillon" : "Confirmé"}
                                        </div>
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
                isTrainerAvailable={(trainerId) => isTrainerAvailable(trainerId, selectedSlot?.dayId, selectedSlot?.slotId)}
              />
            </div>
          </div>
        )}
      </main>
    </Layout>
  )
}