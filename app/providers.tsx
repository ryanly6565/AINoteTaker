'use client';

import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { NotesProvider } from "@/context/NotesContext";
import { ChatProvider } from "@/context/ChatContext";
import { AuthProvider } from "@/context/AuthContext";

const theme = createTheme({
  primaryColor: "blue",
});

export default function Providers({ children }) {
  return (
    <MantineProvider theme={theme}>
      <AuthProvider>
        <ChatProvider>
          <NotesProvider>
            <Notifications autoClose={1000} />
            {children}
          </NotesProvider>
        </ChatProvider>
      </AuthProvider>
    </MantineProvider>
  );
}