import { useState } from 'react';
import {AppShellNavbar, Button, Divider, NavLink, Skeleton, ScrollArea} from '@mantine/core';
import { useNotes } from '../context/NotesContext';
import {IconHome2, IconPlus, IconTrash, IconTag} from "@tabler/icons-react";
import {notifications} from "@mantine/notifications";
import { useRouter } from 'next/navigation';
import {useAuth} from "../context/AuthContext";

export default function Sidebar({ opened }) {
    const [expandedTags, setExpandedTags] = useState({});
    const { notes, tags, activeNote, createNote, createTag, openNote, initialLoad, setActiveNoteId, updateNoteInDB } = useNotes();
    const { user } = useAuth();
    const router = useRouter();

    // Sort notes by tag 
    const notesByTag = notes?.length > 0 ? Object.groupBy(notes, note => note.tag) : {};

    const toggleTag = (tag) => {
        setExpandedTags(prev => ({
            ...prev,
            [tag]: !prev[tag]
        }));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e, targetTag) => {
        e.preventDefault();
        e.stopPropagation();
        
        const noteId = e.dataTransfer.getData('noteId');
        if (!noteId) return;

        try {
            const note = notes.find(n => n.id === parseInt(noteId));
            if (!note) return;

            await updateNoteInDB({
                ...note,
                tag: parseInt(targetTag)
            });

            notifications.show({
                color: 'green',
                title: 'Success',
                message: `Note moved to Tag ${targetTag}`,
                position: "top-center"
            });
        } catch (error) {
            console.error('Error updating note tag:', error);
            notifications.show({
                color: 'red',
                title: 'Error',
                message: 'Failed to update note tag',
                position: "top-center"
            });
        }
    };

    const handleNoteDragStart = (e, noteId) => {
        e.dataTransfer.setData('noteId', noteId.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleNoteClick = (e, noteId) => {
        // Prevent opening the note if we're dragging
        if (e.detail === 1) {
            openNote(noteId);
        }
    };

    const handleCreateTag = async () => {
        // Verify user is logged in
        if (!user.isLoggedIn) {
            alert('Please log in to create tags');
            router.push('/login');
            return;
        }

        try {
            const usedNumbers = tags
                .map(tag => {
                    const match = tag.name.match(/^Tag (\d+)$/);
                    return match ? parseInt(match[1]) : null;
                })
                .filter(n => n !== null);

            const nextNumber =
                usedNumbers.length > 0
                    ? Math.max(...usedNumbers) + 1
                    : 1;
            
            const defaultName = `Tag ${nextNumber}`;
            
            await createTag(defaultName);
            notifications.show({
                color: 'green',
                title: 'Success',
                message: 'New tag created successfully',
                position: "top-center"
            });
        } catch (error) {
            console.error(error);
            notifications.show({
                color: 'red',
                title: 'Error',
                message: "Sorry, there was an issue creating your tag.",
                position: "top-center"
            });
        }
    }
    const handleCreateNote = async () => {
        // Verify user is logged in
        if (!user.isLoggedIn) {
          alert('Please log in to create notes');
          router.push('/login');  // Redirect to login if no user ID
          return;
        }
    
        // Check if there are any existing tags
        if (tags.length === 0) {
          notifications.show({
            color: 'yellow',
            title: 'No Tags Available',
            message: 'Please create a tag first using the "New Tag" button in the sidebar.',
            position: "top-center"
          });
          return;
        }
    
        // Make API call to create empty note with the first available tag
        try {
          const createdNote = await createNote({
            title: '',
            content: '',
            tag: tags[0], // Use the first available tag
            canDelete: false
          });
          openNote(createdNote.id);
        } catch (error) {
          console.error(error);
          notifications.show({
            color: 'red',
            title: 'Error',
            message: "Sorry, there was an issue creating your note.",
            position: "top-center"
          })
        }
      };

    if (!opened) {
        return null;
    }

    return (
        <AppShellNavbar p="md" style={{ height: "93vh", overflow: 'auto' }}>
            <Button
                size="sm"
                variant="filled"
                color="blue"
                leftSection={<IconTag size={16} />}
                mb="md"
                onClick={handleCreateTag}
                style={{ flexShrink: 0 }} 
            >
                New Tag
            </Button>
            <Button
                size="sm"
                variant="filled"
                color="blue"
                leftSection={<IconPlus size={16} />}
                mb="md"
                onClick={handleCreateNote}
                style={{ flexShrink: 0 }} 
            >
                New Note
            </Button>

            <NavLink
                label="Home"
                key={"Home"}
                leftSection={<IconHome2 />}
                onClick={() => setActiveNoteId(null)}
                active={!activeNote}
            />
            <Divider mt="sm"/>

            {initialLoad ? (
                Array(8)
                    .fill(0)
                    .map((_, index) => (
                        <Skeleton key={index} h={32} mt="sm" animate={true} />
                    ))
            ): (
                <>
                    {/* Garbage Tag */}
                    <NavLink
                        key="-1"
                        label="Garbage"
                        rightSection={<IconTrash />}
                        opened={expandedTags[-1]}
                        onClick={() => toggleTag(-1)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, -1)}
                        style={{
                            cursor: 'pointer',
                            backgroundColor: 'transparent',
                            transition: 'background-color 0.2s',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.05)'
                            }
                        }}
                    >
                        {notesByTag[-1]?.map(note => (
                            <NavLink
                                key={note.id}
                                component="button"
                                label={note.title ? note.title : "Untitled Note"}
                                variant="light"
                                onClick={(e) => handleNoteClick(e, note.id)}
                                active={activeNote?.id === note.id}
                                draggable
                                onDragStart={(e) => handleNoteDragStart(e, note.id)}
                                style={{
                                    cursor: 'grab',
                                    '&:active': {
                                        cursor: 'grabbing'
                                    }
                                }}
                            />
                        ))}
                    </NavLink>

                    {/* Regular Tags */}
                    {tags.map(tag => (
                        <NavLink
                            key={tag.id}
                            label={`${tag.name}`}
                            opened={expandedTags[tag]}
                            onClick={() => toggleTag(tag)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, tag)}
                            style={{
                                cursor: 'pointer',
                                backgroundColor: 'transparent',
                                transition: 'background-color 0.2s',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.05)'
                                }
                            }}
                        >
                            {notesByTag[tag]?.map(note => (
                                <NavLink
                                    key={note.id}
                                    component="button"
                                    label={note.title ? note.title : "Untitled Note"}
                                    variant="light"
                                    onClick={(e) => handleNoteClick(e, note.id)}
                                    active={activeNote?.id === note.id}
                                    draggable
                                    onDragStart={(e) => handleNoteDragStart(e, note.id)}
                                    style={{
                                        cursor: 'grab',
                                        '&:active': {
                                            cursor: 'grabbing'
                                        }
                                    }}
                                />
                            ))}
                        </NavLink>
                    ))}
                </>
            )}
        </AppShellNavbar>
    );
}