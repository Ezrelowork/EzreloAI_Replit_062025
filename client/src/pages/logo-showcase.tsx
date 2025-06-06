export default function LogoShowcase() {
  const logoOptions = [
    {
      name: "Layered Journey",
      description: "Three layers representing planning, moving, and settling phases. Clean, modern, suggests organization and progression.",
      icon: (
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      ),
      gradient: "from-blue-500 to-blue-700",
      textColor: "text-blue-600"
    },
    {
      name: "Forward Motion",
      description: "Circular arrow suggesting smooth transition and forward progress. Emphasizes the journey from point A to B.",
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 12h15m0 0l-4-4m4 4l-4 4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      gradient: "from-green-500 to-green-700",
      textColor: "text-green-600"
    },
    {
      name: "Home Connection",
      description: "House with path suggesting the connection between old and new homes. Emphasizes relocation and settling in.",
      icon: (
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 21V10.5L12 6l4 4.5V21M3 12l9-9 9 9M10 21h4v-6h-4v6z"/>
        </svg>
      ),
      gradient: "from-purple-500 to-purple-700",
      textColor: "text-purple-600"
    },
    {
      name: "Navigation Star",
      description: "Star/compass representing guidance and direction. Suggests Ezrelo as your guiding star through relocation.",
      icon: (
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      gradient: "from-red-500 to-red-700",
      textColor: "text-red-600"
    },
    {
      name: "Connected Services",
      description: "Interlocked circles representing the interconnected services Ezrelo provides - moving, utilities, planning.",
      icon: (
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="8" cy="8" r="4" opacity="0.7"/>
          <circle cx="16" cy="8" r="4" opacity="0.5"/>
          <circle cx="12" cy="16" r="4"/>
        </svg>
      ),
      gradient: "from-orange-500 to-orange-700",
      textColor: "text-orange-600"
    },
    {
      name: "Moving Box",
      description: "Stylized moving box with organizational lines, directly representing the moving process and organization.",
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"/>
          <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/>
          <path d="M3 12h18"/>
        </svg>
      ),
      gradient: "from-cyan-500 to-cyan-700",
      textColor: "text-cyan-600"
    },
    {
      name: "Connection Network",
      description: "Network of connected points representing all the services and providers Ezrelo connects you with.",
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="5" cy="6" r="2" fill="currentColor"/>
          <circle cx="19" cy="6" r="2" fill="currentColor"/>
          <circle cx="12" cy="18" r="2" fill="currentColor"/>
          <path d="M7 8l10 0M17 8l-5 8M7 8l5 8"/>
        </svg>
      ),
      gradient: "from-violet-500 to-violet-700",
      textColor: "text-violet-600"
    },
    {
      name: "Modern E",
      description: "Abstract 'E' for Ezrelo with clean lines, suggesting lists, organization, and systematic approach.",
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M4 6h16M4 12h12M4 18h16"/>
        </svg>
      ),
      gradient: "from-gray-600 to-gray-800",
      textColor: "text-gray-700"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Ezrelo Logo Design Concepts</h1>
          <p className="text-gray-600">Unique, trademark-worthy logo options for the Ezrelo brand</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {logoOptions.map((option, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center mb-6">
                <div className={`w-12 h-12 bg-gradient-to-br ${option.gradient} rounded-xl flex items-center justify-center mr-3`}>
                  {option.icon}
                </div>
                <div className={`text-2xl font-bold ${option.textColor}`}>Ezrelo</div>
              </div>
              
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">{option.name}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{option.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Each concept uses distinct visual metaphors and color schemes suitable for trademark registration
          </p>
        </div>
      </div>
    </div>
  );
}