
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Reply, 
  Calendar,
  Phone,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VendorCommunication {
  id: number;
  communicationType: string;
  subject: string;
  notes: string;
  contactPerson: string;
  createdAt: string;
}

interface VendorCommunicationsProps {
  projectId: number;
}

export default function VendorCommunications({ projectId }: VendorCommunicationsProps) {
  const { toast } = useToast();
  const [selectedCommunication, setSelectedCommunication] = useState<VendorCommunication | null>(null);

  // Fetch communications for this project
  const { data: communications = [], isLoading } = useQuery({
    queryKey: ['vendor-communications', projectId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/moving-project/${projectId}`);
      const data = await response.json();
      return data.communications || [];
    },
    refetchInterval: 30000, // Poll every 30 seconds for new messages
  });

  const vendorEmails = communications.filter((comm: VendorCommunication) => 
    comm.communicationType === 'vendor_email' || comm.communicationType === 'ai_outreach'
  );

  const parseEmailData = (notes: string) => {
    try {
      return JSON.parse(notes);
    } catch {
      return { body: notes };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Vendor Communications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading communications...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Vendor Communications
            {vendorEmails.length > 0 && (
              <Badge className="ml-auto">{vendorEmails.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            All vendor responses and communications are delivered here securely
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vendorEmails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No vendor communications yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Responses from movers will appear here when they reply to your AI-generated quotes
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {vendorEmails.map((comm) => {
                const emailData = parseEmailData(comm.notes);
                const isIncoming = comm.communicationType === 'vendor_email';
                
                return (
                  <div 
                    key={comm.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      isIncoming 
                        ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                        : 'bg-green-50 border-green-200 hover:bg-green-100'
                    }`}
                    onClick={() => setSelectedCommunication(comm)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {isIncoming ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              <Mail className="w-3 h-3 mr-1" />
                              Received
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Sent
                            </Badge>
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {isIncoming ? `From: ${comm.contactPerson}` : `To: ${comm.contactPerson}`}
                          </span>
                        </div>
                        
                        <h4 className="font-medium text-gray-900 mb-1">
                          {emailData.subject || comm.subject}
                        </h4>
                        
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {emailData.body || 'AI-generated professional quote request sent'}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(comm.createdAt).toLocaleDateString()}
                          </span>
                          {emailData.attachments > 0 && (
                            <span>{emailData.attachments} attachment(s)</span>
                          )}
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Communication Detail Modal */}
      {selectedCommunication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {parseEmailData(selectedCommunication.notes).subject || selectedCommunication.subject}
                </h2>
                <button
                  onClick={() => setSelectedCommunication(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedCommunication.communicationType === 'vendor_email' ? 'From' : 'To'}: 
                      {selectedCommunication.contactPerson}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(selectedCommunication.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  {selectedCommunication.communicationType === 'vendor_email' && (
                    <Button variant="outline" size="sm">
                      <Reply className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                  )}
                </div>

                <div className="prose max-w-none">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">
                      {parseEmailData(selectedCommunication.notes).body || 'No content available'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
