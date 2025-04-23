import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth } from '../../firebaseConfig';
import { useRouter } from 'next/router';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { onAuthStateChanged } from 'firebase/auth';

interface Request {
  id: string;
  name: string;
  submittedBy: string;
  submissionDate: string;
  status: 'pending' | 'accepted' | 'rejected';
  type: 'organization' | 'event';
  description?: string;
  email?: string;
}

const AdminDashboard = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const router = useRouter();

  const fetchRequests = async () => {
    try {
      // Fetch pending organizations
      const orgsQuery = query(collection(db, 'Organizations'), where('status', '==', 'pending'));
      const orgsSnapshot = await getDocs(orgsQuery);
      const orgRequests = orgsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        submittedBy: doc.data().createdBy,
        submissionDate: doc.data().createdAt?.toDate().toLocaleDateString() || 'N/A',
        status: doc.data().status as 'pending' | 'accepted' | 'rejected',
        type: 'organization' as const,
        description: doc.data().description,
        email: doc.data().email
      }));

      // Fetch pending events
      const eventsQuery = query(collection(db, 'events'), where('status', '==', 'pending'));
      const eventsSnapshot = await getDocs(eventsQuery);
      const eventRequests = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().title,
        submittedBy: doc.data().createdBy,
        submissionDate: doc.data().createdAt?.toDate().toLocaleDateString() || 'N/A',
        status: doc.data().status as 'pending' | 'accepted' | 'rejected',
        type: 'event' as const,
        description: doc.data().description
      }));

      setRequests([...orgRequests, ...eventRequests]);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/admin/login');
        return;
      }

      // Check if user has admin role
      const userDoc = await getDoc(doc(db, 'Users', user.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        router.push('/admin/login');
        return;
      }

      // Fetch requests if user is admin
      fetchRequests();
    });

    return () => unsubscribe();
  }, [router]);

  const handleStatusChange = async (requestId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const docRef = doc(db, request.type === 'organization' ? 'Organizations' : 'events', requestId);
      await updateDoc(docRef, { status: newStatus });

      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: newStatus } : r
      ));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleBulkAction = async (action: 'accept' | 'reject') => {
    try {
      for (const requestId of selectedRequests) {
        const request = requests.find(r => r.id === requestId);
        if (!request) continue;

        const docRef = doc(db, request.type === 'organization' ? 'Organizations' : 'events', requestId);
        await updateDoc(docRef, { status: action === 'accept' ? 'accepted' : 'rejected' });
      }

      setRequests(requests.map(r => 
        selectedRequests.includes(r.id) 
          ? { ...r, status: action === 'accept' ? 'accepted' : 'rejected' } 
          : r
      ));
      setSelectedRequests([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">      
      <main className="flex-1 p-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-purple-700 hover:text-purple-900 mb-4"
          >
            <ArrowBackIcon className="mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
          <p className="text-gray-600">Manage organization registrations and event postings</p>
        </div>

        {/* Search and Filter */}
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
        </div>

        {/* Bulk Actions */}
        {selectedRequests.length > 0 && (
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => handleBulkAction('accept')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Accept Selected
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Reject Selected
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
                  Name
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
                    <div className="text-sm font-medium text-gray-900">{request.name}</div>
                    {request.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">{request.description}</div>
                    )}
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
      </main>
    </div>
  );
};

export default AdminDashboard; 