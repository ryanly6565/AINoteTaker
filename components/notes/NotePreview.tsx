'use client'

import {Badge, Card, Flex, Stack, Text, Highlight} from "@mantine/core";
import {getRelativeTimeString} from "@/helpers/relativeTimeStr";
import {useNotes} from "@/context/NotesContext";

interface NotePreviewProps {
    note: Note;
    height: number;
    searchQuery?: string;
}

export default function NotePreview(props: NotePreviewProps) {
    const { note, height, searchQuery } = props;
    const { openNote } = useNotes();

    // NOTE: Currently displays when it was created, should probably change this to when it was last edited later
    const timeString = getRelativeTimeString(new Date(note.createdAt), navigator.language);

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('noteId', note.id.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleClick = (e: React.MouseEvent) => {
        // Prevent opening the note if we're dragging
        if (e.detail === 1) {
            openNote(note.id);
        }
    };

    return (
        <Card
            shadow="sm"
            padding="md"
            withBorder
            h={height}
            style={{ cursor: "grab" }}
            onClick={handleClick}
            draggable
            onDragStart={handleDragStart}
        >
            <Stack gap={4} flex={1}>
                <Flex justify="space-between" gap="xs">
                    <Text size="md" fw={700} truncate>
                        <Highlight highlight={searchQuery || ""}>{note.title}</Highlight>
                    </Text>
                    <Badge miw={32}>{note.tag}</Badge>
                </Flex>
                <Text size="sm" c="dimmed" fw={500} lineClamp={4}>
                    <Highlight highlight={searchQuery || ""}>{note.content}</Highlight>
                </Text>
            </Stack>
            <Card.Section inheritPadding mb={0}>
                <Text size="sm" c="dimmed" fw={400}>
                    {timeString}
                </Text>
            </Card.Section>
        </Card>
    );
}