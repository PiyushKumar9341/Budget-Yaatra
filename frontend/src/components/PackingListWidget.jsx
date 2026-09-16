import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Luggage } from 'lucide-react';

export default function PackingListWidget({ destinationName, items = [] }) {
  const defaultItems = [
    "Government ID / Aadhar Card",
    "Power bank (10,000mAh+)",
    "Comfortable trekking shoes / sneakers",
    "Basic first-aid & personal meds",
    "Reusable water bottle",
    "Cash (at least ₹2,000 in small notes)"
  ];

  const combinedItems = Array.from(new Set([...items, ...defaultItems]));
  
  const [checkedState, setCheckedState] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem(`packing_${destinationName}`);
    if (saved) {
      try {
        setCheckedState(JSON.parse(saved));
      } catch (e) {}
    }
  }, [destinationName]);

  const toggleItem = (item) => {
    const updated = { ...checkedState, [item]: !checkedState[item] };
    setCheckedState(updated);
    localStorage.setItem(`packing_${destinationName}`, JSON.stringify(updated));
  };

  const completedCount = Object.values(checkedState).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / combinedItems.length) * 100);

  return (
    <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 shadow-xl my-6">
      <div className="flex items-center justify-between mb-4 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Luggage className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-100 text-base">Essential Packing Checklist</h3>
            <p className="text-xs text-stone-400">Tailored for {destinationName || 'your yatra'}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            {completedCount}/{combinedItems.length} Packed ({progressPercent}%)
          </span>
        </div>
      </div>

      <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden mb-4">
        <div 
          className="bg-emerald-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {combinedItems.map((item, idx) => {
          const isChecked = !!checkedState[item];
          return (
            <button
              key={idx}
              onClick={() => toggleItem(item)}
              className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                isChecked
                  ? 'bg-emerald-950/30 border-emerald-800/40 text-stone-400 line-through'
                  : 'bg-stone-800/40 border-stone-800 text-stone-200 hover:border-stone-700 hover:bg-stone-800/70'
              }`}
            >
              {isChecked ? (
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-stone-500 shrink-0" />
              )}
              <span className="truncate">{item}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
