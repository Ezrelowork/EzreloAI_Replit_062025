import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
            <h1 className="text-4xl md:text-5xl lg:text-6l font-bold text-gray-900 mb-6">
              Relocate <span className="text-green-600">Intelligently</span>
            </h1>
            <p className="text-xl text-gray-700 max-w-4l mx-auto mb-10">
              Ezrelo transforms your move into a guided, stress-free journey — helping you discover, set up, and track every essential service with the power of AI.
            </p>

            {/* Service Highlights */}
            <div className="flex flex-wrap justify-center gap-6 text-green-800">
              <div className="flex items-center space-x-2 bg-white/60 px-4 py-2 rounded-full shadow-sm">
                <i className="fas fa-check-circle text-green-500"></i>
                <span className="font-medium">Movers</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/60 px-4 py-2 rounded-full shadow-sm">
                <i className="fas fa-check-circle text-green-500"></i>
                <span className="font-medium">Utilities</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/60 px-4 py-2 rounded-full shadow-sm">
                <i className="fas fa-check-circle text-green-500"></i>
                <span className="font-medium">Address Change</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/60 px-4 py-2 rounded-full shadow-sm">
                <i className="fas fa-check-circle text-green-500"></i>
                <span className="font-medium">Lifestyle</span>
              </div>
              </div>
          </div>
        </div>
      </section>
  
      {/* Features Section */}
   <section id="features" className="relative py-16 bg-white overflow-hidden">
  {/* Blurred background image */}
  <div
    className="absolute inset-0 z-0 bg-center bg-cover opacity-15 filter blur-[2px]"
    style={{ backgroundImage: "url('/highway-bg.png')" }}
    aria-hidden="true"
  />

  {/* Main content on top */}
  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-extrabold text-gray-900 sm:text-3xl">
        Why Choose Ezrelo
      </h2>
      <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
        Ezrelo is your intelligent moving assistant — planning your entire move, contacting vendors, organizing critical tasks, and storing everything securely in one place.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">


            {/* AI Assistant Feature - Prominent */}
            <Card className="bg-gradient-to-br from-blue-100 to-emerald-50 border-0">
              <CardContent className="p-8">
                <div className="text-emerald-600 mb-4">
                  <i className="fas fa-brain text-4xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Planning</h3>
                <p className="text-gray-700 mb-4">Let AI build your custom moving plan, complete with reminders, budget tracking, and priority tasks tailored to your needs.</p>
                <ul className="text-gray-700 space-y-2">
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    <span>Personalized timelines</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    <span>Smart notifications</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    <span>Budget aware recommendations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-blue-100 border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="text-green-600 mb-4">
                  <i className="fas fa-map-marked-alt text-4xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Visual Journey</h3>
                <p className="text-gray-700 mb-4">Transform your moving plan into an interactive highway with clickable signs for each task.</p>
                <ul className="text-gray-700 space-y-2">
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    <span>Map-based task layout</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    <span>Clear progress indicators</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    <span>Milestone-based organization</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-green-100 border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="text-green-600 mb-4">
                  <i className="fas fa-network-wired text-4xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Connections</h3>
                <p className="text-gray-700 mb-4">Ezrelo’s AI agent handles vendor outreach on your behalf — no calls, no stress.</p>
                <ul className="text-gray-700 space-y-2">
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    <span>Movers, utilities, and local services</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    <span>Quote comparison</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-600 mr-2"></i>
                    <span>Direct booking from your dashboard</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* AI Features Highlight */}
      <section className="bg-gradient-to-r from-emerald-200 to-white text-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-3xl mb-4">
              Powered by Advanced AI
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of moving with an intelligent, full-service platform designed to think ahead for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Smart Contact</h3>
              <p className="text-gray-600">Securely store all your move info — addresses, dates, service preferences — in one place, automatically accessible for each step.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Intelligent Outreach</h3>
              <p className="text-gray-600">Let AI act for you: requesting quotes, confirming vendors, even filling out service forms — so nothing is missed.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Real-time Support</h3>
              <p className="text-gray-600">From day one to move-in day, get live, conversational help for any task along your journey.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-green-800 to-emerald-900 text-white py-16">
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
              Start AI Planning Now
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
