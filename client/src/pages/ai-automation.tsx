
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Bot, Mail, Phone, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface AutomationTask {
  id: string;
  type: 'email_outreach' | 'utility_setup' | 'follow_up' | 'scheduling';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'requires_approval';
  aiCapability: 'full_automation' | 'assisted' | 'approval_required';
  estimatedTimeSaved: string;
  nextAction?: string;
  results?: any;
}

export default function AIAutomation() {
  const { toast } = useToast();
  const [automationTasks, setAutomationTasks] = useState<AutomationTask[]>([
    {
      id: '1',
      type: 'email_outreach',
      title: 'Contact 5 Moving Companies',
      description: 'AI will craft personalized emails to movers with your inventory and requirements',
      status: 'pending',
      aiCapability: 'approval_required',
      estimatedTimeSaved: '2-3 hours',
      nextAction: 'Review and approve AI-generated emails'
    },
    {
      id: '2', 
      type: 'utility_setup',
      title: 'Schedule All Utility Connections',
      description: 'AI will coordinate optimal timing for internet, electricity, gas, and water setup',
      status: 'pending',
      aiCapability: 'assisted',
      estimatedTimeSaved: '3-4 hours',
      nextAction: 'AI will generate setup timeline and provider recommendations'
    },
    {
      id: '3',
      type: 'follow_up',
      title: 'Follow Up on Pending Quotes',
      description: 'AI will send professional follow-up messages to movers who haven\'t responded',
      status: 'pending',
      aiCapability: 'full_automation',
      estimatedTimeSaved: '1-2 hours',
      nextAction: 'AI can automatically send follow-ups after 48 hours'
    }
  ]);

  const executeAutomation = async (taskId: string) => {
    const task = automationTasks.find(t => t.id === taskId);
    if (!task) return;

    setAutomationTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'in_progress' } : t
    ));

    try {
      let endpoint = '';
      let payload = {};

      switch (task.type) {
        case 'email_outreach':
          endpoint = '/api/share-with-movers';
          payload = {
            // Add your move details and selected movers
          };
          break;
        case 'utility_setup':
          endpoint = '/api/ai-utility-setup';
          payload = {
            // Add your move details and utility preferences
          };
          break;
        case 'follow_up':
          endpoint = '/api/ai-followup-automation';
          payload = {
            // Add follow-up context
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      setAutomationTasks(prev => prev.map(t => 
        t.id === taskId ? { 
          ...t, 
          status: 'completed',
          results: result
        } : t
      ));

      toast({
        title: "Automation Completed",
        description: `${task.title} has been completed successfully.`
      });

    } catch (error) {
      setAutomationTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: 'pending' } : t
      ));
      
      toast({
        title: "Automation Failed",
        description: "There was an error executing the automation.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'requires_approval': return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default: return <Bot className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCapabilityBadge = (capability: string) => {
    switch (capability) {
      case 'full_automation': return <Badge className="bg-green-100 text-green-800">Full Automation</Badge>;
      case 'assisted': return <Badge className="bg-blue-100 text-blue-800">AI Assisted</Badge>;
      case 'approval_required': return <Badge className="bg-orange-100 text-orange-800">Approval Required</Badge>;
      default: return <Badge variant="secondary">Manual</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Automation Center
          </h1>
          <p className="text-xl text-gray-600">
            Let AI handle the tedious tasks while you focus on your move
          </p>
        </div>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">Available Automations</TabsTrigger>
            <TabsTrigger value="active">Active Tasks</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-6">
            <div className="grid gap-6">
              {automationTasks.filter(t => t.status === 'pending').map((task) => (
                <Card key={task.id} className="border-2 hover:border-blue-300 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(task.status)}
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                      </div>
                      {getCapabilityBadge(task.aiCapability)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{task.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Saves: {task.estimatedTimeSaved}
                      </div>
                      <Button 
                        onClick={() => executeAutomation(task.id)}
                        disabled={task.status === 'in_progress'}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {task.status === 'in_progress' ? 'Processing...' : 'Start Automation'}
                      </Button>
                    </div>
                    {task.nextAction && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <Bot className="w-4 h-4 inline mr-1" />
                          Next: {task.nextAction}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="grid gap-6">
              {automationTasks.filter(t => t.status === 'in_progress').map((task) => (
                <Card key={task.id} className="border-blue-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(task.status)}
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <Badge className="bg-blue-100 text-blue-800 animate-pulse">In Progress</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{task.description}</p>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        AI is working on this task... You'll be notified when complete.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid gap-6">
              {automationTasks.filter(t => t.status === 'completed').map((task) => (
                <Card key={task.id} className="border-green-300 bg-green-50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(task.status)}
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <Badge className="bg-green-100 text-green-800">Completed</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{task.description}</p>
                    {task.results && (
                      <div className="p-3 bg-white rounded-lg border">
                        <h4 className="font-semibold mb-2">Results:</h4>
                        <pre className="text-sm text-gray-600 overflow-auto">
                          {JSON.stringify(task.results, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">AI Automation Capabilities</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Automation
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Personalized mover outreach emails</li>
                  <li>• Professional follow-up sequences</li>
                  <li>• Utility provider communications</li>
                  <li>• Quote request management</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Scheduling & Coordination
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Optimal utility setup timing</li>
                  <li>• Moving appointment coordination</li>
                  <li>• Follow-up reminder automation</li>
                  <li>• Task deadline management</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
