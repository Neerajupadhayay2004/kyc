import React, { useState, useEffect } from 'react';
import { Users, FileCheck, Clock, CheckCircle, XCircle, BarChart3, Shield, Search, Filter } from 'lucide-react';
import { localAdminService, AdminStats } from '../../services/localAdmin';
import { KYCApplication } from '../../lib/localDatabase';
import { useAuth } from '../../contexts/LocalAuthContext';

const LocalAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [applications, setApplications] = useState<KYCApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadDashboardData();
  }, [selectedStatus, currentPage]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, applicationsData] = await Promise.all([
        localAdminService.getStats(),
        localAdminService.getAllApplications(currentPage, 20, selectedStatus || undefined)
      ]);
      
      setStats(statsData);
      setApplications(applicationsData);
    } catch (error) {
      console.error('Load dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewApplication = async (applicationId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      await localAdminService.reviewApplication(applicationId, action, user!.id, notes);
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Review application error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'under_review': return 'text-blue-600 bg-blue-100';
      case 'submitted': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredApplications = applications.filter(app => 
    app.personalInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.personalInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.personalInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 space-y-4 sm:space-y-0">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">KYC Admin Dashboard</h1>
                <p className="text-gray-600">Manage and review KYC applications</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-4 lg:p-6">
              <div className="flex items-center">
                <Users className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
                <div className="ml-3 lg:ml-4">
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 lg:p-6">
              <div className="flex items-center">
                <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-600" />
                <div className="ml-3 lg:ml-4">
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.pendingReview}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 lg:p-6">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
                <div className="ml-3 lg:ml-4">
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.approved}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 lg:p-6">
              <div className="flex items-center">
                <XCircle className="w-6 h-6 lg:w-8 lg:h-8 text-red-600" />
                <div className="ml-3 lg:ml-4">
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.rejected}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 lg:p-6 col-span-2 lg:col-span-1">
              <div className="flex items-center">
                <BarChart3 className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600" />
                <div className="ml-3 lg:ml-4">
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Today's Submissions</p>
                  <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.todaySubmissions}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center">
              <Filter className="w-5 h-5 text-gray-400 mr-2" />
              <label className="block text-sm font-medium text-gray-700">Filter by Status</label>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">KYC Applications</h3>
          </div>
          
          {/* Mobile View */}
          <div className="block lg:hidden">
            {filteredApplications.map((application) => (
              <div key={application.id} className="border-b border-gray-200 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-gray-900">
                      {application.personalInfo.firstName} {application.personalInfo.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{application.personalInfo.email}</div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                    {application.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                  <span>{application.applicationNumber}</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(application.riskLevel)}`}>
                    {application.riskLevel}
                  </span>
                </div>
                {application.status === 'submitted' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleReviewApplication(application.id, 'approve')}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReviewApplication(application.id, 'reject', 'Rejected by admin')}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {application.applicationNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          Step {application.currentStep}/5
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {application.personalInfo.firstName} {application.personalInfo.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.personalInfo.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                        {application.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(application.riskLevel)}`}>
                        {application.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {application.status === 'submitted' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleReviewApplication(application.id, 'approve')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewApplication(application.id, 'reject', 'Rejected by admin')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredApplications.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">No applications found</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocalAdminDashboard;