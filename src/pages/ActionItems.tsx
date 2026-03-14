import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CheckSquare, Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

export default function ActionItems() {
  const { user } = useAuth();
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchActionItems = async () => {
      try {
        const actionItemsRef = collection(db, 'actionItems');
        const q = query(
          actionItemsRef,
          where('assigneeId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        
        // Fetch meeting details for each action item
        const itemsWithMeetings = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            let meetingTitle = 'Unknown Meeting';
            try {
              const meetingRef = doc(db, 'meetings', data.meetingId);
              const meetingSnap = await getDocs(query(collection(db, 'meetings'), where('__name__', '==', data.meetingId)));
              if (!meetingSnap.empty) {
                meetingTitle = meetingSnap.docs[0].data().title;
              }
            } catch (e) {
              console.error(e);
            }
            return { id: docSnap.id, ...data, meetingTitle };
          })
        );

        setActionItems(itemsWithMeetings);
      } catch (error) {
        console.error('Error fetching action items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActionItems();
  }, [user]);

  const toggleStatus = async (itemId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
      await updateDoc(doc(db, 'actionItems', itemId), {
        status: newStatus
      });
      setActionItems(actionItems.map(item => 
        item.id === itemId ? { ...item, status: newStatus } : item
      ));
    } catch (error) {
      console.error('Error updating action item:', error);
    }
  };

  const pendingItems = actionItems.filter(item => item.status === 'pending');
  const completedItems = actionItems.filter(item => item.status === 'completed');

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Action Items</h1>
        <p className="text-slate-500 mt-1 text-sm">Track tasks assigned to you across all meetings.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-600" />
            Pending Tasks ({pendingItems.length})
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          ) : pendingItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500">You have no pending action items.</div>
          ) : (
            pendingItems.map((item) => (
              <div key={item.id} className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors group">
                <button 
                  onClick={() => toggleStatus(item.id, item.status)}
                  className="mt-0.5 w-5 h-5 rounded border border-slate-300 flex items-center justify-center flex-shrink-0 hover:border-indigo-500 transition-colors"
                ></button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{item.description}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    <Link to={`/meetings/${item.meetingId}`} className="hover:text-indigo-600 font-medium truncate">
                      From: {item.meetingTitle}
                    </Link>
                    {item.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Due {format(parseISO(item.dueDate), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {completedItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden opacity-75">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-600" />
              Completed Tasks ({completedItems.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {completedItems.map((item) => (
              <div key={item.id} className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                <button 
                  onClick={() => toggleStatus(item.id, item.status)}
                  className="mt-0.5 w-5 h-5 rounded border border-indigo-600 bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 hover:bg-indigo-700 transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-500 line-through">{item.description}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                    <Link to={`/meetings/${item.meetingId}`} className="hover:text-indigo-600 font-medium truncate">
                      From: {item.meetingTitle}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
