export default function CorrectionsPage() {
  const corrections = [
    {
      id: "#C-042",
      patient: "Elena Vasquez",
      request: "Update allergy record",
      description:
        "Patient reports new penicillin allergy discovered during recent consultation.",
      status: "Pending",
      submitted: "2026-08-03",
      priority: "High",
    },
    {
      id: "#C-039",
      patient: "James Carter",
      request: "Correct lab result",
      description:
        "Lab results for lipid panel show incorrect values due to sample mix-up.",
      status: "Review",
      submitted: "2026-08-02",
      priority: "Medium",
    },
    {
      id: "#C-035",
      patient: "Maya Iyer",
      request: "Voice consult pinning",
      description:
        "Request to pin voice consultation recording for specialist review.",
      status: "Pending",
      submitted: "2026-08-01",
      priority: "Low",
    },
    {
      id: "#C-031",
      patient: "Thomas Wright",
      request: "Update contact information",
      description: "Patient's phone number and address have changed.",
      status: "Approved",
      submitted: "2026-07-30",
      priority: "Low",
    },
  ];

  const pending = corrections.filter(
    (c) => c.status === "Pending" || c.status === "Review"
  ).length;

  const approved = corrections.filter(
    (c) => c.status === "Approved"
  ).length;

  const rejected = corrections.filter(
    (c) => c.status === "Rejected"
  ).length;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-800">
        Correction Requests
      </h1>

      <p className="mt-2 text-gray-600">
        Review and manage requested changes to patient medical records.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-gray-500">Pending</h2>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {pending}
          </p>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-gray-500">Approved</h2>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {approved}
          </p>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-gray-500">Rejected</h2>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {rejected}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        {corrections.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border p-6 shadow-sm"
          >
            <div className="flex justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {item.id}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {item.patient}
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-slate-100 text-sm">
                {item.status}
              </span>
            </div>

            <div className="mt-4">
              <p className="font-medium">{item.request}</p>

              <p className="text-gray-600 text-sm mt-2">
                {item.description}
              </p>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              Submitted: {item.submitted}
            </div>

            <div className="mt-2 text-sm">
              Priority:
              <span className="font-semibold ml-2">
                {item.priority}
              </span>
            </div>

            {(item.status === "Pending" ||
              item.status === "Review") && (
              <div className="flex gap-3 mt-6">
                <button className="flex-1 rounded-lg bg-green-600 py-2 text-white">
                  Approve
                </button>

                <button className="flex-1 rounded-lg bg-red-600 py-2 text-white">
                  Reject
                </button>
              </div>
            )}

            {item.status === "Approved" && (
              <div className="mt-6 rounded-lg bg-green-100 p-3 text-green-700">
                Request Approved
              </div>
            )}

            {item.status === "Rejected" && (
              <div className="mt-6 rounded-lg bg-red-100 p-3 text-red-700">
                Request Rejected
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}