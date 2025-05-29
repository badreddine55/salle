import { useState } from "react"

export default function Calendar({ schedule, onSlotClick, onEditAssignment, canClick, useNewTooltipStyle = false }) {
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

  // Function to assign a consistent color to each Formateur
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

  return (
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
                    onClick={canClick ? () => onSlotClick(day.id, slot.id) : undefined}
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

                            </div>
  <div className="absolute z-10 hidden group-hover:block bg-white text-gray-800 text-sm rounded-lg p-3 mt-1 -top-20 left-0 shadow-lg border border-gray-200 w-48">
    {/* Arrow/triangle at top */}
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
  )
}