import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <svg width="28" height="28" fill="white" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="text-3xl font-bold text-primary">Ezrelo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-white to-primary/10 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Relocate <span className="text-primary">Intelligently</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              Enter your new address and let Ezrelo find and set up all the essential services you need for a seamless move.
            </p>

            {/* Service Highlights */}
            <div className="flex flex-wrap justify-center gap-6 text-primary">
              <div className="flex items-center space-x-2">
                <i className="fas fa-check-circle"></i>
                <span className="font-medium">Utilities</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-check-circle"></i>
                <span className="font-medium">Internet</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-check-circle"></i>
                <span className="font-medium">Healthcare</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-check-circle"></i>
                <span className="font-medium">Home Services</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Ezrelo Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Setting up services in your new home has never been easier. Our AI-powered platform simplifies the entire process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-6">
                  <i className="fas fa-comments text-2xl"></i>
                </div>
              
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Tell Us About Your Move</h3>
                <p className="text-gray-600">
                  Share your moving details with our AI assistant - where you're going, family size, timeline, and priorities.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-6">
                  <i className="fas fa-route text-2xl"></i>
                </div>
            
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Get Your Visual Journey</h3>
                <p className="text-gray-600">
                  Watch as your personalized moving plan transforms into an interactive highway with clickable signs for each task.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-6">
                  <i className="fas fa-check-circle text-2xl"></i>
                </div>
              
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Complete Your Tasks</h3>
                <p className="text-gray-600">
                  Click on highway signs to find services, compare providers, and track your progress as you prepare for your move.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Why Choose Ezrelo
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Ezrelo offers intelligent, personalized moving assistance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="text-blue-600 mb-4">
                  <i className="fas fa-brain text-4xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Planning</h3>
                <p className="text-gray-600 mb-4">Get a personalized moving timeline and task list based on your specific situation and needs.</p>
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Custom timeline</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Task prioritization</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Budget guidance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="text-green-600 mb-4">
                  <i className="fas fa-map-marked-alt text-4xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Visual Journey</h3>
                <p className="text-gray-600 mb-4">Transform your moving plan into an interactive highway with clickable signs for each task.</p>
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Interactive map</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Progress tracking</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Visual milestones</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="text-purple-600 mb-4">
                  <i className="fas fa-network-wired text-4xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Connections</h3>
                <p className="text-gray-600 mb-4">Find and connect with local service providers for all your moving needs.</p>
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Local providers</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Price comparison</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Direct booking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-6">
            Ready to simplify your move?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Let our AI create a personalized moving journey just for you. Get started in minutes and never miss an important task again.
          </p>
          <Link href="/ai-assistant">
            <Button 
              className="bg-white text-primary hover:bg-gray-50 px-8 py-4 text-lg"
              size="lg"
            >
              Get Started Now
              <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Ezrelo</h3>
              <p className="text-gray-400">AI-powered relocation assistance to simplify your move and help you set up essential services.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Utilities</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Healthcare</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Home Services</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Moving Companies</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Moving Guides</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Checklists</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partnerships</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Ezrelo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}