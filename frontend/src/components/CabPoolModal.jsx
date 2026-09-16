import React, { useState, useEffect } from 'react';
import { X, Users, Car, Calendar, PlusCircle, UserCheck, MessageSquare } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8001';

export default function CabPoolModal({ destinationSlug, destinationName, isOpen, onClose }) {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joiningPoolId, setJoiningPoolId] = useState(null);

  // Form State
  const [fromLoc, setFromLoc] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [seatsTotal, setSeatsTotal] = useState(4);
  const [costPerSeat, setCostPerSeat] = useState(500);
  const [creatorName, setCreatorName] = useState('');
  const [creatorContact, setCreatorContact] = useState('');
  const [note, setNote] = useState('');

  // Join state
  const [joinName, setJoinName] = useState('');
  const [joinContact, setJoinContact] = useState('');

  const fetchPools = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/cab-pools`, {
        params: { destination_slug: destinationSlug }
      });
      setPools(res.data);
    } catch (e) {
      console.error("Failed to load cab pools", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPools();
    }
  }, [isOpen, destinationSlug]);

  const handleCreatePool = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/api/cab-pools`, {
        destination_slug: destinationSlug,
        destination_name: destinationName,
        from_location: fromLoc,
        to_location: toLoc,
        date: travelDate,
        seats_total: parseInt(seatsTotal),
        seats_open: parseInt(seatsTotal) - 1,
        cost_per_seat: parseInt(costPerSeat),
        creator_name: creatorName,
        creator_contact: creatorContact,
        note: note
      });
      setShowCreateForm(false);
      fetchPools();
    } catch (e) {
      alert("Failed to post ride share request. Please try again.");
    }
  };

  const handleJoinPool = async (poolId) => {
    if (!joinName || !joinContact) {
      alert("Please enter your name and contact info!");
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/api/cab-pools/${poolId}/join`, {
        user_name: joinName,
        user_contact: joinContact,
        seats_requested: 1
      });
      setJoiningPoolId(null);
      setJoinName('');
      setJoinContact('');
      fetchPools();
    } catch (e) {
      alert(e.response?.data?.detail || "Failed to join cab pool");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-100">Yaatri Pool & Cab Share</h2>
              <p className="text-xs text-stone-400">Share taxis & split travel costs in {destinationName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">

          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-stone-200 text-sm">
              Active Rides ({pools.length})
            </h3>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition"
            >
              <PlusCircle className="w-4 h-4" />
              {showCreateForm ? 'View Rides' : 'Post Cab Share Request'}
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <form onSubmit={handleCreatePool} className="bg-stone-850 p-4 border border-stone-800 rounded-xl space-y-3">
              <h4 className="text-sm font-semibold text-emerald-400">Create a New Cab Sharing Request</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-stone-400 block mb-1">From Location</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Guwahati Railway Station"
                    value={fromLoc}
                    onChange={e => setFromLoc(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 text-stone-100 px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">To Location</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Cherrapunji / Nongriat"
                    value={toLoc}
                    onChange={e => setToLoc(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 text-stone-100 px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Date of Travel</label>
                  <input 
                    required
                    type="date"
                    value={travelDate}
                    onChange={e => setTravelDate(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 text-stone-100 px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Cost Per Seat (₹)</label>
                  <input 
                    required
                    type="number"
                    value={costPerSeat}
                    onChange={e => setCostPerSeat(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 text-stone-100 px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Your Name</label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={creatorName}
                    onChange={e => setCreatorName(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 text-stone-100 px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Phone / WhatsApp</label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={creatorContact}
                    onChange={e => setCreatorContact(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 text-stone-100 px-3 py-2 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-400 block mb-1 text-xs">Note / Details</label>
                <input 
                  type="text"
                  placeholder="e.g. Leaving at 7 AM sharp, luggage space for 1 bag each"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 text-stone-100 px-3 py-2 rounded-lg text-xs"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 font-semibold text-white rounded-lg text-xs transition"
              >
                Post Ride Request
              </button>
            </form>
          )}

          {/* List of Pools */}
          {loading ? (
            <div className="py-8 text-center text-stone-500 text-sm">Loading active cab pools...</div>
          ) : pools.length === 0 ? (
            <div className="py-8 text-center text-stone-500 text-sm border border-dashed border-stone-800 rounded-xl">
              No active rides posted for {destinationName} yet. Be the first to post!
            </div>
          ) : (
            <div className="space-y-3">
              {pools.map(p => (
                <div key={p.pool_id} className="p-4 bg-stone-800/40 border border-stone-800 rounded-xl space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-stone-100 font-semibold text-sm">
                        <span>{p.from_location}</span>
                        <span className="text-emerald-400">➔</span>
                        <span>{p.to_location}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-stone-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-500" />
                          {p.date}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          ₹{p.cost_per_seat} / seat
                        </span>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-stone-800 border border-stone-700 text-amber-300 font-medium">
                      {p.seats_open} seats open
                    </span>
                  </div>

                  {p.note && <p className="text-xs text-stone-300 italic bg-stone-900/50 p-2 rounded-lg">{p.note}</p>}

                  <div className="flex items-center justify-between pt-2 border-t border-stone-800/60 text-xs">
                    <div className="text-stone-400">
                      Posted by <strong className="text-stone-200">{p.creator_name}</strong> ({p.creator_contact})
                    </div>
                    
                    {joiningPoolId === p.pool_id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          placeholder="Your Name" 
                          value={joinName} 
                          onChange={e => setJoinName(e.target.value)}
                          className="bg-stone-900 border border-stone-700 px-2 py-1 rounded text-stone-200 text-xs"
                        />
                        <input 
                          type="text" 
                          placeholder="Phone / WP" 
                          value={joinContact} 
                          onChange={e => setJoinContact(e.target.value)}
                          className="bg-stone-900 border border-stone-700 px-2 py-1 rounded text-stone-200 text-xs"
                        />
                        <button 
                          onClick={() => handleJoinPool(p.pool_id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded text-xs"
                        >
                          Confirm
                        </button>
                      </div>
                    ) : (
                      p.seats_open > 0 ? (
                        <button 
                          onClick={() => setJoiningPoolId(p.pool_id)}
                          className="px-3 py-1 bg-amber-600/80 hover:bg-amber-500 text-white rounded font-medium transition text-xs"
                        >
                          Join Ride
                        </button>
                      ) : (
                        <span className="text-stone-500 font-medium">Ride Full</span>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
