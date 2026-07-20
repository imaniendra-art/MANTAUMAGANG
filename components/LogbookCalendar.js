"use client";
import React, { useState, useEffect } from 'react';

const LogbookCalendar = ({ tanggalMulai, tanggalSelesai, logbooks, onDateClick, selectedDate, rencanaKerja = [], onSaveRencana }) => {
  const [holidays, setHolidays] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(true);
  
  // Popover State for Rencana Kerja
  const [popoverDate, setPopoverDate] = useState(null);
  const [rencanaText, setRencanaText] = useState("");

  // Parse Logbook Dates to a Set for quick lookup
  const filledDates = new Set(logbooks.map(log => {
    const d = new Date(log.tanggal);
    // return YYYY-MM-DD local time
    const tzOffset = d.getTimezoneOffset() * 60000;
    return (new Date(d - tzOffset)).toISOString().split('T')[0];
  }));

  // Map of Rencana Kerja
  const rencanaMap = new Map(rencanaKerja.map(r => [r.tanggal, r.teks]));

  useEffect(() => {
    const fetchHolidays = async () => {
      if (!tanggalMulai) return;
      const startYear = new Date(tanggalMulai).getFullYear();
      const endYear = tanggalSelesai ? new Date(tanggalSelesai).getFullYear() : startYear;
      
      try {
        setLoadingHolidays(true);
        let allHolidays = [];
        
        for (let y = startYear; y <= endYear; y++) {
          const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${y}/ID`);
          if (res.ok) {
            const data = await res.json();
            allHolidays = [...allHolidays, ...data.map(h => ({ date: h.date, name: h.localName || h.name }))];
          }
        }
        setHolidays(allHolidays);
      } catch (e) {
        console.error("Failed to fetch holidays:", e);
      } finally {
        setLoadingHolidays(false);
      }
    };
    fetchHolidays();
  }, [tanggalMulai, tanggalSelesai]);

  const fallbackStart = new Date();
  fallbackStart.setDate(1);
  const fallbackEnd = new Date();
  fallbackEnd.setMonth(fallbackEnd.getMonth() + 1);
  fallbackEnd.setDate(0);

  const effectiveTanggalMulai = tanggalMulai || fallbackStart.toISOString().split('T')[0];
  const effectiveTanggalSelesai = tanggalSelesai || fallbackEnd.toISOString().split('T')[0];

  const getMonthsInRange = (start, end) => {
    const months = [];
    let current = new Date(start);
    current.setDate(1);
    const endMonth = new Date(end);
    endMonth.setDate(1);

    while (current <= endMonth) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  const months = getMonthsInRange(effectiveTanggalMulai, effectiveTanggalSelesai);
  const weekDays = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];

  const isHoliday = (dateString) => {
    return holidays.find(h => h.date === dateString);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden mt-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">📅 Kalender Magang</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Pantau hari kerja, logbook, dan buat rencana kerja untuk esok hari.</p>
      </div>

      {loadingHolidays && <p className="text-xs text-slate-400 mb-4 animate-pulse">Memuat kalender libur nasional...</p>}

      <div className="flex flex-col gap-6 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 pb-2">
        {months.map((monthDate, idx) => {
          const year = monthDate.getFullYear();
          const month = monthDate.getMonth();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const firstDay = new Date(year, month, 1).getDay(); 

          const days = [];
          for (let i = 0; i < firstDay; i++) {
            days.push(null);
          }
          for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
          }

          const monthName = monthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

          return (
            <div key={idx} className="bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 text-center mb-3">{monthName}</h4>
              <div className="grid grid-cols-7 gap-1 text-center">
                {weekDays.map((d, i) => (
                  <div key={i} className={`text-[10px] font-black pb-1 ${i === 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {d}
                  </div>
                ))}

                {days.map((day, dIdx) => {
                  if (!day) return <div key={`empty-${dIdx}`} className="p-2" />;

                  const tzOffset = day.getTimezoneOffset() * 60000;
                  const dateStr = (new Date(day - tzOffset)).toISOString().split('T')[0];

                  const isSunday = day.getDay() === 0;
                  const holidayInfo = isHoliday(dateStr);
                  const isRedDay = isSunday || !!holidayInfo;
                  const isFilled = filledDates.has(dateStr);
                  const isSelected = selectedDate === dateStr;
                  const isPastOrToday = day <= new Date();
                  const isWithinMagang = day >= new Date(tanggalMulai) && day <= new Date(tanggalSelesai);
                  
                  const rencanaTeks = rencanaMap.get(dateStr);

                  let bgClass = "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm";
                  let textClass = "text-slate-600 dark:text-slate-300 font-medium";
                  let hoverClass = "";
                  
                  if (isWithinMagang) {
                    if (isPastOrToday) {
                      hoverClass = "hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer hover:shadow-md hover:-translate-y-0.5";
                    } else {
                      hoverClass = "hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 cursor-pointer hover:shadow-md hover:-translate-y-0.5";
                    }
                  } else {
                    hoverClass = "opacity-50 cursor-not-allowed";
                  }

                  if (isFilled) {
                    bgClass = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50";
                    textClass = "text-emerald-700 dark:text-emerald-400 font-bold";
                  } else if (isRedDay) {
                    bgClass = "bg-red-50/50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50";
                    textClass = "text-red-600 dark:text-red-400 font-bold";
                  }

                  if (isSelected) {
                    bgClass = "bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-600/30";
                    textClass = "text-white font-bold";
                    hoverClass = "cursor-default";
                  }

                  let tooltip = dateStr;
                  if (rencanaTeks) tooltip = `Rencana: ${rencanaTeks}`;
                  else if (holidayInfo) tooltip = holidayInfo.name;

                  return (
                    <div 
                      key={dIdx} 
                      title={tooltip}
                      onClick={() => {
                        if (!isWithinMagang) return;
                        if (isPastOrToday) {
                          if (onDateClick) onDateClick(dateStr);
                        } else {
                          // Show Popover for Rencana Kerja (future dates only)
                          setPopoverDate(dateStr);
                          setRencanaText(rencanaMap.get(dateStr) || "");
                        }
                      }}
                      className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-[11px] transition-all duration-200 ${bgClass} ${textClass} ${hoverClass}`}
                    >
                      <span className="z-10">{day.getDate()}</span>
                      
                      {/* Tanda Logbook Terisi */}
                      {isFilled && !isSelected && <span className="absolute bottom-0.5 right-0.5 text-[8px] drop-shadow-sm">✅</span>}
                      
                      {/* Indikator Rencana Kerja (Biru) */}
                      {rencanaTeks && <span className="absolute top-1 right-1 text-[7px]" title={rencanaTeks}>🔵</span>}
                      
                      {/* Popover Form Rencana Kerja */}
                      {popoverDate === dateStr && (() => {
                        let popoverPos = "left-1/2 -translate-x-1/2";
                        const col = dIdx % 7;
                        if (col === 0 || col === 1) popoverPos = "left-0";
                        else if (col === 5 || col === 6) popoverPos = "right-0";
                        return (
                          <div 
                            className={`absolute z-50 bottom-full ${popoverPos} mb-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-3 animate-in zoom-in-95 cursor-auto`}
                            onClick={(e) => e.stopPropagation()} // Prevent closing/triggering date click again
                          >
                            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 mb-2 whitespace-nowrap">Ingin buat rencana kerja?</p>
                          <textarea 
                            autoFocus
                            value={rencanaText}
                            onChange={(e) => setRencanaText(e.target.value)}
                            className="w-full h-16 text-[10px] text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 p-1.5 border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:border-sky-500 mb-2 resize-none"
                            placeholder="Tulis rencana untuk hari ini..."
                          />
                          <div className="flex gap-1">
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setPopoverDate(null); }} 
                              className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded font-bold text-[9px]"
                            >
                              Batal
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => { 
                                e.stopPropagation();
                                if (onSaveRencana) onSaveRencana(dateStr, rencanaText);
                                setPopoverDate(null);
                              }} 
                              className="flex-1 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded font-bold text-[9px]"
                            >
                              Simpan
                            </button>
                          </div>
                          {/* Triangle Arrow */}
                          <div className={`absolute top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white dark:border-t-slate-800 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)] ${col === 0 || col === 1 ? 'left-6' : col === 5 || col === 6 ? 'right-6' : 'left-1/2 -translate-x-1/2'}`}></div>
                        </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-5 flex flex-wrap gap-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 justify-center">
        <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 text-[8px] flex items-center justify-center">✅</span> Terisi</div>
        <div className="flex items-center gap-1.5"><span className="text-[10px]">🔵</span> Ada Rencana</div>
        <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900/50"></span> Libur/Minggu</div>
      </div>
    </div>
  );
};

export default LogbookCalendar;
