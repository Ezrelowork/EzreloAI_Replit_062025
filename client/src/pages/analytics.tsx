import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ReferralClick {
  id: number;
  provider: string;
  category: string;
  action: string;
  userAddress: string;
  timestamp: string;
  ipAddress?: string;
}

interface AnalyticsData {
  totalClicks: number;
  clicksByProvider: Array<{ provider: string; clicks: number; }>;
  clicksByCategory: Array<{ category: string; clicks: number; }>;
  clicksByAction: Array<{ action: string; clicks: number; }>;
  recentClicks: ReferralClick[];
  topLocations: Array<{ location: string; clicks: number; }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Analytics() {
  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Analytics</CardTitle>
            <CardDescription>Failed to load referral tracking data</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const estimateRevenue = (clicks: number, action: string) => {
    const rates = {
      signup: 75, // Average $75 per signup
      quote: 25,  // Average $25 per quote request
      learn_more: 5 // Average $5 per qualified lead
    };
    return clicks * (rates[action as keyof typeof rates] || 0);
  };

  const totalEstimatedRevenue = analytics?.clicksByAction.reduce((total, item) => {
    return total + estimateRevenue(item.clicks, item.action);
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Referral Analytics</h1>
            <p className="text-gray-600">Track your monetization performance and revenue opportunities</p>
          </div>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${totalEstimatedRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Estimated Revenue</div>
            </div>
          </Card>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalClicks || 0}</div>
              <p className="text-xs text-gray-500">All referral interactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sign-ups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.clicksByAction.find(a => a.action === 'signup')?.clicks || 0}
              </div>
              <p className="text-xs text-gray-500">Highest value conversions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quote Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.clicksByAction.find(a => a.action === 'quote')?.clicks || 0}
              </div>
              <p className="text-xs text-gray-500">Medium value leads</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {analytics?.clicksByProvider[0]?.provider || 'N/A'}
              </div>
              <p className="text-xs text-gray-500">
                {analytics?.clicksByProvider[0]?.clicks || 0} clicks
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Clicks by Provider</CardTitle>
              <CardDescription>Which providers generate most revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.clicksByProvider || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="provider" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="clicks" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions Distribution</CardTitle>
              <CardDescription>User interaction patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics?.clicksByAction || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ action, clicks }) => `${action}: ${clicks}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="clicks"
                  >
                    {(analytics?.clicksByAction || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Categories</CardTitle>
              <CardDescription>Most popular utility types</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.clicksByCategory || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="clicks" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Locations</CardTitle>
              <CardDescription>Highest engagement areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topLocations.slice(0, 5).map((location, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="text-sm font-medium">{location.location}</div>
                    <div className="text-sm text-gray-500">{location.clicks} clicks</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Referral Activity</CardTitle>
            <CardDescription>Latest user interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.recentClicks.slice(0, 10).map((click) => (
                <div key={click.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{click.provider} - {click.category}</div>
                    <div className="text-sm text-gray-500">{click.userAddress}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium capitalize">{click.action}</div>
                    <div className="text-xs text-gray-500">{formatTimestamp(click.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}