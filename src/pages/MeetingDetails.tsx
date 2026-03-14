import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Calendar, Clock, Users, FileText, CheckSquare, ArrowLeft, Plus, Save } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function MeetingDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<any>(null);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [notes, setNotes] = useState('');
  const [agenda, setAgenda] = useState('');
  const [newActionItem, setNewActionItem] = useState('');

  useEffect(() => {
    if (!id || !user) return;

    const fetchMeetingDetails = async () => {
      try {
        const meetingRef = doc(db, 'meetings', id);
        const meetingSnap = await getDoc(meetingRef);
        
        if (meetingSnap.exists()) {
          const data = meetingSnap.data();
          setMeeting({ id: meetingSnap.id, ...data });
          setNotes(data.notes || '');
          setAgenda(data.agenda || '');
        } else {
          navigate('/meetings');
          return;
        }

        const actionItemsRef = collection(db, 'actionItems');
        const q = query(actionItemsRef, where('meetingId', '==', id));
        const actionItemsSnap = await getDocs(q);
        setActionItems(actionItemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error('Error fetching meeting details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetingDetails();
  }, [id, user, navigate]);

  const handleSaveNotes = async () => {
    if (!id || !user) return;
    setSaving(true);
    try {
      const meetingRef = doc(db, 'meetings', id);
      await updateDoc(meetingRef, {
        notes,
        agenda,
        updatedAt: serverTimestamp()
      });
      alert('Saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddActionItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !newActionItem.trim()) return;
    
    try {
      const docRef = await addDoc(collection(db, 'actionItems'), {
        meetingId: id,
        description: newActionItem,
        assigneeId: user.uid, // Default to self for now
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      setActionItems([...actionItems, {
        id: docRef.id,
        meetingId: id,
        description: newActionItem,
        assigneeId: user.uid,
        status: 'pending'
      }]);
      setNewActionItem('');
    } catch (error) {
      console.error('Error adding action item:', error);
    }
  };

  const toggleActionItemStatus = async (itemId: string, currentStatus: string) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!meeting) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/meetings')}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Meetings
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{meeting.title}</h1>
              {meeting.description && (
                <p className="mt-2 text-slate-600 max-w-2xl">{meeting.description}</p>
              )}
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize
              ${meeting.status === 'scheduled' ? 'bg-blue-50 text-blue-700' : ''}
              ${meeting.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : ''}
              ${meeting.status === 'cancelled' ? 'bg-red-50 text-red-700' : ''}
            `}>
              {meeting.status}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              {format(parseISO(meeting.date), 'EEEE, MMMM d, yyyy')}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              {meeting.startTime} - {meeting.endTime}
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              {meeting.attendees?.length || 1} Attendees
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Main Content: Agenda & Notes */}
          <div className="lg:col-span-2 p-6 sm:p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Meeting Content
              </h2>
              <button 
                onClick={handleSaveNotes}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Agenda</label>
                <textarea
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="What will be discussed?"
                  className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Meeting Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Take notes during the meeting..."
                  className="w-full h-64 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Sidebar: Action Items */}
          <div className="p-6 sm:p-8 bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-6">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              Action Items
            </h2>

            <form onSubmit={handleAddActionItem} className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={newActionItem}
                  onChange={(e) => setNewActionItem(e.target.value)}
                  placeholder="Add new action item..."
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                />
                <button 
                  type="submit"
                  disabled={!newActionItem.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-indigo-600 hover:bg-indigo-50 rounded-md disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {actionItems.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No action items yet.</p>
              ) : (
                actionItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      item.status === 'completed' 
                        ? 'bg-slate-50 border-slate-200 opacity-60' 
                        : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'
                    }`}
                  >
                    <button 
                      onClick={() => toggleActionItemStatus(item.id, item.status)}
                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        item.status === 'completed'
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 hover:border-indigo-500'
                      }`}
                    >
                      {item.status === 'completed' && <CheckSquare className="w-3.5 h-3.5" />}
                    </button>
                    <p className={`text-sm ${item.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-700'}`}>
                      {item.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
