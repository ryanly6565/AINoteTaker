'use client'

import { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export function ChatProvider({ children }) {
    const [history, setHistory] = useState([]);

    const addToHistory = (entry) => {
        setHistory(prevHistory => [entry, ...prevHistory]);
    };

    const clearHistory = () => {
        setHistory([]);
    };

    return (
        <ChatContext.Provider value={{
            history,
            addToHistory,
            clearHistory
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
} 