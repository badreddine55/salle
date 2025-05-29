"use client"

import { useLocation, useNavigate } from "react-router-dom"
import Layout from "./Layout"
import Calendar from "./Calendar"

export default function ScheduleView() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const schedules = state?.schedules || []

  // Transform schedules to match Calendar component's expected format
  const formattedSchedules = schedules.map((s) => ({
    dayId: s.dayId,
    slotId: s.slotId,
    trainer: s.formateur,
    room: s.salle,
  }))

  return (
    <Layout>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-[calc(100vh-64px)]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Planification hebdomadaire</h1>
          <button
            onClick={() => navigate("/schedule/history")}
            className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-gray-200 bg-transparent hover:bg-gray-100 h-10 py-2 px-4"
          >
            Retour
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <Calendar schedule={formattedSchedules} canClick={false} />
        </div>
      </main>
    </Layout>
  )
}