import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, MapPin, Zap, Users, CheckCircle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Ezrelo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/ai-assistant">
                <Button variant="outline">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Your AI-Powered
            <span className="text-blue-600"> Relocation Concierge</span>
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            Transform your moving experience with intelligent planning, personalized recommendations, 
            and seamless project management. Let AI guide your journey to a new home.
          </p>
          <div className="mt-10">
            <Link href="/ai-assistant">
              <Button size="lg" className="inline-flex items-center px-8 py-3 text-lg">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-gray-900">
              Everything You Need for a Seamless Move
            </h3>
            <p className="mt-4 text-lg text-gray-500">
              Powered by AI and designed for simplicity
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <MapPin className="h-8 w-8 text-blue-600" />
                <CardTitle>Smart Planning</CardTitle>
                <CardDescription>
                  AI-generated moving timelines and checklists personalized to your specific needs
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-blue-600" />
                <CardTitle>Service Discovery</CardTitle>
                <CardDescription>
                  Find vetted moving companies, utilities, and local services with real-time availability
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600" />
                <CardTitle>Project Management</CardTitle>
                <CardDescription>
                  Track progress, manage communications, and stay organized throughout your move
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-extrabold text-white">
            Ready to Make Moving Simple?
          </h3>
          <p className="mt-4 text-xl text-blue-100">
            Join thousands who have transformed their relocation experience
          </p>
          <div className="mt-8">
            <Link href="/ai-assistant">
              <Button size="lg" variant="secondary" className="inline-flex items-center px-8 py-3 text-lg">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}