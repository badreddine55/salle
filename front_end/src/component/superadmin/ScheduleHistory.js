"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import Layout from "./Layout"

export default function ScheduleHistory() {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const fetchHistory = async () => {
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
        const response = await axios.get(`${apiUrl}/api/schedule/history`, { headers })
        setHistory(response.data.data)
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message
        setError(`Échec du chargement de l'historique : ${errorMessage}`)
        console.error("Error fetching history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [navigate])

  // Format date for display
  const formatDate = (isoDate) => {
    return new Date(isoDate).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  // Filter history by date
  const filteredHistory = dateFilter
    ? history.filter((entry) =>
        new Date(entry.changeDate).toLocaleDateString("fr-FR").includes(dateFilter)
      )
    : history

  return (
    <Layout>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-[calc(100vh-64px)]">
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

        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Historique des modifications</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrer par date (JJ/MM/AAAA)
          </label>
          <input
            type="text"
            placeholder="Ex: 15/05/2025"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full max-w-xs p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0033]"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center flex-grow">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff0033]"></div>
            <span className="ml-3 text-gray-700 text-lg">Chargement...</span>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            {filteredHistory.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun historique trouvé pour cette date.</p>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((entry) => (
                  <div
                    key={entry._id}
                    onClick={() =>
                      navigate(`/schedule/view/${entry._id}`, {
                        state: { schedules: entry.schedules },
                      })
                    }
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <p className="text-sm font-medium text-gray-700">
                      Modifié le {formatDate(entry.changeDate)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.schedules.length} affectation(s)
                    </p>
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