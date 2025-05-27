import React from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';

interface OrgData {
  status: string;
  rejectionReason?: string;
  name?: string;
  hasSeenAcceptance?: boolean;
}

const OrgStatus = () => {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [status, setStatus] = useState<string>('');
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOrgStatus = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'Users', user.uid));
        const userData = userDoc.data();

        if (userData?.role !== 'organization') {
          router.push('/login');
          return;
        }

        const orgDoc = await getDoc(doc(db, 'Organizations', userData.organizationId));
        const data = orgDoc.data();
        if (data) {
          setOrgData(data as OrgData);
          setStatus(data.status || 'pending');

          // If organization is accepted and hasn't seen the acceptance message,
          // show it and then mark it as seen
          if (data.status === 'accepted' && !data.hasSeenAcceptance) {
            // Wait for 3 seconds to show the congratulations message
            setTimeout(async () => {
              await updateDoc(doc(db, 'Organizations', userData.organizationId), {
                hasSeenAcceptance: true
              });
              router.push('/orgpage');
            }, 2000);
          } else if (data.status === 'accepted' && data.hasSeenAcceptance) {
            // If they've already seen the message, redirect directly
            router.push('/orgpage');
          }
        }
      } catch (error) {
        console.error('Error checking organization status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkOrgStatus();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-purple-400 via-fuchsia-500 to-indigo-700">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-purple-400 via-fuchsia-500 to-indigo-700">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="text-center">
          <img
            src="/assets/OMSLOGO.png"
            alt="OMS Logo"
            className="h-24 mx-auto mb-6"
          />
          
          {status === 'pending' && (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Application Under Review</h2>
              <p className="text-gray-600 mb-6">
                The admin is still processing your application. We'll notify you once a decision has been made.
              </p>
              <div className="animate-pulse bg-yellow-100 p-4 rounded-lg">
                <p className="text-yellow-800">Status: Pending</p>
              </div>
            </>
          )}

          {status === 'accepted' && !orgData?.hasSeenAcceptance && (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Congratulations!</h2>
              <p className="text-gray-600 mb-6">
                Your organization has been approved. You can now access your organization dashboard.
              </p>
              <div className="animate-pulse bg-green-100 p-4 rounded-lg">
                <p className="text-green-800">Redirecting to dashboard...</p>
              </div>
            </>
          )}

          {status === 'rejected' && (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Application Rejected</h2>
              <p className="text-gray-600 mb-6">
                We're sorry, but your organization application has been rejected.
              </p>
              {orgData?.rejectionReason && (
                <div className="bg-red-50 p-4 rounded-lg mb-6">
                  <p className="text-red-800">Reason: {orgData.rejectionReason}</p>
                </div>
              )}
              <button
                onClick={() => router.push('/login')}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Return to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrgStatus; 