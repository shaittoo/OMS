import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, query, where, orderBy, getDocs, updateDoc, doc, writeBatch, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import MemberSidebar from "../components/membersidebar"; 
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const MemberNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const notificationsQuery = query(
        collection(db, "notifications"),
        where("recipientUid", "==", user.uid),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(notificationsQuery);
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
    setNotifications((prev) =>
      prev.map((notif) => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((notif) => !notif.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((notif) => {
      batch.update(doc(db, "notifications", notif.id), { read: true });
    });
    await batch.commit();
    setNotifications((prev) =>
      prev.map((notif) => !notif.read ? { ...notif, read: true } : notif)
    );
  };

  const markSelectedAsRead = async () => {
    if (selected.length === 0) return;
    const batch = writeBatch(db);
    selected.forEach((id) => {
      const notif = notifications.find((n) => n.id === id);
      if (notif && !notif.read) {
        batch.update(doc(db, "notifications", id), { read: true });
      }
    });
    await batch.commit();
    setNotifications((prev) =>
      prev.map((notif) => 
        selected.includes(notif.id) ? { ...notif, read: true } : notif
      )
    );
  };

  const deleteNotification = async (id: string) => {
    await deleteDoc(doc(db, "notifications", id));
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    setSelected((prev) => prev.filter((sid) => sid !== id));
  };

  const deleteSelectedNotifications = async () => {
    if (selected.length === 0) return;
    const batch = writeBatch(db);
    selected.forEach((id) => {
      batch.delete(doc(db, "notifications", id));
    });
    await batch.commit();
    setNotifications((prev) => prev.filter((notif) => !selected.includes(notif.id)));
    setSelected([]);
  };

  const deleteAllNotifications = async () => {
    if (notifications.length === 0) return;
    const batch = writeBatch(db);
    notifications.forEach((notif) => {
      batch.delete(doc(db, "notifications", notif.id));
    });
    await batch.commit();
    setNotifications([]);
    setSelected([]);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const allSelected = notifications.length > 0 && selected.length === notifications.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected([]);
    } else {
      setSelected(notifications.map((notif) => notif.id));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <MemberSidebar />
      <main className="ml-64 p-8">
        <div className="py-2">
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Notifications</h2>
          
          <div className="flex items-center space-x-3">
            {/* Mark as Read Group */}
            <div className="flex items-center space-x-2">
              <button
                onClick={markAllAsRead}
                disabled={notifications.every((notif) => notif.read)}
                className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-800 
                  disabled:text-purple-300 transition-colors duration-200"
              >
                Mark all as read
              </button>
              {selected.length > 0 && (
                <button
                  onClick={markSelectedAsRead}
                  disabled={selected.every(id => notifications.find(n => n.id === id)?.read)}
                  className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-800 
                    disabled:text-purple-300 transition-colors duration-200"
                >
                  Mark selected as read
                </button>
              )}
            </div>

            {/* Delete Group - with separator */}
            <div className="flex items-center space-x-2 pl-3 border-l border-gray-200">
              <button
                onClick={deleteSelectedNotifications}
                disabled={selected.length === 0}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 
                  disabled:text-red-300 transition-colors duration-200"
              >
                Delete selected
              </button>
              <button
                onClick={deleteAllNotifications}
                disabled={notifications.length === 0}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 
                  disabled:text-red-300 transition-colors duration-200"
              >
                Delete all
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-gray-600">No notifications.</p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className={`p-3 rounded border flex items-start ${
                  notif.read ? "bg-gray-100 border-gray-300" : "bg-purple-100 border-purple-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(notif.id)}
                  onChange={() => toggleSelect(notif.id)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    {notif.orgProfilePic && (
                      <img
                        src={notif.orgProfilePic}
                        alt={notif.orgName || "Organization"}
                        className="w-8 h-8 rounded-full mr-3 border border-gray-300 object-cover"
                      />
                    )}
                    <span className="font-semibold text-purple-700">{notif.orgName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{notif.message}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {notif.timestamp?.toDate?.().toLocaleString?.() || ""}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

export default MemberNotifications;