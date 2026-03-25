export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Manifest</h1>
        </div>
        <div className="bg-white rounded-lg shadow-md p-8">{children}</div>
      </div>
    </div>
  )
}
