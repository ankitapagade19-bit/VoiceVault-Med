export default function UsersPage() {
  const users = [
    {
      id: 1,
      name: "Dr. Sarah Lin",
      email: "sarah.lin@voicevault.com",
      role: "Doctor",
      department: "Cardiology",
      status: "Active",
      lastActive: "2026-08-04",
      patients: 24,
    },
    {
      id: 2,
      name: "Michael Torres",
      email: "michael.torres@voicevault.com",
      role: "Staff",
      department: "Administration",
      status: "Active",
      lastActive: "2026-08-03",
      patients: 0,
    },
    {
      id: 3,
      name: "Priya Sharma",
      email: "priya.sharma@voicevault.com",
      role: "Patient",
      department: "-",
      status: "Inactive",
      lastActive: "2026-07-28",
      patients: 0,
    },
    {
      id: 4,
      name: "Dr. Omar Hassan",
      email: "omar.hassan@voicevault.com",
      role: "Doctor",
      department: "Neurology",
      status: "Active",
      lastActive: "2026-08-04",
      patients: 18,
    },
    {
      id: 5,
      name: "Emily Chen",
      email: "emily.chen@voicevault.com",
      role: "Staff",
      department: "Emergency",
      status: "Active",
      lastActive: "2026-08-02",
      patients: 0,
    },
    {
      id: 6,
      name: "Robert Johnson",
      email: "robert.johnson@voicevault.com",
      role: "Patient",
      department: "-",
      status: "Active",
      lastActive: "2026-08-01",
      patients: 0,
    },
  ];

  const total = users.length;
  const active = users.filter((u) => u.status === "Active").length;
  const doctors = users.filter((u) => u.role === "Doctor").length;
  const staff = users.filter((u) => u.role === "Staff").length;
  const patients = users.filter((u) => u.role === "Patient").length;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            User Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage doctors, staff, patients and administrators.
          </p>
        </div>

        <button className="bg-blue-600 text-white px-5 py-2 rounded-lg">
          + Add User
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-8">
        <div className="bg-white border rounded-xl p-5 text-center">
          <p className="text-gray-500">Total</p>
          <h2 className="text-3xl font-bold">{total}</h2>
        </div>

        <div className="bg-white border rounded-xl p-5 text-center">
          <p className="text-gray-500">Active</p>
          <h2 className="text-3xl font-bold text-green-600">
            {active}
          </h2>
        </div>

        <div className="bg-white border rounded-xl p-5 text-center">
          <p className="text-gray-500">Doctors</p>
          <h2 className="text-3xl font-bold">{doctors}</h2>
        </div>

        <div className="bg-white border rounded-xl p-5 text-center">
          <p className="text-gray-500">Staff</p>
          <h2 className="text-3xl font-bold">{staff}</h2>
        </div>

        <div className="bg-white border rounded-xl p-5 text-center">
          <p className="text-gray-500">Patients</p>
          <h2 className="text-3xl font-bold">{patients}</h2>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Role</th>
              <th className="text-left p-4">Department</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Last Active</th>
              <th className="text-left p-4">Patients</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-4">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">
                    {user.email}
                  </div>
                </td>

                <td className="p-4">{user.role}</td>

                <td className="p-4">{user.department}</td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      user.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>

                <td className="p-4">{user.lastActive}</td>

                <td className="p-4">{user.patients}</td>

                <td className="p-4 space-x-2">
                  <button className="bg-blue-600 text-white px-3 py-1 rounded">
                    Edit
                  </button>

                  <button className="bg-red-600 text-white px-3 py-1 rounded">
                    Disable
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