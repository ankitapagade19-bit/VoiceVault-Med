export default function PatientAppointmentsPage() {
  const appointments = [
    {
      doctor: "Dr. Sarah",
      department: "Cardiology",
      date: "05 Aug 2026",
      time: "09:30 AM",
      status: "Upcoming",
    },
    {
      doctor: "Dr. James",
      department: "Neurology",
      date: "27 Jul 2026",
      time: "11:00 AM",
      status: "Completed",
    },
    {
      doctor: "Dr. Emily",
      department: "Orthopedics",
      date: "18 Jul 2026",
      time: "02:30 PM",
      status: "Cancelled",
    },
  ];

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Appointments</h1>
          <p className="text-slate-600 mt-2">
            Track your upcoming and previous appointments.
          </p>
        </div>

        <button className="bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800">
          Book Appointment
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-xl border p-6">
          <p className="text-slate-500">Upcoming</p>
          <h2 className="text-3xl font-bold text-blue-700 mt-2">2</h2>
        </div>

        <div className="bg-white shadow rounded-xl border p-6">
          <p className="text-slate-500">Completed</p>
          <h2 className="text-3xl font-bold text-green-600 mt-2">15</h2>
        </div>

        <div className="bg-white shadow rounded-xl border p-6">
          <p className="text-slate-500">Cancelled</p>
          <h2 className="text-3xl font-bold text-red-600 mt-2">1</h2>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4 text-left">Doctor</th>
              <th className="p-4 text-left">Department</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Time</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {appointments.map((a, i) => (
              <tr key={i} className="border-t">
                <td className="p-4">{a.doctor}</td>
                <td className="p-4">{a.department}</td>
                <td className="p-4">{a.date}</td>
                <td className="p-4">{a.time}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-white text-sm ${
                      a.status === "Upcoming"
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
    </main>
  );
}