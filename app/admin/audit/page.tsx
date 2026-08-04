export default function AdminAuditPage() {
  const logs = [
    {
      id: 1,
      action: "Doctor Updated Patient Record",
      user: "Dr. Sarah",
      time: "Today • 10:32 AM",
      status: "Success",
    },
    {
      id: 2,
      action: "Staff Approved Appointment",
      user: "Reception",
      time: "Today • 09:41 AM",
      status: "Success",
    },
    {
      id: 3,
      action: "Unauthorized Login Attempt",
      user: "Unknown",
      time: "Yesterday • 11:17 PM",
      status: "Blocked",
    },
  ];

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Audit Logs</h1>

      <p className="text-slate-600 mt-3">
        Review every important activity performed within VoiceVault.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4 text-left">Action</th>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Time</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="p-4">{log.action}</td>
                <td className="p-4">{log.user}</td>
                <td className="p-4">{log.time}</td>
                <td className="p-4">
                  <span className="rounded bg-slate-200 px-2 py-1 text-sm">
                    {log.status}
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