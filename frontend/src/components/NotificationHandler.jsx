// src/components/NotificationHandler.js
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useUIState } from '../providers/UIStateProvider';

const socket = io(import.meta.env.VITE_API_URL, {
  withCredentials: true,
});

socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from server:', reason);
});


export default function NotificationHandler() {
  const { authUser } = useAuth();
  const { currentChatId, setCurrentChatId } = useUIState();
  const [unreadMentions, setUnreadMentions] = useState({});
  const navigate = useNavigate();
  let isTabActive = true;

  console.log("currentChatId", currentChatId)

  // Track tab visibility
  const handleVisibilityChange = () => {
    isTabActive = !document.hidden;
  };

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then((permission) => {
        console.log("Notification permission:", permission);
      });
    }
  }, []);

  // Handle new message notifications
  useEffect(() => {
    const handleNewMessage = (message, sender, notiChat) => {
      if (!authUser) return;

      console.log("Mention here", notiChat)

      const participantIds = notiChat.participants?.map(p => p.employeeId) || [];
      const isParticipant = participantIds.includes(authUser.staff_code);
      const isMuted = notiChat.mutedBy?.includes(authUser.staff_code);
      const isSender = sender.employeeId === authUser.staff_code;

      if (isParticipant && !isSender && !isMuted) {
        const isMention = message.mentions?.includes(authUser.staff_code);
        console.log("isMention", isMention)
        
        if (!isTabActive || notiChat.id !== Number(currentChatId)) {
          showNotification(message, sender, notiChat);
          
          if (isMention) {
            // playMentionSound();
            updateMentionBadge(notiChat.id);
          }
        }
      }
    };

    socket.on('notiMessage', handleNewMessage);
    return () => socket.off('notiMessage', handleNewMessage);
  }, [authUser, currentChatId]);

  // Handle direct mention notifications
  useEffect(() => {
    const handleNewMention = (data) => {
      if (authUser?.staff_code === data.mentionedUser) {
        showMentionNotification(data);
        updateMentionBadge(data.chatId);
        
        // if (!document.hidden) {
        //   playMentionSound();
        // }
      }
    };

    socket.on('newMention', handleNewMention);
    return () => socket.off('newMention', handleNewMention);
  }, [authUser]);

  // Notification display functions
  const showNotification = (message, sender, notiChat) => {
    if (Notification.permission !== 'granted') return;
    const isMention = message.mentions?.includes(authUser.staff_code);
        console.log("isMention", isMention)

    const title = isMention 
      ? `You were mentioned by ${sender.userfullname}`
      : `${sender.userfullname} sent a message${notiChat.name ? ` in ${notiChat.name}` : ''}`;

    const notification = new Notification(title, {
      body: isMention ? 'Click to view the mention' : message.text_content || 'Media message',
      // icon: sender.user_photo || '/default-avatar.png',
      data: {
        chatId: notiChat.id,
        messageId: message.id
      }
    });

    notification.onclick = () => {
      handleNotificationClick(notiChat.id, message.id);
    };
  };

  const showMentionNotification = (data) => {
    if (Notification.permission !== 'granted' || document.hidden) return;

    const notification = new Notification('You were mentioned', {
      body: 'Click to view the mention',
      // icon: '/mention-icon.png',
      data: {
        chatId: data.chatId,
        messageId: data.messageId
      }
    });

    notification.onclick = () => {
      handleNotificationClick(data.chatId, data.messageId);
    };
  };

  
  const handleNotificationClick = (chatId, messageId) => {
    window.focus();
    setCurrentChatId(chatId);
    navigate('/conversation');
    
    // Scroll to message after navigation
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth' });
        messageElement.classList.add('mention-highlight');
      }
    }, 500);
  };

  // Audio handling
  // const playMentionSound = () => {
  //   const audio = new Audio(notiSound);
  //   audio.play().catch(error => console.error('Audio play failed:', error));
  // };

  // Badge counter management
  const updateMentionBadge = (chatId) => {
    setUnreadMentions(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || 0) + 1
    }));
  };

  return null;
}