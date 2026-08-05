export default function AdminAppointmentsPage() {
  const appointments = [
    {
      id: "APT-1001",
      patient: "John Doe",
      doctor: "Dr. Sarah",
      department: "Cardiology",
      date: "05 Aug 2026",
      time: "10:30 AM",
      status: "Scheduled",
    },
    {
      id: "APT-1002",
      patient: "Emily Watson",
      doctor: "Dr. James",
      department: "Neurology",
      date: "05 Aug 2026",
      time: "12:00 PM",
      status: "Completed",
    },
    {
      id: "APT-1003",
      patient: "Michael Brown",
      doctor: "Dr. Sarah",
      department: "Orthopedics",
      date: "06 Aug 2026",
      time: "09:00 AM",
      status: "Cancelled",
    },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Appointment Management
          </h1>

          <p className="text-slate-600 mt-2">
            Manage appointments across the hospital.
          </p>
        </div>

        <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-3 rounded-lg">
          + New Appointment
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow border p-6">
          <p className="text-slate-500">Total</p>
          <h2 className="text-3xl font-bold mt-2">324</h2>
        </div>

        <div className="bg-white rounded-xl shadow border p-6">
          <p className="text-slate-500">Today's</p>
          <h2 className="text-3xl font-bold text-blue-700 mt-2">28</h2>
        </div>

        <div className="bg-white rounded-xl shadow border p-6">
          <p className="text-slate-500">Completed</p>
          <h2 className="text-3xl font-bold text-green-700 mt-2">241</h2>
        </div>

        <div className="bg-white rounded-xl shadow border p-6">
          <p className="text-slate-500">Cancelled</p>
          <h2 className="text-3xl font-bold text-red-600 mt-2">19</h2>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Patient</th>
              <th className="p-4 text-left">Doctor</th>
              <th className="p-4 text-left">Department</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Time</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {appointments.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-4">{a.id}</td>
                <td className="p-4">{a.patient}</td>
                <td className="p-4">{a.doctor}</td>
                <td className="p-4">{a.department}</td>
                <td className="p-4">{a.date}</td>
                <td className="p-4">{a.time}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-white text-sm ${
                      a.status === "Scheduled"
                        ? "bg-blue-600"
                        : a.status === "Completed"
                        ? "bg-green-600"
                        : "bg-red-600"
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}