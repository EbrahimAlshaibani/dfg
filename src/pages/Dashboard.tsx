import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Calendar, CheckCircle2, Clock, Users } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch upcoming meetings
        const meetingsRef = collection(db, 'meetings');
        const meetingsQuery = query(
          meetingsRef,
          where('attendees', 'array-contains', user.uid),
          where('status', '==', 'scheduled'),
          orderBy('date', 'asc'),
          limit(5)
        );
        const meetingsSnap = await getDocs(meetingsQuery);
        const meetingsData = meetingsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        
        // Filter for truly upcoming (today or future)
        const today = new Date().toISOString().split('T')[0];
        const upcoming = meetingsData.filter(m => m.date >= today);
        setUpcomingMeetings(upcoming);

        // Fetch pending action items
        const actionItemsRef = collection(db, 'actionItems');
        const actionItemsQuery = query(
          actionItemsRef,
          where('assigneeId', '==', user.uid),
          where('status', '==', 'pending'),
          limit(5)
        );
        const actionItemsSnap = await getDocs(actionItemsQuery);
        setActionItems(actionItemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.displayName?.split(' ')[0]}</h1>
        <p className="text-slate-500 mt-1">Here's what's happening with your meetings today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Cards */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Upcoming Meetings</p>
              <p className="text-2xl font-bold text-slate-900">{upcomingMeetings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Action Items</p>
              <p className="text-2xl font-bold text-slate-900">{actionItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <Clock className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Hours in Meetings</p>
              <p className="text-2xl font-bold text-slate-900">--</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Meetings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming Meetings</h2>
            <Link to="/meetings" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {upcomingMeetings.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">No upcoming meetings scheduled.</div>
            ) : (
              upcomingMeetings.map((meeting) => (
                <Link key={meeting.id} to={`/meetings/${meeting.id}`} className="block p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-slate-900">{meeting.title}</h3>
                      <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(parseISO(meeting.date), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {meeting.startTime} - {meeting.endTime}
                        </span>
                      </div>
                    </div>
                    <div className="flex -space-x-2">
                      {/* Placeholder for attendees avatars */}
                      <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-600">
                        {meeting.attendees?.length || 1}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Your Action Items</h2>
            <Link to="/action-items" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {actionItems.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">You're all caught up!</div>
            ) : (
              actionItems.map((item) => (
                <div key={item.id} className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                  <button className="mt-0.5 w-5 h-5 rounded border border-slate-300 flex-shrink-0 hover:border-indigo-500 transition-colors"></button>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.description}</p>
                    {item.dueDate && (
                      <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Due {format(parseISO(item.dueDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
