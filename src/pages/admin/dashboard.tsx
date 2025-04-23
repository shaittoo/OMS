import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where, doc, updateDoc, getDoc, addDoc, orderBy, Timestamp } from 'firebase/firestore';
import { auth } from '../../firebaseConfig';
import { useRouter } from 'next/router';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { onAuthStateChanged } from 'firebase/auth';
import EventIcon from '@mui/icons-material/Event';
import BusinessIcon from '@mui/icons-material/Business';
import { toast } from 'react-hot-toast';

interface Request {
  id: string;
  name: string;
  submittedBy: string;
  submissionDate: string;
  status: 'pending' | 'accepted' | 'rejected';
  type: 'organization' | 'event';
  email?: string;
  photo?: string;
  members?: string[];
  rejectionReason?: string;
  organizationVerified?: boolean;
  eventDate?: string;
  eventLocation?: string;
  eventPrice?: string;
  eventDescription?: string;
  eventImages?: string[];
  isOpenForAll?: boolean;
  interested?: string[];
  likedBy?: string[];
  likes?: number;
  organizationId?: string;
  tags?: string[];
}

interface AuditLog {
  requestId: string;
  requestType: 'organization' | 'event';
  action: 'accepted' | 'rejected';
  adminId: string;
  adminEmail: string;
  timestamp: Timestamp;
  reason?: string;
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'events' | 'organizations'>('events');
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'name' | 'date'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const router = useRouter();

