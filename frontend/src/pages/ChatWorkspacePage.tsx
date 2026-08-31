import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/sidebar/Sidebar.tsx';
import { ChatHeader } from '../components/header/ChatHeader.tsx';
import { ChatArea } from '../components/chat/ChatArea.tsx';
import { MessageComposer } from '../components/composer/MessageComposer.tsx';
import { ThreadDrawer } from '../components/thread/ThreadDrawer.tsx';
import { ConnectionStatusBar } from '../components/connection/ConnectionStatusBar.tsx';
import { SettingsPage } from './SettingsPage.tsx';
import { useSocket } from '../hooks/useSocket.ts';
import { useChat } from '../hooks/useChat.ts';
import * as roomService from '../services/rooms.ts';
import { Room, Message } from '../types/index.ts';

export const ChatWorkspacePage: React.FC = () => {
  const { connectionStatus } = useSocket();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeThreadMessage, setActiveThreadMessage] = useState<Message | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load user rooms on mount
  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const userRooms = await roomService.getUserRooms();
      setRooms(userRooms);
      if (userRooms.length > 0 && !activeRoomId) {
        // Default to #website-project or first available room
        const websiteRoom = userRooms.find((r) => r.slug === 'website-project');
        setActiveRoomId(websiteRoom ? websiteRoom.id : userRooms[0].id);
      }
    } catch (err) {
      console.error('Failed to load user rooms:', err);
    }
  };

  const {
    room,
    messages,
    loading,
    loadingMore,
    hasMore,
    loadOlderMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    reloadRoom,
  } = useChat(activeRoomId);

  const handleRoomCreated = (newRoom: Room) => {
    setRooms((prev) => [newRoom, ...prev.filter((r) => r.id !== newRoom.id)]);
    setActiveRoomId(newRoom.id);
  };

  const handleRoomUpdated = (updatedRoom: Room) => {
    setRooms((prev) => prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)));
    reloadRoom();
  };

  const handleRoomDeleted = (deletedRoomId: string) => {
    setRooms((prev) => {
      const remaining = prev.filter((r) => r.id !== deletedRoomId);
      if (activeRoomId === deletedRoomId && remaining.length > 0) {
        setActiveRoomId(remaining[0].id);
      }
      return remaining;
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c0a14] select-none">
      {/* Sidebar Navigation */}
      <Sidebar
        rooms={rooms}
        activeRoomId={activeRoomId}
        onSelectRoom={(id) => {
          setActiveRoomId(id);
          setActiveThreadMessage(null);
        }}
        onRoomCreated={handleRoomCreated}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Chat View */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0f0b1a] relative">
        <ConnectionStatusBar status={connectionStatus} />

        {room ? (
          <>
            <ChatHeader
              room={room}
              onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              onRoomUpdated={handleRoomUpdated}
              onRoomDeleted={handleRoomDeleted}
              onRoomLeft={handleRoomDeleted}
            />

            <ChatArea
              room={room}
              messages={messages}
              loading={loading}
              loadingMore={loadingMore}
              hasMore={hasMore}
              onLoadOlder={loadOlderMessages}
              onOpenThread={(msg) => setActiveThreadMessage(msg)}
              onEditMessage={editMessage}
              onDeleteMessage={deleteMessage}
              onReact={reactToMessage}
            />

            <MessageComposer
              room={room}
              onSendMessage={sendMessage}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-zinc-500">
            Select or create a channel to start collaborating.
          </div>
        )}
      </main>

      {/* Thread Discussion Drawer */}
      {room && (
        <ThreadDrawer
          isOpen={!!activeThreadMessage}
          onClose={() => setActiveThreadMessage(null)}
          rootMessage={activeThreadMessage}
          room={room}
          onEditMessage={editMessage}
          onDeleteMessage={deleteMessage}
          onReact={reactToMessage}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && <SettingsPage onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
};
