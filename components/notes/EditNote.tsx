'use client'

import {Group, Select, Stack, Text, Textarea, TextInput, Button, MultiSelect} from "@mantine/core";
import {useNotes} from "@/context/NotesContext";
import {useDebouncedValue} from "@mantine/hooks";
import {ChangeEvent, useEffect, useState} from "react";
import {IconRefresh, IconTrash, IconRobot, IconArrowDown} from "@tabler/icons-react";
import {notifications} from "@mantine/notifications";
import {useChat} from "@/context/ChatContext";

import type { Note } from '@prisma/client'

export interface EditNoteProps {
    note: Note;
}

const normalizeTags = (tags) =>
  (tags ?? []).map(t => ({
    id: t.id,
    name: t.name
  }));

export default function EditNote({ note }: EditNoteProps) {

    const { updateNoteLocally, updateNoteInDB, deleteNote, setActiveNoteId, closeNote, notes, revertDeletion , tags, exportNote} = useNotes();
    const { history } = useChat();
    const [saving, setSaving] = useState(false);
    const [hasEdited, setHasEdited] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>(
        (note.tags ?? []).map(t => t.id.toString())
    );
    const TRASH_TAG = -1; 

    // Update note in DB automatically shortly after user has stopped typing
    const [debouncedTitle] = useDebouncedValue(note.title, 500);
    const [debouncedContent] = useDebouncedValue(note.content, 500);
    const [debouncedTags] = useDebouncedValue(note.tags, 500);

    useEffect(() => {
        // Prevent API update call on initial load
        console.log(hasEdited);
        if (!hasEdited) return;

        const updateNote = async () => {
            setSaving(true);
            try {
                await updateNoteInDB(note);
                // Temporary fake delay to ensure saving indicator is visible
                await new Promise(resolve => setTimeout(resolve, 150));
            } catch (error) {
                notifications.show({
                    color: 'red',
                    title: 'Saving Error.',
                    message: "There was an issue saving your changes.",
                    position: "top-center"
                })
            }
            setSaving(false);
        }

        updateNote();
    }, [debouncedTitle, debouncedContent, debouncedTags]);

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        updateNoteLocally({ ...note, title: e.target.value });
        setHasEdited(true);
    }

    const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        updateNoteLocally({ ...note, content: e.target.value });
        setHasEdited(true);
    }
    
    const handleExportNote = async () => {
        try {
            const result = await exportNote(note.id, note.format || 'pdf');
            if (result === true) {
                notifications.show({
                    color: 'green',
                    title: 'Export Successful',
                    message: 'Note exported successfully',
                    position: "top-center"
                });
            } else {
                throw result; // Rethrow the error
            }
        } catch (error) {
            notifications.show({
                color: 'red',
                title: 'Export Failed',
                message: error instanceof Error ? error.message : 'Unable to export note',
                position: "top-center"
            });
        }
    }

    const handleUndoDeletion = async (newTag: number) => {
        try {
            await revertDeletion(note.id, newTag);
            notifications.show({
                color: 'green',
                title: 'Success',
                message: 'Note has been restored.',
                position: 'top-right'
            });
        } catch (error) {
            console.error('Error reverting note deletion:', error);
            notifications.show({
                color: 'red',
                title: 'Error',
                message: 'Failed to revert note deletion.',
                position: 'top-right'
            });
        }
    };

    const handleDeleteNote = async () => {
        
        try {
          // Mark the note for deletion
          
          if (note.canDelete === false){
            const markResponse = await fetch("/api/notes/markDeletion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ noteId: note.id, authorId: note.authorId }),
              });
        
              if (!markResponse.ok) {
                notifications.show({
                    color: "red",
                    title: "Deletion Error.",
                    message: "There was an issue moving your note to the trash.",
                    position: "top-center",
                });
                return;
              }
                const updatedNote = await markResponse.json();
                updateNoteLocally({ ...updatedNote, tags: [TRASH_TAG]});
                updateNoteInDB({ ...updatedNote, tags: [TRASH_TAG]});
              
            } else{
                const deleteResponse = await fetch("/api/notes/delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ noteId: note.id, authorId: note.authorId }),
                });
            
                if (!deleteResponse.ok) {
                    notifications.show({
                        color: "red",
                        title: "Deletion Error.",
                        message: "There was an issue deleting your note.",
                        position: "top-center",
                    });
                }
            
                // Remove the note from the local state
                deleteNote(note.id);
            }
        
            notifications.show({
                color: "green",
                title: "Note Deleted.",
                message: "Your note has been successfully deleted.",
                position: "top-center",
            });
                
                closeNote(note.id);
            
        } catch (error) {
                console.error("Deletion Error:", error); // Log the error
                notifications.show({
                    color: "red",
                    title: "Deletion Error.",
                    message: "There was an issue deleting your note.",
                    position: "top-center",
                });
            }
      };
    
    const handleAIResponse = async () => {
        setIsLoadingAI(true);
        try {
            // Get the most recent response from chat history
            const mostRecentEntry = history[0];
            if (!mostRecentEntry) {
                notifications.show({
                    color: 'yellow',
                    title: 'No Response Available',
                    message: 'Please ask a question first to get an AI response.',
                    position: 'top-right'
                });
                return;
            }

            // Split the note content into lines
            const lines = note.content.split('\n');
            let insertionIndex = -1;

            // First, get context about the note content and the AI response
            const contextRes = await fetch('/api/assistant/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: "Given this note content and AI response, analyze where the response would fit best contextually. Consider the question that was asked and its relationship to the surrounding content. Only suggest placement after the most relevant question or section.",
                    context: `Note content:\n${note.content}\n\nAI Response:\n${mostRecentEntry.response}\n\nOriginal Question:\n${mostRecentEntry.prompt}`
                })
            });

            if (!contextRes.ok) {
                throw new Error('Failed to get AI context analysis');
            }

            // Now go through each line and ask if the response should be inserted after it
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const placementRes = await fetch('/api/assistant/ask', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        question: "Given this line of text, the AI response, and the original question, should the response be inserted after this line? Only respond with 'yes' or 'no'. Consider the context and relevance to the original question.",
                        context: `Line: "${line}"\n\nAI Response:\n${mostRecentEntry.response}\n\nOriginal Question:\n${mostRecentEntry.prompt}`
                    })
                });

                if (!placementRes.ok) {
                    throw new Error('Failed to get AI placement suggestion');
                }

                const placementData = await placementRes.json();
                if (placementData.message.toLowerCase().includes('yes')) {
                    insertionIndex = i;
                    break;
                }
            }

            // If no specific insertion point was found, append to the end
            if (insertionIndex === -1) {
                insertionIndex = lines.length - 1;
            }

            // Insert the response at the determined position
            const newContent = lines.slice(0, insertionIndex + 1).join('\n') + 
                             '\n\n' + mostRecentEntry.response + 
                             '\n' + lines.slice(insertionIndex + 1).join('\n');

            updateNoteLocally({ ...note, content: newContent });
            setHasEdited(true);

            notifications.show({
                color: 'green',
                title: 'Success',
                message: 'AI response has been inserted into your note.',
                position: 'top-right'
            });
        } catch (error) {
            console.error('Error inserting AI response:', error);
            notifications.show({
                color: 'red',
                title: 'Error',
                message: 'Failed to insert AI response.',
                position: 'top-right'
            });
        }
        setIsLoadingAI(false);
    };

    const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        const droppedText = e.dataTransfer.getData("text/plain");
        if (!droppedText) return;

        setIsLoadingAI(true);
        try {
            // Get cursor position
            const textarea = e.currentTarget;
            const cursorPosition = textarea.selectionStart;
            const beforeCursor = note.content.substring(0, cursorPosition);
            const afterCursor = note.content.substring(cursorPosition);

            // Ask AI for placement suggestion around the cursor position
            const placementRes = await fetch('/api/assistant/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: "Given this note content and cursor position (marked by |), analyze where the new content should be inserted. Consider the context and relevance to surrounding questions. Only respond with: 'before-cursor' or 'after-cursor'.",
                    context: `Note content before cursor:\n${beforeCursor}\n\nNote content after cursor:\n${afterCursor}\n\nContent to insert:\n${droppedText}`
                })
            });

            if (!placementRes.ok) {
                throw new Error('Failed to get AI placement suggestion');
            }

            const placementData = await placementRes.json();
            const placement = placementData.message.toLowerCase();

            // Insert the content based on AI suggestion
            let newContent;
            if (placement.includes('before')) {
                newContent = `${beforeCursor}\n${droppedText}\n${afterCursor}`;
            } else {
                newContent = `${beforeCursor}\n\n${droppedText}\n${afterCursor}`;
            }

            updateNoteLocally({ ...note, content: newContent });
            setHasEdited(true);

            notifications.show({
                color: 'green',
                title: 'Success',
                message: 'Content has been inserted into your note.',
                position: 'top-right'
            });
        } catch (error) {
            console.error('Error handling drop:', error);
            notifications.show({
                color: 'red',
                title: 'Error',
                message: 'Failed to insert content.',
                position: 'top-right'
            });
        }
        setIsLoadingAI(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    };

    return (
        <Stack p={0} gap={0} mt="sm">
            <Group justify="space-between">
                <MultiSelect
                    value={selectedTags}
                    data={tags.map(tag => ({
                        value: tag.id.toString(),
                        label: tag.name
                    }))}
                    onChange={(values) => {
                        setSelectedTags(values);

                        updateNoteLocally({
                            ...note,
                            tags: values.map(v => {
                                const id = Number(v);
                                const tag = tags.find(t => t.id === id);

                                return {
                                    id,
                                    name: tag?.name ?? ""
                                };
                            })
                        });

                        setHasEdited(true);
                    }}
                    maxDropdownHeight={220}
                    placeholder="Select tags"
                />

                <Group opacity={saving ? 1 : 0} style={{ transition: "opacity 0.2s" }}>
                    <IconRefresh size={16} />
                    <Text size="sm" c="dimmed">Saving...</Text>
                </Group>

                <Group>
                    {history.length > 0 && (
                        <Button
                            color="blue"
                            leftSection={<IconRobot size={16} />}
                            onClick={handleAIResponse}
                            loading={isLoadingAI}
                            mt="md"
                        >
                            Insert AI Response
                        </Button>
                    )}
                    <Button
                        color="blue"
                        leftSection={<IconArrowDown size={16} />}
                        onClick={handleExportNote}
                        mt="md"
                    >
                        Export Note
                    </Button>

                    <Button
                        color="red"
                        leftSection={<IconTrash size={16} />}
                        onClick={handleDeleteNote}
                        mt="md"
                    >
                        Delete Note
                    </Button>
                </Group>
            </Group>

            <TextInput
                value={note.title}
                onChange={handleTitleChange}
                placeholder="New Note"
                size="xl"
                variant="unstyled"
                fw={600}
            />

            <Textarea
                minRows={8}
                autosize
                value={note.content}
                onChange={handleContentChange}
                placeholder="Start writing your note here..."
                size="md"
                variant="unstyled"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                style={{ cursor: 'text' }}
            />
            
        </Stack>
    )
}