'use client'

import {ActionIcon, CloseIcon, Flex, Tabs, Text} from "@mantine/core";
import {useNotes} from "@/context/NotesContext";
import {useHover} from "@mantine/hooks";

export interface NoteTabProps {
    note: Note
}

export default function NoteTab({ note }: NoteTabProps) {
    const { openNote, closeNote } = useNotes();
    const { hovered, ref } = useHover();

    return (
        <Tabs.Tab
            value={`${note.id}`}
            onClick={() => openNote(note.id)}
            component="div"
            ref={ref}
        >
            <Flex gap="sm">
                <Text size="sm">{note.title.length > 20 ? `${note.title.substring(0, 20)}...` : note.title}</Text>
                <ActionIcon
                    variant="subtle"
                    c="red"
                    size="sm"
                    aria-label="Close Tab"
                    onClick={(e) => {
                        e.stopPropagation();
                        closeNote(note.id);
                    }}
                    opacity={hovered ? 1 : 0}
                >
                    <CloseIcon />
                </ActionIcon>
            </Flex>
        </Tabs.Tab>
    )
}