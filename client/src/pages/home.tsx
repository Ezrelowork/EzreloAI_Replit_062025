import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

export default function Home() {
  const [showTerms, setShowTerms] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center">
                <svg width="28" height="28" fill="white" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="text-3xl font-bold text-green-600">Ezrelo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 via-emerald-10 to-green-300 py-16 md:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Relocate <span className="text-green-600">Intelligently</span>
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-12">
              Enter your new address and let Ezrelo find and set up all the essential services you need for a seamless move.
            </p>

            {/* Service Highlights */}
            <div className="flex flex-wrap justify-center gap-6 text-green-800">
              <div className="flex items-center space-x-2 bg-white/60 px-4 py-2 rounded-full shadow-sm">
                <i className="fas fa-check-circle text-green-500"></i>
                <span className="font-medium">Utilities</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/60 px-4 py-2 rounded-full shadow-sm">
                <i className="fas fa-check-circle text-green-500"></i>
                <span className="font-medium">Internet</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/60 px-4 py-2 rounded-full shadow-sm">
                <i className="fas fa-check-circle text-green-500"></i>
                <span className="font-medium">Healthcare</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/60 px-4 py-2 rounded-full shadow-sm">
                <i className="fas fa-check-circle text-green-500"></i>
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
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/4 text-emerald-600">
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
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/4 text-emerald-600">
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
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/4 text-emerald-600">
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
            <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="text-emerald-600 mb-4">
                  <i className="fas fa-brain text-4xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Planning</h3>
                <p className="text-gray-700 mb-4">Get a personalized moving timeline and task list based on your specific situation and needs.</p>
                <ul className="text-gray-700 space-y-2">
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    <span>Custom timeline</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    <span>Task prioritization</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    <span>Budget guidance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="text-green-600 mb-4">
                  <i className="fas fa-map-marked-alt text-4xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Visual Journey</h3>
                <p className="text-gray-700 mb-4">Transform your moving plan into an interactive highway with clickable signs for each task.</p>
                <ul className="text-gray-700 space-y-2">
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    <span>Interactive map</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    <span>Progress tracking</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    <span>Visual milestones</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-50 to-green-100 border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="text-teal-600 mb-4">
                  <i className="fas fa-network-wired text-4xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Connections</h3>
                <p className="text-gray-700 mb-4">Find and connect with local service providers for all your moving needs.</p>
                <ul className="text-gray-700 space-y-2">
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    <span>Local providers</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    <span>Price comparison</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    <span>Direct booking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

     

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-600 py-16 relative overflow-hidden">
        {/* Background Pattern */}
        

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-6">
            Ready to simplify your move?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
            Let our AI create a personalized moving journey just for you. Get started in minutes and never miss an important task again.
          </p>
          <Link href="/ai-assistant">
            <Button 
              className="bg-white text-green-800 hover:bg-green-50 px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              Get Started Now
              <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
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
                <li><button onClick={() => setShowTerms(true)} className="hover:text-white transition-colors">Terms of Service</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Ezrelo. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Terms of Service Modal */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-green-600">Ezrelo Terms of Service</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-600 mb-6"><strong>Effective Date:</strong> [Insert Date]</p>
            
            <p className="mb-6">Welcome to Ezrelo! These Terms of Service ("Terms") govern your access to and use of the Ezrelo website, mobile application, and related services (collectively, the "Services") provided by Ezrelo, Inc. ("Ezrelo," "we," "our," or "us"). By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use our Services.</p>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Use of Services</h3>
                <p className="text-gray-700">Ezrelo provides users with AI-assisted tools to streamline the relocation process, including personalized recommendations for services like moving, utilities, internet, healthcare, and more. You agree to use our Services only for lawful purposes and in accordance with these Terms.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Eligibility</h3>
                <p className="text-gray-700">You must be at least 18 years of age to use the Services. By using Ezrelo, you represent and warrant that you are 18 or older and have the legal capacity to enter into these Terms.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Account Registration</h3>
                <p className="text-gray-700">Some features may require creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4. AI-Generated Content Disclaimer</h3>
                <p className="text-gray-700">Ezrelo leverages AI technologies, including but not limited to OpenAI's GPT and Google APIs, to generate recommendations and summaries. These outputs are provided for informational purposes only and do not constitute professional advice. Users are encouraged to verify all information before making decisions.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Third-Party Services and Links</h3>
                <p className="text-gray-700">Ezrelo provides links to and information about third-party service providers. We do not control, endorse, or assume responsibility for any third-party content or services. Any dealings with third parties are solely between you and the third party.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">6. User Conduct</h3>
                <p className="text-gray-700 mb-2">You agree not to:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Misuse our Services or interfere with their proper functioning;</li>
                  <li>Use the Services to distribute spam or malicious content;</li>
                  <li>Attempt to reverse-engineer or exploit our AI tools or platform.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Intellectual Property</h3>
                <p className="text-gray-700">All content and materials on Ezrelo, including text, graphics, logos, and software, are the property of Ezrelo or its licensors and are protected by intellectual property laws. You may not use our trademarks or content without express permission.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Termination</h3>
                <p className="text-gray-700">We reserve the right to suspend or terminate your access to the Services at our sole discretion, with or without notice, if we believe you have violated these Terms.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Disclaimer of Warranties</h3>
                <p className="text-gray-700">The Services are provided "as is" and "as available." We disclaim all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee that the Services will be uninterrupted or error-free.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">10. Limitation of Liability</h3>
                <p className="text-gray-700">To the fullest extent permitted by law, Ezrelo shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">11. Changes to Terms</h3>
                <p className="text-gray-700">We may revise these Terms from time to time. If we make material changes, we will provide notice through our Services or by other means. Your continued use of the Services after the changes become effective constitutes your acceptance of the revised Terms.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">12. Governing Law</h3>
                <p className="text-gray-700">These Terms shall be governed by the laws of the State of [Your State], without regard to its conflict of law provisions.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">13. Contact Us</h3>
                <p className="text-gray-700 mb-2">If you have any questions about these Terms, please contact us at:</p>
                <div className="text-gray-700">
                  <p>Ezrelo, Inc.</p>
                  <p>[Insert Contact Address]</p>
                  <p>Email: [Insert Contact Email]</p>
                </div>
              </div>

              <div className="text-center pt-6 border-t">
                <p className="text-green-600 font-medium">Thank you for using Ezrelo!</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}