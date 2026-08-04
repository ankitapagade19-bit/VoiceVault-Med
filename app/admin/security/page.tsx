export default function AdminSecurityPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Security Center</h1>

      <p className="text-slate-600 mt-3">
        Monitor system security and Zero-Trust protection.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div className="rounded-xl border p-6">
          <h2 className="font-semibold text-lg">
            Failed Login Attempts
          </h2>

          <p className="text-4xl font-bold mt-4 text-red-600">
            8
          </p>
        </div>

        <div className="rounded-xl border p-6">
          <h2 className="font-semibold text-lg">
            Active Sessions
          </h2>

          <p className="text-4xl font-bold mt-4">
            24
          </p>
        </div>

        <div className="rounded-xl border p-6">
          <h2 className="font-semibold text-lg">
            MFA Status
          </h2>

          <p className="mt-4 text-green-600 font-semibold">
            Enabled
          </p>
        </div>

        <div className="rounded-xl border p-6">
          <h2 className="font-semibold text-lg">
            Encryption
          </h2>

          <p className="mt-4 text-green-600 font-semibold">
            AES-256 Active
          </p>
        </div>
      </div>
    </main>
  );
}