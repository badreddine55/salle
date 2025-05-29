import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "./Layout";

// Main FilterPage Component
export default function FilterPage() {
  const [trainers, setTrainers] = useState([]);
  const [rooms, setRooms] = useState({ data: [] });
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomSearch, setRoomSearch] = useState("");
  const [trainerSearch, setTrainerSearch] = useState("");
  const [activeTab, setActiveTab] = useState("trainers");

  // Calendar-specific state and logic
  const [currentWeek] = useState(getWeekDates());

  const timeSlots = [
    { id: 1, start: "8:30", end: "11:00" },
    { id: 2, start: "11:00", end: "13:30" },
    { id: 3, start: "13:30", end: "16:00" },
    { id: 4, start: "16:00", end: "18:30" },
  ];

  const daysOfWeek = [
    { id: 1, name: "Lundi" },
    { id: 2, name: "Mardi" },
    { id: 3, name: "Mercredi" },
    { id: 4, name: "Jeudi" },
    { id: 5, name: "Vendredi" },
    { id: 6, name: "Samedi" },
  ];

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
  ];

  function getFormateurColor(formateurName) {
    const hash = Array.from(formateurName).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  function getWeekDates(date = new Date()) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));

    const weekDates = [];
    for (let i = 0; i < 6; i++) {
      const currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + i);
      weekDates.push(currentDate);
    }

    return weekDates;
  }

  function formatDate(date) {
    return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
  }

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentification requise. Veuillez vous connecter.");
      setIsLoading(false);
      return;
    }

    // Use REACT_APP_API_URL for React environment variables
    const apiUrl = process.env.REACT_APP_API_URL ;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      setIsLoading(true);
      // Fetch trainers
      const trainersResponse = await axios.get(`${apiUrl}/api/formateurs`, { headers });
      setTrainers(trainersResponse.data.filter((trainer) => trainer.role === "Formateur"));

      // Fetch rooms
      const roomsResponse = await axios.get(`${apiUrl}/api/salles`, { headers });
      setRooms(roomsResponse.data);

      // Fetch schedule
      const scheduleResponse = await axios.get(`${apiUrl}/api/schedule`, { headers });
      setSchedule(
        scheduleResponse.data.data.map((entry) => ({
          _id: entry._id,
          dayId: entry.dayId,
          slotId: entry.slotId,
          trainer: entry.formateur,
          room: entry.salle,
        })),
      );
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(`Échec du chargement des données : ${errorMessage}`);
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRooms = {
    data: rooms.data.filter((room) => room.name.toLowerCase().includes(roomSearch.toLowerCase())),
  };

  const filteredTrainers = trainers.filter((trainer) =>
    trainer.name.toLowerCase().includes(trainerSearch.toLowerCase()),
  );

  // Filter schedule based on selected trainer or room
  const filteredSchedule = schedule.filter((s) => {
    if (activeTab === "trainers" && selectedTrainer) {
      return s.trainer === selectedTrainer;
    } else if (activeTab === "rooms" && selectedRoom) {
      return s.room === selectedRoom;
    }
    return false;
  });

  // Check if a slot is occupied by the selected trainer or room
  const isSlotOccupied = (dayId, slotId) => {
    if (activeTab === "trainers" && selectedTrainer) {
      return filteredSchedule.some((s) => s.dayId === dayId && s.slotId === slotId && s.trainer === selectedTrainer);
    } else if (activeTab === "rooms" && selectedRoom) {
      return filteredSchedule.some((s) => s.dayId === dayId && s.slotId === slotId && s.room === selectedRoom);
    }
    return false;
  };

  // Get assignment details for a specific slot
  const getSlotAssignment = (dayId, slotId) => {
    return filteredSchedule.find((s) => s.dayId === dayId && s.slotId === slotId);
  };

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
          <button onClick={() => setError("")} className="ml-auto text-red-800">
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
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 flex-grow">
          <div>
            {/* Custom Tabs Component */}
            <div className="w-full">
              <div className="grid w-full grid-cols-2 mb-4 rounded-lg overflow-hidden">
                <button
                  onClick={() => setActiveTab("trainers")}
                  className={`py-2 px-4 text-center font-medium transition-colors ${
                    activeTab === "trainers" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Formateurs
                </button>
                <button
                  onClick={() => setActiveTab("rooms")}
                  className={`py-2 px-4 text-center font-medium transition-colors ${
                    activeTab === "rooms" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Salles
                </button>
              </div>

              {/* Trainers Tab Content */}
              {activeTab === "trainers" && (
                <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Formateurs</h2>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Rechercher un formateur..."
                      value={trainerSearch}
                      onChange={(e) => setTrainerSearch(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0033]"
                    />
                  </div>
                  <div className="space-y-3">
                    {filteredTrainers.length === 0 ? (
                      <p className="text-sm text-gray-500">Aucun formateur disponible</p>
                    ) : (
                      filteredTrainers.map((trainer) => (
                        <div
                          key={trainer.id}
                          onClick={() => {
                            setSelectedTrainer(trainer.name);
                            setSelectedRoom(null); // Reset room selection
                          }}
                          className={`p-3 border rounded-lg hover:bg-gray-50 transition-colors bg-white shadow-sm cursor-pointer flex items-center ${
                            selectedTrainer === trainer.name ? "border-[#ff0033] border-2" : "border-gray-200"
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full mr-2 ${getFormateurColor(trainer.name)}`}></div>
                          <p className="font-medium text-gray-700">{trainer.name}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Rooms Tab Content */}
              {activeTab === "rooms" && (
                <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Salles</h2>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Rechercher une salle..."
                      value={roomSearch}
                      onChange={(e) => setRoomSearch(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0033]"
                    />
                  </div>
                  <div className="space-y-3">
                    {filteredRooms.data.length === 0 ? (
                      <p className="text-sm text-gray-500">Aucune salle disponible</p>
                    ) : (
                      filteredRooms.data.map((room) => (
                        <div
                          key={room._id}
                          onClick={() => {
                            setSelectedRoom(room.name);
                            setSelectedTrainer(null); // Reset trainer selection
                          }}
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
                </div>
              )}
            </div>

            {/* Selection Info Card */}
            {(selectedTrainer || selectedRoom) && (
              <div className="bg-white rounded-lg shadow-md p-4 mt-4 border border-gray-200">
                <h3 className="font-medium text-gray-800 mb-2">
                  {activeTab === "trainers" && selectedTrainer ? (
                    <>
                      Horaire du formateur: <span className="text-[#ff0033]">{selectedTrainer}</span>
                    </>
                  ) : (
                    <>
                      Horaire de la salle: <span className="text-[#ff0033]">{selectedRoom}</span>
                    </>
                  )}
                </h3>
                <button
                  onClick={() => {
                    if (activeTab === "trainers") {
                      setSelectedTrainer(null);
                    } else {
                      setSelectedRoom(null);
                    }
                  }}
                  className="mt-2 inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 h-10 py-2 px-4 border border-gray-200 bg-transparent hover:bg-gray-100"
                >
                  Réinitialiser la sélection
                </button>
              </div>
            )}
          </div>

          {/* Calendar Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
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
                    <div key={day.id} className="bg-gray-100 p-3 text-center font-semibold text-gray-800 rounded-t-xl">
                      <div>{day.name}</div>
                      <div className="text-xs text-gray-500">{formatDate(currentWeek[index])}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-6 gap-0.5">
                  {daysOfWeek.map((day) => (
                    <div key={day.id} className="grid grid-rows-4 gap-0.5">
                      {timeSlots.map((slot) => {
                        const isOccupied = isSlotOccupied(day.id, slot.id);
                        const assignment = getSlotAssignment(day.id, slot.id);

                        // If no selection is made, show empty slots
                        if (!selectedTrainer && !selectedRoom) {
                          return (
                            <div key={slot.id} className="border p-3 h-36 bg-white rounded-xl border-gray-200">
                              <div className="text-xs text-gray-600">
                                {slot.start} - {slot.end}
                              </div>
                            </div>
                          );
                        }

                        // If filtering by trainer or room, show only relevant slots
                        return (
                          <div
                            key={slot.id}
                            className={`border p-3 h-36 rounded-xl ${
                              isOccupied
                                ? "bg-red-50 border-red-200"
                                : activeTab === "rooms"
                                ? "bg-green-50 border-green-200" // Free slot for room view
                                : "bg-white border-gray-200 opacity-40" // Hide non-occupied slots for trainer view
                            }`}
                          >
                            <div className="text-xs text-gray-600">
                              {slot.start} - {slot.end}
                              {isOccupied && assignment && (
                                <div className="mt-2">
                                  {activeTab === "trainers" ? (
                                    <div className="text-sm font-medium text-gray-800">Salle: {assignment.room}</div>
                                  ) : (
                                    <div className="text-sm font-medium text-gray-800">
                                      Formateur: {assignment.trainer}
                                    </div>
                                  )}
                                  <div className="mt-1 flex items-center">
                                    <div
                                      className={`px-2 py-1 text-xs font-medium text-gray-800 rounded-xl ${
                                        activeTab === "trainers" ? getFormateurColor(assignment.trainer) : "bg-gray-200"
                                      }`}
                                    >
                                      {activeTab === "trainers" ? assignment.trainer.charAt(0).toUpperCase() : "Occupé"}
                                    </div>
                                  </div>
                                </div>
                              )}
                              {!isOccupied && activeTab === "rooms" && (
                                <div className="mt-2">
                                  <div className="text-sm font-medium text-green-800">Disponible</div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
    </Layout>
  );
}