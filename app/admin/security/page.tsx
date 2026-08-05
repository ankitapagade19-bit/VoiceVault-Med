export default function SecurityPage() {
  const securityFeatures = [
    {
      title: "SHA-256 Hash Chain",
      description:
        "All record versions are linked using deterministic SHA-256 hashes.",
      status: "Active",
    },
    {
      title: "IPFS Voice Pinning",
      description:
        "Voice consultations are pinned on IPFS using immutable content IDs.",
      status: "Active",
    },
    {
      title: "Zero Trust RBAC",
      description:
        "Every request is validated using role-based access control.",
      status: "Active",
    },
    {
      title: "Decentralized Storage",
      description:
        "Medical records are securely stored with redundant architecture.",
      status: "Active",
    },
    {
      title: "Cryptographic Keys",
      description:
        "Every update is cryptographically verified before being stored.",
      status: "Active",
    },
    {
      title: "Immutable Versioning",
      description:
        "Records are never overwritten. Every update creates a new version.",
      status: "Active",
    },
  ];

  const logs = [
    {
      event: "User Login",
      user: "Dr. Sarah Lin",
      time: "2026-08-04 10:23",
      status: "Success",
    },
    {
      event: "Patient Record Access",
      user: "Michael Torres",
      time: "2026-08-04 09:45",
      status: "Success",
    },
    {
      event: "Failed Login Attempt",
      user: "Unknown",
      time: "2026-08-04 08:12",
      status: "Failed",
    },
    {
      event: "Correction Approved",
      user: "System Admin",
      time: "2026-08-03 16:20",
      status: "Success",
    },
  ];

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-800">
        Security Center
      </h1>

      <p className="mt-2 text-gray-600">
        Monitor security, integrity and Zero Trust protection across VoiceVault.
      </p>

      <div className="grid md:grid-cols-4 gap-6 mt-8">
        <div className="bg-white rounded-xl border p-6">
          <p className="text-gray-500">Chain Integrity</p>
          <h2 className="text-3xl font-bold text-green-600 mt-2">
            100%
          </h2>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <p className="text-gray-500">Hashed Records</p>
          <h2 className="text-3xl font-bold mt-2">
            1,247
          </h2>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <p className="text-gray-500">IPFS Records</p>
          <h2 className="text-3xl font-bold mt-2">
            384
          </h2>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <p className="text-gray-500">Active Users</p>
          <h2 className="text-3xl font-bold mt-2">
            12
          </h2>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl border p-6">
        <h2 className="text-xl font-semibold mb-5">
          Security Architecture
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {securityFeatures.map((item, index) => (
            <div
              key={index}
              className="border rounded-xl p-5"
            >
              <div className="flex justify-between">
                <h3 className="font-semibold">
                  {item.title}
                </h3>

                <span className="text-green-600 text-sm">
                  {item.status}
                </span>
              </div>

              <p className="text-gray-600 text-sm mt-3">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl border overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-xl font-semibold">
            Recent Security Events
          </h2>
        </div>

        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-4">Event</th>
              <th className="text-left p-4">User</th>
              <th className="text-left p-4">Timestamp</th>
              <th className="text-left p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log, index) => (
              <tr key={index} className="border-t">
                <td className="p-4">{log.event}</td>
                <td className="p-4">{log.user}</td>
                <td className="p-4">{log.time}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      log.status === "Success"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold">
            Cryptographic Proofs
          </h3>
          <p className="text-gray-600 text-sm mt-2">
            Enabled for every medical record.
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold">
            Immutable History
          </h3>
          <p className="text-gray-600 text-sm mt-2">
            Every record version is permanently preserved.
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold">
            Zero Trust
          </h3>
          <p className="text-gray-600 text-sm mt-2">
            Authentication and authorization are active.
          </p>
        </div>
      </div>
    </>
  );
}