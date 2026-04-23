'use client'

import { createContext, useContext, useState, useEffect } from 'react';
import {useAuth} from "@/context/AuthContext";

const NotesContext = createContext();

interface Tag {
  id: number;
  ownerId: number;
  name: string;
  notes?: {title:string};
}

export function NotesProvider({ children }) {
    const [notes, setNotes] = useState<any[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [initialLoad, setInitialLoad] = useState(true);
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [openedNotesIds, setOpenedNoteIds] = useState([]);

    // Use computed variable for activeNote and openedNotes to avoid having to update
    const activeNote = (notes.length && activeNoteId) ? notes.find((note) => note.id === activeNoteId) : null;
    const openedNotes = openedNotesIds.map(id => notes.find((note) => note.id === id)).filter(Boolean);

    const { user } = useAuth();

    const fetchNotes = async () => {
        try {
            const response = await fetch(`/api/notes/getAll`);
            if (response.ok) {
                const data = await response.json();
                console.log("Backend response:", data);
                setNotes(data.notes);
                // Extract unique tags from notes
                setTags(data.tags);
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
        }
        setInitialLoad(false);
    };

    const createNote = async (noteData) => {
        const response = await fetch('/api/notes/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(noteData),
        });

        if (response.ok) {
            const newNote = await response.json();
            setNotes(prevNotes => [ newNote, ...prevNotes]);
            return newNote;
        }
        throw new Error('Failed to create note');
    };

    const createTag = async (name: string) => {
        try {
            if (!user?.isLoggedIn) {
                throw new Error('User not logged in');
            }

            const response = await fetch('/api/tags/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                throw new Error('Failed to create tag');
            }

            const newTag = await response.json();

            setTags(prev => [...prev, newTag]);

            return newTag;
        } catch (error) {
            console.error('Error creating tag:', error);
            throw error;
        }
    };

    /** Opens a note as the active note and adds it to the list of opened notes **/
    const openNote = (noteId) => {
        const matchingNote = notes.find((n) => noteId === n.id);
        if (!matchingNote) {
            return;
        }

        // Add to list of opened notes if not already there and set as active
        if (!openedNotes.find((note) => note.id === noteId)) {
            setOpenedNoteIds(prev => [...prev, noteId]);
        }
        setActiveNoteId(matchingNote.id);
    }

    /** Closes a note with the given id, removing it as the active note and from the list of opened notes **/
    const closeNote = (noteId) => {
        // Verify note is opened
        const noteIndex = openedNotesIds.indexOf(noteId);
        if (noteIndex === -1) {
            return;
        }

        // If it isn't the active note, simply remove it from the list of opened notes
        if (activeNoteId !== noteId) {
            setOpenedNoteIds(prev => prev.filter(id => id !== noteId));
            return;
        }

        // Otherwise, need to set a new note as active (if possible)
        if (openedNotesIds.length === 1) {
            // No other notes available, reset everything to default
            setOpenedNoteIds([]);
            setActiveNoteId(null);
        } else {
            // Choose previous note if it exists, otherwise next one as new active note
            const nextIndex = noteIndex > 0 ? noteIndex - 1: noteIndex + 1;
            const newActiveNoteId = openedNotesIds[nextIndex];
            setOpenedNoteIds(prev => prev.filter(id => id !== noteId));
            setActiveNoteId(newActiveNoteId);
        }
    }

    // Declare one update function for automatic in-memory updates, and the other for persisting changes to DB
    const updateNoteLocally = (noteData: any) => {
        console.log("SELECTED VALUES:", noteData);
        setNotes((prevNotes: any) =>
            prevNotes.map((note: any) => {
                if (note.id !== noteData.id) return note;

                console.log("SELECTED VALUES 12:", note.tags)

                return {
                    ...note,
                    ...noteData,
                    tags: noteData.tags ?? []
                };
            })
        );

        if (activeNoteId === noteData.id) {
            setActiveNoteId(noteData.id);
        }
    };

    /* Update note in DB - Call periodically to persist changes */
    const updateNoteInDB = async (noteData) => {
        const safeNoteData = {
            ...noteData,
            tags: noteData.tags
        };

        const response = await fetch('/api/notes/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(safeNoteData),
        });

        if (response.ok) {
            const updatedNote = await response.json();

            setNotes((prevNotes) =>
            prevNotes.map((note) =>
                note.id === updatedNote.id ? updatedNote : note
            )
            );
            return updatedNote;
        }

        throw new Error('Failed to update note');
    };

    const resetContext = () => {
        setNotes([]);
        setActiveNoteId(null);
        setInitialLoad(true);
    };

    const deleteNote = (noteId) => {
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
    };

    const exportNote = async (noteId, format = 'pdf') => {
        try {
            const response = await fetch('/api/notes/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ noteId, format })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to export note');
            }

            // Create a temporary link to trigger download
            const link = document.createElement('a');
            link.href = data.file;
            link.download = data.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            return true;
        } catch (error) {
            console.error('Export Note Error:', error);
            return error;
        }
    };
    

    useEffect(() => {
        fetchNotes()
    }, []);

    const revertDeletion = async (noteId, newTag) => {
        const response = await fetch('/api/notes/undoMarkDeletion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ noteId, newTag }),
        });

        if (response.ok) {
            const updatedNote = await response.json();
            setNotes(prevNotes =>
                prevNotes.map(note =>
                note.id === updatedNote.id ? updatedNote : note
                )
            );
            return updatedNote;
        }
        throw new Error('Failed to revert note deletion');
    };

    return (
        <NotesContext.Provider value={{
            initialLoad,
            notes,
            tags,
            createNote,
            createTag,
            updateNoteLocally,
            updateNoteInDB,
            fetchNotes,
            activeNote,
            setActiveNoteId,
            deleteNote,
            openNote,
            closeNote,
            openedNotes,
            resetContext, 
            exportNote,
            revertDeletion
        }}>
            {children}
        </NotesContext.Provider>
    );
}

export function useNotes() {
    const context = useContext(NotesContext);
        if (!context) {
            throw new Error('useNotes must be used within a NotesProvider');
        }
    return context;
}
