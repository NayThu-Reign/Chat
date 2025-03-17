import { useState, useEffect } from 'react';

import {
    Typography
} from "@mui/material"

// Helper function to calculate time ago
function timeAgo(logoutTime) {
  if(!logoutTime) return ""
  
  const logoutDate = new Date(logoutTime);

  const now = new Date();
  const diffInSeconds = Math.floor((now - logoutDate) / 1000);

  const seconds = 60;
  const minutes = 60;
  const hours = 24;
  const days = 30;
  const months = 12;

  if (diffInSeconds < seconds) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < seconds * minutes) {
    const mins = Math.floor(diffInSeconds / seconds);
    return mins === 1 ? '1 minute ago' : `${mins} minutes ago`;
  } else if (diffInSeconds < seconds * minutes * hours) {
    const hrs = Math.floor(diffInSeconds / (seconds * minutes));
    return hrs === 1 ? '1 hour ago' : `${hrs} hours ago`;
  } else if (diffInSeconds < seconds * minutes * hours * days) {
    const daysAgo = Math.floor(diffInSeconds / (seconds * minutes * hours));
    return daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
  } else if (diffInSeconds < seconds * minutes * hours * days * months) {
    const monthsAgo = Math.floor(diffInSeconds / (seconds * minutes * hours * days));
    return monthsAgo === 1 ? '1 month ago' : `${monthsAgo} months ago`;
  } else {
    const yearsAgo = Math.floor(diffInSeconds / (seconds * minutes * hours * days * months));
    return yearsAgo === 1 ? '1 year ago' : `${yearsAgo} years ago`;
  }
}

// Component to display the time ago for a given logoutTime
export default function TimeAgo({ logoutTime }) {
  const [timeAgoString, setTimeAgoString] = useState(() => timeAgo(logoutTime));

  useEffect(() => {
    const updateTime = () => {
      setTimeAgoString(timeAgo(logoutTime));
    };

    // Update every 60 seconds (60000 milliseconds)
    const intervalId = setInterval(updateTime, 60000);

    // Call initially to set the correct time when the component mounts
    updateTime();

    // Cleanup the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [logoutTime]);

  return (
    <Typography
      sx={{
        fontSize: '14px',
        fontWeight: '400',
        color: '#A8A8A8',
      }}
    >
      {timeAgoString}
    </Typography>
  );
}

