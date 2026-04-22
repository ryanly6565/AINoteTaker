'use client'

import {AppShellAside, Tabs} from "@mantine/core";
import AskGemini from "@/components/gemini/AskGemini";
import {IconFileUpload, IconMessage} from "@tabler/icons-react";
import {NoteUpload} from "@/components/gemini/NoteUpload";

export default function Aside() {
    return (
        <AppShellAside p="md">
            <Tabs defaultValue="chat" h="100%">
                <Tabs.List grow>
                    <Tabs.Tab value="chat" leftSection={<IconMessage size={20} />}>
                        Chat
                    </Tabs.Tab>
                    <Tabs.Tab value="upload" leftSection={<IconFileUpload size={20} />}>
                        Upload
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="chat" mt="sm" h="100%">
                    <AskGemini />
                </Tabs.Panel>
                <Tabs.Panel value="upload" mt="sm" h="100%">
                    <NoteUpload />
                </Tabs.Panel>
            </Tabs>
        </AppShellAside>
    )
}