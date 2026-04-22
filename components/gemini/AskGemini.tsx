'use client';

import {
    Blockquote,
    Button,
    Divider,
    Group,
    Paper,
    ScrollArea,
    Skeleton,
    Stack,
    Text,
    Textarea,
} from "@mantine/core";
import React, { FormEvent, useState } from "react";
import { notifications } from "@mantine/notifications";
import { useNotes } from "@/context/NotesContext";
import { useChat } from "@/context/ChatContext";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";

export default function AskGemini() {
    const [question, setQuestion] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { history, addToHistory, clearHistory } = useChat();
    const { activeNote, updateNoteLocally } = useNotes();

    const handleSubmit = async (e?: FormEvent) => {
        e?.preventDefault();

        if (!activeNote) return;

        setIsLoading(true);

        try {
            const res = await fetch('/api/assistant/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question,
                    context: activeNote.content,
                    mode: 'answer_and_place'
                })
            });

            if (!res.ok) {
                throw new Error(`Invalid response code: ${res.status}`);
            }

            const data = await res.json();
            const response = data.message;

            addToHistory({ prompt: question, response });

            if (data.shouldInsert && typeof data.insertionIndex === 'number') {
                const lines = activeNote.content.split('\n');

                const before = lines.slice(0, data.insertionIndex + 1).join('\n');
                const after = lines.slice(data.insertionIndex + 1).join('\n');

                const newContent = [before, response, after]
                    .filter(Boolean)
                    .join('\n\n');

                updateNoteLocally({
                    ...activeNote,
                    content: newContent
                });

                notifications.show({
                    color: 'green',
                    title: 'Success',
                    message: 'AI response has been inserted into your note.',
                    position: 'top-right'
                });
            }

            setQuestion('');
        } catch (err) {
            console.error(err);
            notifications.show({
                color: 'red',
                title: 'Error',
                message: "Sorry, something went wrong.",
                position: 'top-right'
            });
        }

        setIsLoading(false);
    };

    return (
        <Stack
            gap="sm"
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
            <form onSubmit={handleSubmit}>
                <Textarea
                    autosize
                    variant="filled"
                    size="md"
                    maxRows={4}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={activeNote ? "Ask Gemini" : "Select a note to ask questions"}
                    aria-label="Ask Gemini"
                    disabled={!activeNote}
                />
                {!activeNote && (
                    <Text size="sm" c="dimmed" mt="xs">
                        Please select or create a note to start asking questions
                    </Text>
                )}
            </form>

            <Group justify="space-between">
                {history.length > 0 && (
                    <Button
                        variant="subtle"
                        color="gray"
                        size="xs"
                        onClick={clearHistory}
                    >
                        Clear History
                    </Button>
                )}
                <Text size="sm">
                    {history.length > 0 ? `${history.length} message${history.length > 1 ? 's' : ''}` : ''}
                </Text>
            </Group>

            <Divider />

            {isLoading ? <Skeleton height={36} /> : null}

            <ScrollArea.Autosize
                mah="80vh"
                w="100%"
                type="hover"
                mx="auto"
                style={{ flex: 1, minHeight: 0 }}
            >
                <Stack gap="sm">
                    {history.map((entry, index) => (
                        <Stack key={index}>
                            <Paper shadow="xs" p="xs">
                                <Text size="md" fw={300}>
                                    {entry.prompt}
                                </Text>
                            </Paper>
                            <Blockquote
                                draggable
                                onDragStart={(e) => e.dataTransfer.setData("text/plain", entry.response)}
                                style={{
                                    textAlign: 'left',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    overflowWrap: 'anywhere',
                                    cursor: 'grab',
                                    backgroundColor: 'var(--mantine-color-default-filled)',
                                }}
                            >
                                <Text>{entry.response}</Text>
                            </Blockquote>
                        </Stack>
                    ))}
                </Stack>
            </ScrollArea.Autosize>
        </Stack>
    );
}