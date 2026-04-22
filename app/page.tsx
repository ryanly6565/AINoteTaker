"use client";

import {
    AppShell,
    AppShellMain,
    Flex,
    ScrollArea,
    Tabs,
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import Header from "@/components/layout/Header";
import Aside from "@/components/layout/Aside";
import Sidebar from "@/components/Sidebar";

import NotesOverview from "@/components/notes/NotesOverview";
import EditNote from "@/components/notes/EditNote";
import NoteTab from "@/components/notes/NoteTab";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useNotes } from "@/context/NotesContext";

export default function Page() {
    const [opened, { toggle }] = useDisclosure();
    const { openedNotes, activeNote } = useNotes();

    return (
        <ProtectedRoute>
            <AppShell
                header={{ height: 70 }}
                aside={{ width: "25%" }}
                navbar={{
                    width: "15%",
                    collapsed: { desktop: !opened },
                    breakpoint: "sm",
                }}
                padding="md"
            >
                <Header opened={opened} toggle={toggle} />
                <Aside />
                <Sidebar opened={opened} />

                <AppShellMain>
                    <Flex p="md" direction="column" mah="calc(100vh - 70px)">
                        
                        {activeNote ? (
                            <Tabs value={`${activeNote.id}`} keepMounted={false}>
                                <ScrollArea scrollbarSize={1}>
                                    <Tabs.List style={{ flexWrap: "nowrap" }}>
                                        {openedNotes.map((note: any) => (
                                            <NoteTab note={note} key={note.id} />
                                        ))}
                                    </Tabs.List>
                                </ScrollArea>
                            </Tabs>
                        ) : null}

                        <ScrollArea.Autosize
                            offsetScrollbars
                            scrollbarSize={6}
                            style={{ overflowY: "auto", flexGrow: 1 }}
                            p="sm"
                        >
                            {activeNote ? (
                                <EditNote note={activeNote} />
                            ) : (
                                <NotesOverview />
                            )}
                        </ScrollArea.Autosize>

                    </Flex>
                </AppShellMain>
            </AppShell>
        </ProtectedRoute>
    );
}