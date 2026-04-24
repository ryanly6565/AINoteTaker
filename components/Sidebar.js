import { useState } from 'react';
import {AppShellNavbar, Button, Divider, NavLink, Skeleton, ScrollArea, TextInput} from '@mantine/core';
import { useNotes } from '../context/NotesContext';
import {IconHome2, IconPlus, IconTrash, IconTag} from "@tabler/icons-react";
import {notifications} from "@mantine/notifications";
import { useRouter } from 'next/navigation';
import { IconPencil } from "@tabler/icons-react";
import {useAuth} from "../context/AuthContext";

export default function Sidebar({ opened }) {
    const [expandedTags, setExpandedTags] = useState({});
    const { notes, tags, activeNote, createNote, createTag, openNote, initialLoad, setActiveNoteId, updateNoteInDB, saveTag, updateNoteLocally } = useNotes();
    const [editingTagId, setEditingTagId] = useState(null);
    const [editingTagValue, setEditingTagValue] = useState("");
    const { user } = useAuth();
    const router = useRouter();

    const garbageTag = tags.find(tag => tag.userTagId === -1);
    const otherTags = tags.filter(tag => tag.userTagId !== -1);

    // Sort notes by tag 
    const notesByTag = notes.reduce((acc, note) => {

        (note.tags ?? []).forEach(tag => {
            const key = String(tag.id);
            if (!acc[key]) acc[key] = [];
            acc[key].push(note);
        });

        return acc;
    }, {});

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
            const note = notes.find(n => n.id === Number(noteId));
            if (!note) return;

            const newTag = tags.find(t => t.id === targetTag);
            if (!newTag) return;

            // 1. update UI immediately
            updateNoteLocally({
                ...note,
                tags: [newTag]
            });

            // 2. then persist
            await updateNoteInDB({
                ...note,
                tags: [newTag]
            });

            notifications.show({
                color: 'green',
                title: 'Success',
                message: `Note moved to ${newTag.name}`,
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
            
            await createTag(defaultName, tags.length);
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
        if (tags.length === 1) {
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
                        {garbageTag && (
                            <NavLink
                                key={garbageTag.id}
                                label="Garbage"
                                rightSection={<IconTrash />}
                                opened={expandedTags[garbageTag.id]}
                                onClick={() => toggleTag(garbageTag.id)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, garbageTag.id)}
                            >
                                {notesByTag[garbageTag.id]?.map(note => (
                                    <NavLink
                                        key={note.id}
                                        component="button"
                                        label={note.title || "Untitled Note"}
                                        variant="light"
                                        onClick={(e) => handleNoteClick(e, note.id)}
                                        active={activeNote?.id === note.id}
                                        draggable
                                        onDragStart={(e) => handleNoteDragStart(e, note.id)}
                                    />
                                ))}
                            </NavLink>
                        )}

                    {/* Regular Tags */}
                        {otherTags.map(tag => (
                            <NavLink
                                key={tag.id}
                                label={
                                    editingTagId === tag.id ? (
                                        <TextInput
                                            value={editingTagValue}
                                            autoFocus
                                            size="xs"
                                            variant="unstyled"
                                            onChange={(e) => setEditingTagValue(e.currentTarget.value)}
                                            onBlur={() => {
                                                saveTag(tag.id, editingTagValue);
                                                setEditingTagId(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") saveTag(tag.id, editingTagValue);
                                                if (e.key === "Escape") setEditingTagId(null);
                                            }}
                                        />
                                    ) : (
                                        tag.name
                                    )
                                }
                                opened={expandedTags[tag.id]}
                                onClick={() => {
                                    if (editingTagId !== tag.id) toggleTag(tag.id);
                                }}
                                rightSection={
                                    <IconPencil
                                        size={14}
                                        style={{ cursor: "pointer" }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingTagId(tag.id);
                                            setEditingTagValue(tag.name);
                                        }}
                                    />
                                }
                            >
                                {notesByTag[String(tag.id)]?.map(note => (
                                    <NavLink
                                        key={note.id}
                                        component="button"
                                        label={note.title || "Untitled Note"}
                                        onClick={(e) => handleNoteClick(e, note.id)}
                                        draggable
                                        onDragStart={(e) => handleNoteDragStart(e, note.id)}
                                    />
                                ))}
                            </NavLink>
                        ))}
                </>
            )}
        </AppShellNavbar>
    );
}