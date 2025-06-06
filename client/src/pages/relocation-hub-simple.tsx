import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle,
  Clock,
  MapPin,
  Building,
  Truck,
  Zap,
  Wifi,
  Stethoscope,
  ArrowRight
} from "lucide-react";

export default function RelocationHub() {
  // Dynamic progress calculation - starts at 0 for new users
  const overallProgress = 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold sm:text-5xl md:text-6xl mb-6">
              Relocate <span className="text-blue-200">Intelligently</span>
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto text-blue-100">
              Your complete relocation command center. From finding movers to setting up utilities, 
              we guide you through every step of your move with personalized timelines and verified providers.
            </p>
            <div className="flex justify-center items-center gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-200">{overallProgress}%</div>
                <div className="text-sm text-blue-100">Complete</div>
              </div>
              <Progress value={overallProgress} className="w-48 h-3" />
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-200">3</div>
                <div className="text-sm text-blue-100">Phases</div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Verified Moving Companies
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Utility Provider Matching
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Timeline-Based Guidance
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Exclusive Discounts & Cashback
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Follow our proven 3-phase system to ensure nothing falls through the cracks during your move.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center h-[280px] flex flex-col">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Pre-Move Planning</h3>
              <p className="text-gray-600 mb-3 h-[48px] flex items-center justify-center">Essential preparations for your move</p>
              <div className="text-sm text-blue-600 font-medium mb-3">8-4 weeks before</div>
              <div className="mt-auto">
                <Progress value={0} className="w-full h-2" />
                <div className="text-xs text-gray-500 mt-1">0% Complete</div>
              </div>
            </div>
            <div className="text-center h-[280px] flex flex-col">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Essential Services Setup</h3>
              <p className="text-gray-600 mb-3 h-[48px] flex items-center justify-center">Set up utilities and essential services</p>
              <div className="text-sm text-blue-600 font-medium mb-3">2-4 weeks before</div>
              <div className="mt-auto">
                <Progress value={0} className="w-full h-2" />
                <div className="text-xs text-gray-500 mt-1">0% Complete</div>
              </div>
            </div>
            <div className="text-center h-[280px] flex flex-col">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Settling In</h3>
              <p className="text-gray-600 mb-3 h-[48px] flex items-center justify-center">Complete your relocation and get established</p>
              <div className="text-sm text-blue-600 font-medium mb-3">Moving week & after</div>
              <div className="mt-auto">
                <Progress value={0} className="w-full h-2" />
                <div className="text-xs text-gray-500 mt-1">0% Complete</div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Ezrelo?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Save time, reduce stress, and never miss important deadlines with our comprehensive relocation platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verified Providers</h3>
              <p className="text-gray-600 text-sm">All moving companies and service providers are pre-screened and verified for quality and reliability.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Timeline Guidance</h3>
              <p className="text-gray-600 text-sm">Never miss deadlines with our detailed timeline showing exactly when to complete each task.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Local Expertise</h3>
              <p className="text-gray-600 text-sm">Get personalized recommendations based on your specific location and requirements.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Save Money</h3>
              <p className="text-gray-600 text-sm">Get exclusive discounts, cashback offers, and negotiated rates through our verified provider partnerships.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started Section - At the bottom after all explanations */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Begin Your Relocation Journey?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Let our AI concierge analyze your move and create a personalized plan that guides you through each step.
          </p>
          <Link href="/ai-assistant">
            <Button size="lg" className="px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700">
              Start Your Move
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            No signup required • Instant AI analysis • Personalized recommendations
          </p>
          <p className="text-xs text-blue-500 mt-2">
            <a href="/logo-showcase" className="underline">View Logo Design Options</a>
          </p>
        </div>
      </section>
    </div>
  );
}