  const fetchRequests = async () => {
    try {
      if (activeTab === 'events') {
        // Fetch only events
        const eventsQuery = query(
          collection(db, 'events'),
          orderBy('eventDate', 'desc')
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventRequests = eventsSnapshot.docs
          .map(doc => {
            const data = doc.data();
            
            // Handle date formatting
            let formattedDate = 'N/A';
            if (data.eventDate) {
              if (data.eventDate.toDate) {
                // If it's a Firestore Timestamp
                formattedDate = data.eventDate.toDate().toLocaleDateString();
              } else if (data.eventDate instanceof Date) {
                // If it's a JavaScript Date
                formattedDate = data.eventDate.toLocaleDateString();
              } else {
                // If it's a string or other format
                formattedDate = data.eventDate;
              }
            }

            return {
              id: doc.id,
              name: data.eventName || '',
              submittedBy: data.organizationId || '',
              submissionDate: formattedDate,
              status: data.status || 'pending',
              type: 'event' as const,
              eventDate: formattedDate,
              eventLocation: data.eventLocation || '',
              eventPrice: data.eventPrice || '',
              eventDescription: data.eventDescription || '',
              eventImages: data.eventImages || [],
              isOpenForAll: data.isOpenForAll || false,
              interested: data.interested || [],
              likedBy: data.likedBy || [],
              likes: data.likes || 0,
              organizationId: data.organizationId || '',
              tags: data.tags || [],
              rejectionReason: data.rejectionReason
            };
          });

        // Get organization names for the events
        const orgIds = Array.from(new Set(eventRequests.map(event => event.organizationId)));
        const orgData = new Map();
        
        await Promise.all(
          orgIds.map(async (orgId) => {
            if (!orgId) return;
            const orgDoc = await getDoc(doc(db, 'Organizations', orgId));
            if (orgDoc.exists()) {
              orgData.set(orgId, orgDoc.data().name);
            }
          })
        );

        // Update event requests with organization names
        const updatedEventRequests = eventRequests.map(event => ({
          ...event,
          submittedBy: orgData.get(event.organizationId) || 'Unknown Organization'
        }));

        setRequests(updatedEventRequests);
      } else {
        // Fetch only organizations
        const orgsQuery = query(
          collection(db, 'Organizations'),
          orderBy('createdAt', 'desc')
        );
        const orgsSnapshot = await getDocs(orgsQuery);
        const orgRequests: Request[] = orgsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            submittedBy: data.email || '',
            submissionDate: data.createdAt?.toDate().toLocaleDateString() || 'N/A',
            status: (data.status || 'pending') as 'pending' | 'accepted' | 'rejected',
            type: 'organization' as const,
            email: data.email || '',
            photo: data.photo || '',
            members: data.members || [],
            rejectionReason: data.rejectionReason || '',
            organizationVerified: true // Organizations are always verified
          };
        });

        setRequests(orgRequests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      const userDoc = await getDoc(doc(db, 'Users', user.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        router.push('/login');
        return;
      }

      fetchRequests();
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const logAuditTrail = async (
    requestId: string,
    requestType: 'organization' | 'event',
    action: 'accepted' | 'rejected',
    reason?: string
  ) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const auditLog: AuditLog = {
        requestId,
        requestType,
        action,
        adminId: currentUser.uid,
        adminEmail: currentUser.email || 'unknown',
        timestamp: Timestamp.now(),
        ...(reason && { reason })
      };

      await addDoc(collection(db, 'auditLogs'), auditLog);
    } catch (error) {
      console.error('Error logging audit trail:', error);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: string, rejectionReason?: string) => {
    try {
      setLoading(true);
      const requestRef = doc(db, activeTab === 'organizations' ? 'Organizations' : 'events', requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        toast.error('Request not found');
        return;
      }

      await updateDoc(requestRef, {
        status: newStatus,
        ...(rejectionReason && { rejectionReason }),
      });

      // Log the action in audit trail
      await logAuditTrail(requestId, activeTab === 'organizations' ? 'organization' : 'event', newStatus as 'accepted' | 'rejected', rejectionReason);

      toast.success(`${activeTab.slice(0, -1)} ${newStatus} successfully`);
      await fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: 'accept' | 'reject') => {
    if (action === 'reject' && !rejectionReason) {
      setShowRejectionModal(true);
      return;
    }

    try {
      for (const requestId of selectedRequests) {
        const request = requests.find(r => r.id === requestId);
        if (!request) continue;

        const docRef = doc(db, request.type === 'organization' ? 'Organizations' : 'events', requestId);
        const updateData = {
          status: action === 'accept' ? 'accepted' : 'rejected',
          ...(action === 'reject' && { rejectionReason })
        };

        await updateDoc(docRef, updateData);
        await logAuditTrail(
          requestId,
          request.type,
          action === 'accept' ? 'accepted' : 'rejected',
          rejectionReason
        );
      }

      setRequests(requests.map(r => 
        selectedRequests.includes(r.id) 
          ? { 
              ...r, 
              status: action === 'accept' ? 'accepted' : 'rejected',
              rejectionReason: action === 'reject' ? rejectionReason : undefined
            } 
          : r
      ));

      setSelectedRequests([]);
      setRejectionReason('');
      setShowRejectionModal(false);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const sortRequests = (a: Request, b: Request) => {
    if (sortField === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else {
      return sortDirection === 'asc'
        ? new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime()
        : new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime();
    }
  };

  const filteredRequests = requests
    .filter(request => {
      const matchesSearch = request.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort(sortRequests);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Admin Panel</h2>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'events' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <EventIcon />
              <span>Event Approvals</span>
            </button>
            <button
              onClick={() => setActiveTab('organizations')}
              className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'organizations' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <BusinessIcon />
              <span>Org Approvals</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-purple-700 hover:text-purple-900 mb-5"
          >
            <ArrowBackIcon className="mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {activeTab === 'events' ? 'Event Approvals' : 'Org Approvals'}
          </h1>
          <p className="text-gray-600">
            {activeTab === 'events' 
              ? 'Manage event postings from verified organizations' 
              : 'Manage organization registrations'}
          </p>
        </div>

        {/* Search, Filter, and Sort */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <FilterListIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="relative">
            <SortIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortField(field as 'name' | 'date');
                setSortDirection(direction as 'asc' | 'desc');
              }}
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRequests.length > 0 && (
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => handleBulkAction('accept')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Accept Selected ({selectedRequests.length})
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Reject Selected ({selectedRequests.length})
            </button>
          </div>
        )}

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded text-purple-500 focus:ring-purple-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRequests(filteredRequests.map(r => r.id));
                      } else {
                        setSelectedRequests([]);
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {activeTab === 'events' ? 'Event Details' : 'Organization Details'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedRequests.includes(request.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRequests([...selectedRequests, request.id]);
                        } else {
                          setSelectedRequests(selectedRequests.filter(id => id !== request.id));
                        }
                      }}
                      className="rounded text-purple-500 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.name}</div>
                        {request.type === 'event' && (
                          <>
                            <div className="text-sm text-gray-500">Date: {request.eventDate}</div>
                            <div className="text-sm text-gray-500">Location: {request.eventLocation}</div>
                            <div className="text-sm text-gray-500">Price: {request.eventPrice}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {request.eventDescription}
                            </div>
                            <div className="text-sm text-gray-500">
                              Open for all: {request.isOpenForAll ? 'Yes' : 'No'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Likes: {request.likes} | Interested: {request.interested?.length || 0}
                            </div>
                            {request.tags && request.tags.length > 0 && (
                              <div className="text-sm text-gray-500">
                                Tags: {request.tags.join(', ')}
                              </div>
                            )}
                          </>
                        )}
                        {request.type === 'organization' && (
                          <>
                            <div className="text-sm text-gray-500">{request.email}</div>
                            <div className="text-sm text-gray-500">
                              {request.members?.length || 0} members
                            </div>
                          </>
                        )}
                        {request.rejectionReason && request.status === 'rejected' && (
                          <div className="text-sm text-red-500 mt-1">
                            Reason: {request.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      request.type === 'organization' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {request.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.submittedBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.submissionDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      request.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : request.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(request.id, 'accepted')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleStatusChange(request.id, 'rejected')}
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

        {/* Rejection Reason Modal */}
        {showRejectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-medium mb-4">Provide Rejection Reason</h3>
              <textarea
                className="w-full p-2 border rounded-md mb-4"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedRequests.length > 0) {
                      handleBulkAction('reject');
                    } else {
                      handleStatusChange(selectedRequestId, 'rejected');
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  disabled={!rejectionReason.trim()}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard; 