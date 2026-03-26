export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Manifest</h1>
          <p className="text-sm text-gray-500 mt-1">Let&apos;s get your operation set up</p>
        </div>
        {children}
      </div>
    </div>
  )
}
