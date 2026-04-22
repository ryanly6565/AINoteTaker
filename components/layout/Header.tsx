'use client'

import {ActionIcon, AppShellHeader, Burger, Flex, Title, useMantineColorScheme, Modal, Button, Group, Text} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {IconMoon, IconSun, IconLogout, IconSettings, IconTrash} from "@tabler/icons-react";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { useNotes } from "@/context/NotesContext";
import {useAuth} from "@/context/AuthContext";

interface HeaderProps {
    opened: boolean,
    toggle: () => void;
}

export default function Header({ opened, toggle }: HeaderProps) {
    const router = useRouter();
    const { resetContext } = useNotes();
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const [mounted, setMounted] = useState(false);
    const dark = colorScheme === 'dark';
    const [openedSettings, { open: openSettings, close: closeModal }] = useDisclosure(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const toggleColorScheme = () => {
        setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
    }

    const { logout } = useAuth();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Custom close function that resets the modal state
    const close = () => {
        closeModal();
        setShowDeleteConfirmation(false);
    };

    const handleLogout = async () => {
        await logout();
        resetContext();
        await router.push('/login');
    };
    
    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch('/api/auth/delete', {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const data = await response.json();
                alert(data.message || 'Failed to delete account');
                return;
            }
            
            // Account deleted successfully
            resetContext();
            await router.push('/login');
        } catch (e) {
            console.error(e);
            alert('An error occurred while deleting your account');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirmation(false);
            close();
        }
    };

    const toggleDeleteConfirmation = () => {
        setShowDeleteConfirmation(!showDeleteConfirmation);
    };

    return (
        <AppShellHeader p="sm">
            <Modal 
                opened={openedSettings} 
                onClose={close} 
                title="Manage Account" 
                centered
            >
                <Flex direction="column" p="md" gap="md">
                    {!showDeleteConfirmation ? (
                        <Button 
                            color="red" 
                            onClick={toggleDeleteConfirmation}
                            fullWidth
                        >
                            Delete Account
                        </Button>
                    ) : (
                        <>
                            <Text mb="lg">Are you sure you want to delete your account? This action cannot be undone.</Text>
                            <Group>
                                <Button variant="outline" onClick={toggleDeleteConfirmation}>
                                    No, Cancel
                                </Button>
                                <Button 
                                    color="red" 
                                    onClick={handleDeleteAccount}
                                    loading={isDeleting}
                                >
                                    Yes, Delete Account
                                </Button>
                            </Group>
                        </>
                    )}
                </Flex>
            </Modal>
            
            <Flex justify="space-between" align="center">
                <Flex justify="space-between" align="center">
                    <Burger opened={opened} onClick={toggle} />
                    <Title pl="1rem" >Notare</Title>
                </Flex>
                {mounted && (
                    <div className="flex items-center justify-center gap-4">
                        <ActionIcon
                            variant="outline"
                            color={dark ? 'yellow' : 'blue'}
                            onClick={() => toggleColorScheme()}
                            title="Toggle color scheme"
                            size="xl"
                        >
                            {dark ? <IconSun size="1.6rem"></IconSun> : <IconMoon size="1.6rem"></IconMoon>}
                        </ActionIcon>
                        <ActionIcon
                            variant="outline"
                            color={'gray'}
                            onClick={openSettings}
                            size="xl"
                        >
                            <IconSettings />
                        </ActionIcon>
                        <ActionIcon
                            variant="outline"
                            color={'red'}
                            onClick={() => handleLogout()}
                            title="Toggle color scheme"
                            size="xl"
                        >
                            <IconLogout />
                        </ActionIcon>
                    </div>
                )}
            </Flex>
        </AppShellHeader>
    );
}