import { useState, createContext, useContext, useEffect, useCallback } from "react";

const UIStateContext = createContext();

export function useUIState() {
	return useContext(UIStateContext);
}

export default function UIStateProvider({ children }) {

	const [ isGroupChatOpen, setIsGroupChatOpen ] = useState(false);
	const [ isReactionDrawerOpen, setIsReactionDrawerOpen ] = useState(false);
	
	const [currentChatId, setCurrentChatId] = useState(() => {
		// Initialize from localStorage if available
		return localStorage.getItem('currentChatId') || null;
	  });
	
	  // Update localStorage whenever currentChatId changes
	  useEffect(() => {
		console.log("Updating localStorage for currentChatId:", currentChatId);
		if (currentChatId) {
			localStorage.setItem('currentChatId', currentChatId);
		} else {
			localStorage.removeItem('currentChatId');
		}
	}, [currentChatId]);
	
	

	const [currentUserId, setCurrentUserId] = useState(() => {
		// Initialize from localStorage if available
		return localStorage.getItem('currentUserId') || null;
	  });
	
	  // Update localStorage whenever currentChatId changes
	  useEffect(() => {
		if (currentUserId) {
		  localStorage.setItem('currentUserId', currentUserId);
		} else {
		  localStorage.removeItem('currentUserId'); // Clear storage if no chat ID
		}
	  }, [currentUserId]);

	
	

	

	return (
		<UIStateContext.Provider
			value={{
				currentChatId,
				setCurrentChatId,	
				currentUserId,
				setCurrentUserId,
				isGroupChatOpen,
				setIsGroupChatOpen,		
				isReactionDrawerOpen,
				setIsReactionDrawerOpen,
			}}
		>
			{children}
		</UIStateContext.Provider>
	);
}