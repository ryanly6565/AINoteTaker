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
    TextInput
} from "@mantine/core";
import React, {useState} from "react";
import {useRouter} from "next/router";
import {useNotes} from "@/context/NotesContext";

export function NoteUpload() {
    const router = useRouter();
    const { createNote } = useNotes();

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
                await createNote({
                    title: noteName,
                    content: fileContent,
                    tag: tag,
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

                                <NumberInput
                                    variant="filled"
                                    value={tag}
                                    onChange={handleTagChange}
                                    allowNegative={false}
                                    label="Tag"
                                    placeholder="Tag Number"
                                    allowDecimal={false}
                                    maw={150}
                                    size="xs"
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