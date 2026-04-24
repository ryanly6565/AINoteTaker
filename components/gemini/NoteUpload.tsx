'use client'

import {
    Accordion,
    Blockquote,
    Button,
    FileInput,
    Group,
    NumberInput,
    ScrollArea,
    Stack, Text,
    TextInput,
    MultiSelect
} from "@mantine/core";
import React, {useState} from "react";
import {useRouter} from "next/navigation";
import {useNotes} from "@/context/NotesContext";

export function NoteUpload() {
    const [selectedTags, setSelectedTags] = useState<string[]>([])

    const router = useRouter();
    const { createNote, tags } = useNotes();

    // User input state
    const [file, setFile] = useState<File | null>(null);
    const [tag, setTag] = useState<number>(0);
    const [noteName, setNoteName] = useState<string>("");

    const [uploading, setUploading] = useState(false);
    const [response, setResponse] = useState<string>("");

    const handleFileChange = (file: File | null) => {
        setFile(file);
        setNoteName(file?.name || "");
    }

    const handleTagChange = (val: number | string) => {
        const newTag = typeof val === "number" ? val : (parseInt(val) || 0);
        setTag(newTag);
    }

    const clearData = () => {
        setFile(null);
        setNoteName("");
        setTag(0);
    }

    const uploadFile = async () => {
        if (!file) return;

        setUploading(true);
        try {
            // Create new note from uploaded file
            // NOTE: Currently only works for .txt files
            if (file.type == "text/plain") {
                const fileContent = await file.text();
                const updatedTags = selectedTags.map(v => {
                    const id = Number(v);
                    const tag = tags.find(t => t.id === id);
                    return {
                        id,
                        name: tag?.name ?? ""
                    };
                });

                await createNote({
                    title: noteName,
                    content: fileContent,
                    tags: updatedTags,
                });
            }

            // Generate AI summary from it
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch('/api/assistant/summary', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) { throw new Error("Failed to generate AI summary"); }

            // Display response from AI
            const data: { message: string } = await res.json();
            setResponse(data.message);
            clearData();
        } catch (error) {

        }

        setUploading(false);
    }

    return (
        <Stack
            gap="sm"
            p="sm"
            h="100%"
        >
            <Accordion defaultValue="form">
                <Accordion.Item key="form" value="form">
                    <Accordion.Control>
                        <Text fw={500}>
                            Upload
                        </Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Stack p={0} gap="xs">
                            <FileInput
                                value={file}
                                onChange={handleFileChange}
                                aria-label="Upload File"
                                description="Upload a file to save it to your notes and receive an AI generated summary."
                                placeholder="Select a file"
                                accept="image/png, image/jpeg, application/pdf, text/plain"
                                clearable
                            />

                            <Group px={0} grow>
                                <TextInput
                                    value={noteName}
                                    onChange={(e) => setNoteName(e.target.value)}
                                    label="Name"
                                    size="xs"
                                />

                            <MultiSelect
                                value={selectedTags}
                                data={(tags ?? [])
                                    .filter((t): t is { id: number; name: string } =>
                                        t && typeof t.id === "number" && t.userTagId !== -1
                                    )
                                    .map(tag => ({
                                        value: String(tag.id),
                                        label: tag.name ?? ""
                                    }))
                                }
                                onChange={setSelectedTags}
                                label="Tags"
                                placeholder="Select tags"
                                maxDropdownHeight={200}
                            />
                            </Group>

                            <Button
                                onClick={uploadFile}
                                variant="light"
                                disabled={!file}
                                loading={uploading}
                                loaderProps={{ type: "dots" }}
                            >
                                Upload
                            </Button>
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>


            <ScrollArea
                type="hover"
                w="100%"
                mb="xl"
            >
                {response && (
                    <Blockquote
                        style={{
                            textAlign: 'left',
                            padding: '8px',
                            borderRadius: '8px',
                            overflowWrap: 'anywhere',
                        }}
                    >
                        <Text>{response}</Text>
                    </Blockquote>
                )}
            </ScrollArea>
        </Stack>
    )
}