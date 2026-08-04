export default function AdminCorrectionsPage() {
  const requests = [
    {
      id: 1,
      patient: "John Doe",
      field: "Blood Group",
      requested: "A+",
      current: "B+",
      status: "Pending",
    },
    {
      id: 2,
      patient: "Emma Wilson",
      field: "Phone Number",
      requested: "9876543210",
      current: "9123456780",
      status: "Pending",
    },
  ];

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Correction Requests</h1>

      <p className="text-slate-600 mt-3">
        Review and approve requested medical record corrections.
      </p>

      <div className="mt-8 space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="rounded-xl border p-5 shadow-sm"
          >
            <h2 className="font-semibold text-lg">{request.patient}</h2>

            <p className="mt-2">
              <strong>Field:</strong> {request.field}
            </p>

            <p>
              <strong>Current:</strong> {request.current}
            </p>

            <p>
              <strong>Requested:</strong> {request.requested}
            </p>

            <div className="mt-4 flex gap-3">
              <button className="rounded bg-green-600 px-4 py-2 text-white">
                Approve
              </button>

              <button className="rounded bg-red-600 px-4 py-2 text-white">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}