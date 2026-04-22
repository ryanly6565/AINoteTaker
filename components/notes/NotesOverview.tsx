'use client'

import { SimpleGrid, Skeleton, Stack, Text, Autocomplete, Card, Group } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import NotePreview from "@/components/notes/NotePreview";
import { useNotes } from "@/context/NotesContext";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { notifications } from "@mantine/notifications";
import {useAuth} from "@/context/AuthContext";

export default function NotesOverview() {
  const { notes, initialLoad, createNote, openNote, tags }: { notes: Note[]; initialLoad: boolean; createNote: Function; openNote: Function; tags: number[] } = useNotes();
  const [searchQuery, setSearchQuery] = useState(""); 
  const { user } = useAuth();
  const router = useRouter();

  // Sizing setup
  const height = 180;

  // Filter notes based on search query
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get suggestions for Autocomplete
  const suggestions = notes
    .filter((note) => note.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .map((note) => ({
        value: `${note.id}`, // Use note ID as the unique value
        label: note.title    // Display title to the user
    }));

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

  return (
    <Stack>
      {/* Search Bar with Autocomplete */}
      <Autocomplete
        placeholder="Search notes..."
        value={searchQuery}
        onChange={setSearchQuery}
        data={suggestions}
      />

      <SimpleGrid cols={{ base: 1, sm: 1, md: 2, lg: 3 }}>
        {/* New Note Panel */}
        <Card
          shadow="sm"
          padding="md"
          withBorder
          h={height}
          style={{ 
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "var(--mantine-color-blue-0)",
            transition: "background-color 0.2s",
            "&:hover": {
              backgroundColor: "var(--mantine-color-blue-1)"
            }
          }}
          onClick={handleCreateNote}
        >
          <Group gap="xs">
            <IconPlus size={24} />
            <Text size="lg" fw={600}>New Note</Text>
          </Group>
          <Text size="sm" c="dimmed" mt="xs">Click to create a new note</Text>
        </Card>

        {initialLoad &&
          Array(6)
            .fill(0)
            .map((_, index) => (
              <Skeleton key={index} h={height} animate={true} />
            ))}

        {Array.isArray(filteredNotes) &&
          filteredNotes.map((note) => (
            <NotePreview
              note={note}
              height={height}
              key={note.id}
              searchQuery={searchQuery}
            />
          ))}
      </SimpleGrid>

      {/* Empty State */}
      {!initialLoad && filteredNotes.length === 0 && (
        <Text size="lg" fw={600}>
          No Notes Found.
        </Text>
      )}
    </Stack>
  );
}