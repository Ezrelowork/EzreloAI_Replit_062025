import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Home, Zap, MapPin, Building, Truck, Calendar, CheckCircle, Clock, X } from "lucide-react";
import { DynamicHighwaySign } from "@/components/dynamic-highway-sign";

interface JourneyStep {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  color: string;
  icon: React.ElementType;
  description: string;
  estimatedTime: string;
  priority: 'high' | 'medium' | 'low';
}

const defaultSteps: JourneyStep[] = [
  {
    id: 'default-sign-1',
    title: 'Moving Companies',
    subtitle: 'Find & Compare Movers',
    route: '/moving-companies',
    color: 'blue',
    icon: Truck,
    description: 'Research and get quotes from verified moving companies in your area.',
    estimatedTime: '2-3 hours',
    priority: 'high'
  },
  {
    id: 'default-sign-2', 
    title: 'Moving Checklist',
    subtitle: 'Step-by-Step Tasks',
    route: '/moving-checklist',
    color: 'green',
    icon: CheckCircle,
    description: 'Complete essential moving tasks with our comprehensive timeline.',
    estimatedTime: '1 hour setup',
    priority: 'medium'
  },
  {
    id: 'default-sign-3',
    title: 'Change of Address',
    subtitle: 'Update Your Information',
    route: '/change-of-address',
    color: 'purple',
    icon: MapPin,
    description: 'Notify USPS, banks, credit cards, and other services of your address change.',
    estimatedTime: '30-45 minutes',
    priority: 'high'
  },
  {
    id: 'default-sign-4',
    title: 'Utilities Setup',
    subtitle: 'Connect Services',
    route: '/utilities',
    color: 'orange',
    icon: Zap,
    description: 'Set up electricity, gas, internet, and water at your new home.',
    estimatedTime: '1-2 hours',
    priority: 'high'
  },
  {
    id: 'default-sign-5',
    title: 'Local Services',
    subtitle: 'Find Healthcare & More',
    route: '/local-services',
    color: 'teal',
    icon: Building,
    description: 'Locate healthcare providers, schools, and local services near your new home.',
    estimatedTime: '45 minutes',
    priority: 'medium'
  }
];

export default function MovingJourneySimple() {
  const [location, navigate] = useLocation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps] = useState<JourneyStep[]>(defaultSteps);
  const [isEditMode, setIsEditMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const urlParams = new URLSearchParams(window.location.search);
  const fromParam = urlParams.get('from');

  const currentStep = steps[currentStepIndex] || steps[0];

  const handleSignClick = (step: JourneyStep) => {
    let targetRoute = step.route;

    // Build query params for context preservation
    const params = new URLSearchParams();
    if (fromParam) params.set('from', fromParam);

    const queryString = params.toString();
    const finalRoute = queryString ? `${targetRoute}?${queryString}` : targetRoute;

    navigate(finalRoute);
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const goToStep = (index: number) => {
    setCurrentStepIndex(index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href={fromParam || "/hub"}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Hub
                </Button>
              </Link>
              <span className="text-gray-300">|</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Moving Journey</h1>
                <p className="text-sm text-gray-600">Interactive relocation roadmap</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Moving Journey</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Navigate through your relocation step-by-step. Each sign represents an important phase of your move.
          </p>
        </div>

        {/* Journey Timeline */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2">
              {steps.map((_, index) => (
                <React.Fragment key={index}>
                  <button
                    onClick={() => goToStep(index)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      index === currentStepIndex
                        ? 'bg-blue-600 text-white'
                        : index < currentStepIndex
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index < currentStepIndex ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 ${index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Current Step Display */}
        <div className="max-w-4xl mx-auto" ref={containerRef}>
          <Card className="mb-8 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-${currentStep.color}-100`}>
                  <currentStep.icon className={`w-8 h-8 text-${currentStep.color}-600`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentStep.title}</h3>
                <p className="text-gray-600 mb-4">{currentStep.description}</p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {currentStep.estimatedTime}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentStep.priority === 'high' ? 'bg-red-100 text-red-800' :
                    currentStep.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {currentStep.priority} priority
                  </div>
                </div>
              </div>

              {/* Highway Sign */}
              <div className="flex justify-center mb-8">
                <div className="cursor-pointer transform hover:scale-105 transition-transform duration-200">
                  <DynamicHighwaySign
                    key={currentStep.id}
                    title={currentStep.title}
                    description={currentStep.description}
                    week={currentStep.estimatedTime}
                    priority={currentStep.priority}
                    completed={false}
                    onClick={() => handleSignClick(currentStep)}
                    className="w-80 h-48"
                  />
                </div>
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => handleSignClick(currentStep)}
                  size="lg"
                  className="px-8 py-3"
                >
                  Start {currentStep.title}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <Button
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
            </div>

            <Button
              onClick={nextStep}
              disabled={currentStepIndex === steps.length - 1}
              variant="outline"
              className="gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}