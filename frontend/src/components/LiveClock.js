import React, { useState, useEffect } from 'react';

export const formatLocalDate = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput;
  
  // If input string is 'YYYY-MM-DD', parse local date without UTC offset shifting
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

function LiveClock({ showTime = true, showDate = true, className = "" }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (d) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (d) => {
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={`live-clock-badge ${className}`}>
      <span className="live-clock-icon">🕒</span>
      {showDate && <span className="live-clock-date">{formatDate(time)}</span>}
      {showDate && showTime && <span className="live-clock-divider">•</span>}
      {showTime && <span className="live-clock-time">{formatTime(time)}</span>}
    </div>
  );
}

export default LiveClock;
