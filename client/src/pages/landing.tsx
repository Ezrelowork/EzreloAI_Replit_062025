import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Clock, Users, CheckCircle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Your Moving Journey,
            <span className="block text-blue-600">Reimagined</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform your relocation from overwhelming chaos into a guided, visual journey. 
            Our AI creates your personalized moving plan and shows your progress as an interactive highway experience.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            How Ezrelo Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">1. Tell Us About Your Move</h3>
              <p className="text-gray-600">
                Share your moving details - where you're going, family size, budget, and priorities. 
                Our AI understands your unique situation.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">2. Get Your Visual Journey</h3>
              <p className="text-gray-600">
                Watch as your personalized moving plan transforms into an interactive highway. 
                Each task becomes a milestone on your road to success.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">3. Complete & Track Progress</h3>
              <p className="text-gray-600">
                Click highway signs to access providers, get quotes, and complete tasks. 
                Watch your journey progress as you move forward.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose Ezrelo
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-6">AI-Powered Planning</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">Personalized timeline based on your specific move</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">Smart task prioritization and scheduling</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">Budget-conscious recommendations</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">Local service provider connections</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-6">Visual Journey Experience</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">Interactive highway visualization of your move</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">Progress tracking with milestone celebrations</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">Cinematic transitions between tasks</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">Mobile-friendly design for on-the-go planning</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative px-6 py-20 bg-blue-600 overflow-hidden">
        {/* Highway Background */}
        <div 
          className="absolute inset-0 opacity-50 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/attached_assets/highway-background.png')`,
            filter: 'blur(4px)'
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Move?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands who've made their relocation stress-free with Ezrelo's AI-powered guidance.
          </p>
          
          <Link href="/ai-assistant">
            <Button size="lg" variant="secondary" className="text-lg px-12 py-6 text-xl font-semibold">
              Start Your Moving Plan
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
          </Link>
          
          <div className="mt-8 flex items-center justify-center gap-8 text-blue-200">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>2-minute setup</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Free to use</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>No account needed</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}