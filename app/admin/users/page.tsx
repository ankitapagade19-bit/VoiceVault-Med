export default function AdminUsersPage() {
  const users = [
    {
      id: 1,
      name: "Dr. Sarah",
      role: "Doctor",
      status: "Active",
    },
    {
      id: 2,
      name: "John Doe",
      role: "Patient",
      status: "Active",
    },
    {
      id: 3,
      name: "Reception Staff",
      role: "Staff",
      status: "Offline",
    },
  ];

  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Users Management</h1>

        <button className="rounded bg-blue-600 px-4 py-2 text-white">
          + Add User
        </button>
      </div>

      <p className="text-slate-600 mt-3">
        Manage all doctors, staff, patients and administrators.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-4">{user.name}</td>
                <td className="p-4">{user.role}</td>
                <td className="p-4">{user.status}</td>

                <td className="p-4 space-x-2">
                  <button className="rounded bg-slate-800 px-3 py-1 text-white">
                    View
                  </button>

                  <button className="rounded bg-blue-600 px-3 py-1 text-white">
                    Edit
                  </button>

                  <button className="rounded bg-red-600 px-3 py-1 text-white">
                    Delete
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