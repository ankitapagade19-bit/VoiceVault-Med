export default function DoctorAppointmentsPage() {
  const appointments = [
    {
      patient: "John Doe",
      age: 34,
      time: "09:30 AM",
      reason: "Diabetes Follow-up",
      status: "Upcoming",
    },
    {
      patient: "Emma Watson",
      age: 28,
      time: "11:00 AM",
      reason: "Heart Checkup",
      status: "Completed",
    },
    {
      patient: "Michael Brown",
      age: 42,
      time: "02:15 PM",
      reason: "Blood Pressure",
      status: "Cancelled",
    },
  ];

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Appointments</h1>
          <p className="text-slate-600 mt-2">
            View and manage today's patient appointments.
          </p>
        </div>

        <button className="bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800">
          Refresh
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-xl p-6 border">
          <p className="text-slate-500">Today's Patients</p>
          <h2 className="text-3xl font-bold mt-2">18</h2>
        </div>

        <div className="bg-white shadow rounded-xl p-6 border">
          <p className="text-slate-500">Completed</p>
          <h2 className="text-3xl font-bold text-green-600 mt-2">12</h2>
        </div>

        <div className="bg-white shadow rounded-xl p-6 border">
          <p className="text-slate-500">Pending</p>
          <h2 className="text-3xl font-bold text-orange-600 mt-2">6</h2>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4 text-left">Patient</th>
              <th className="p-4 text-left">Age</th>
              <th className="p-4 text-left">Time</th>
              <th className="p-4 text-left">Reason</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {appointments.map((a, i) => (
              <tr key={i} className="border-t">
                <td className="p-4">{a.patient}</td>
                <td className="p-4">{a.age}</td>
                <td className="p-4">{a.time}</td>
                <td className="p-4">{a.reason}</td>
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

                <td className="p-4">
                  <button className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700">
                    Open Record
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}