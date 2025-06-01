// Chats.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import { format } from "date-fns";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/authContext"; // Importer le hook useAuth
import {
  IconArrowLeft,
  IconDotsVertical,
  IconEdit,
  IconMessages,
  IconSend,
  IconTrash,
  IconX,
  IconSearch,
  IconCircleCheck,
  IconPlus,
  IconPhone,
  IconVideo,
  IconPaperclip,
  IconMoodSmile,
  IconUserPlus,
  IconArchive,
  IconBell,
  IconBellOff,
  IconUsers,
  IconCopy,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types (inchangés, inclus pour référence)
interface Conversation {
  _id: string;
  members: Array<{ _id: string; name: string; email: string }>;
  lastMessage?: {
    content: string;
    sender: string;
    timestamp: string;
  };
  isMuted?: boolean;
  isArchived?: boolean;
}

interface Message {
  _id: string;
  conversation: string;
  sender: { _id: string; name: string };
  message: string;
  messageType: "text" | "image" | "file" | "audio" | "video";
  attachments: Array<{ url: string; filename: string; mimeType: string; size: number }>;
  createdAt: string;
  edited?: boolean;
  editedAt?: string;
  deleted?: boolean;
  deletedAt?: string;
  readBy?: Array<{ user: string; readAt: string }>;
}

interface ChatUser {
  _id: string;
  name: string;
  email: string;
}

const API_BASE_URL = "http://localhost:5000/api";

const EMOJIS = ["😊", "😂", "😍", "👍", "🙌", "😎", "😢", "😡", "🚀", "💡"];

export default function Chats() {
  const { user, isLoading: authLoading } = useAuth(); // Utiliser useAuth pour récupérer l'utilisateur
  const { setUnreadCount } = useSidebar();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [mobileSelectedConversation, setMobileSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredChatList, setFilteredChatList] = useState<Conversation[]>([]);
  const [groupedMessages, setGroupedMessages] = useState<{ [key: string]: Message[] }>({});
  const [messageInput, setMessageInput] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [createConversationDialogOpened, setCreateConversationDialog] = useState(false);
  const [deleteConversationDialogOpened, setDeleteConversationDialog] = useState(false);
  const [addToGroupDialogOpened, setAddToGroupDialog] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [showGroupsOnly, setShowGroupsOnly] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [callType, setCallType] = useState<"phone" | "video" | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Valider le format ObjectId
  const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

  // Vérifier si une conversation est un groupe
  const isGroupConversation = (conv: Conversation) => conv.members.length > 2;

  // Calculer le nombre de messages non lus
  const getUnreadMessagesCount = () => {
    if (!user?.id) return 0;
    let totalUnread = 0;
    conversations.forEach((conv) => {
      const convMessages = messages.filter((msg) => msg.conversation === conv._id);
      const unread = convMessages.filter(
        (msg) => !msg.readBy?.some((r) => r.user === user.id)
      ).length;
      totalUnread += unread;
    });
    return totalUnread;
  };

  useEffect(() => {
    const count = getUnreadMessagesCount();
    setUnreadCount(count);
  }, [conversations, messages, user?.id, setUnreadCount]);

  // Initialiser Socket.IO
  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      transports: ["websocket"],
      withCredentials: true,
    });
    setSocket(newSocket);

    newSocket.on("connect", () => console.log("Connected to Socket.IO server"));
    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
      toast.error("Socket error occurred");
    });
   newSocket.on("connect_error", (err) => {
  console.error("Socket connection error:", err);
  toast.error("Failed to connect to chat server. Please try again later.");
});
   newSocket.on("receive-message", (message: Message) => {
  if (message.conversation === selectedConversation?._id) {
    setMessages((prev) => {
      if (prev.some((m) => m._id === message._id)) return prev; // Éviter les doublons
      return [...prev, message];
    });
  }
  // Mise à jour des conversations
  setConversations((prev) =>
    prev.map((conv) =>
      conv._id === message.conversation
        ? {
            ...conv,
            lastMessage: {
              content: message.message || (message.attachments.length ? "[Attachment]" : ""),
              sender: message.sender._id,
              timestamp: message.createdAt,
            },
          }
        : conv
    )
  );
});
    newSocket.on("delete-message", (messageId: string) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });
    newSocket.on("last-message-updated", ({ conversationId, lastMessage }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversationId
            ? { ...conv, lastMessage: lastMessage || undefined }
            : conv
        )
      );
    });
   newSocket.on("conversation-deleted", (conversationId: string) => {
  setConversations((prev) => prev.filter((conv) => conv._id !== conversationId));
  setFilteredChatList((prev) => prev.filter((conv) => conv._id !== conversationId));
  if (selectedConversation?._id === conversationId || mobileSelectedConversation?._id === conversationId) {
    setSelectedConversation(null);
    setMobileSelectedConversation(null);
    setMessages([]);
  }
});

    return () => {
      newSocket.off("receive-message");
      newSocket.off("delete-message");
      newSocket.off("last-message-updated");
      newSocket.off("conversation-deleted");
      newSocket.disconnect();
    };
  }, [selectedConversation]);

  // Rejoindre une conversation et gérer WebRTC
  useEffect(() => {
    if (!selectedConversation || !socket) return;

    socket.emit("join-conversation", selectedConversation._id);

    socket.on("offer", async ({ offer }) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit("answer", { conversationId: selectedConversation._id, answer });
      } catch (err) {
        console.error("Error handling offer:", err);
        toast.error("Failed to process call offer");
      }
    });

    socket.on("answer", async ({ answer }) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error("Error handling answer:", err);
        toast.error("Failed to process call answer");
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [selectedConversation, socket]);

  // Démarrer un appel
  const startCall = async (type: "phone" | "video") => {
    if (!selectedConversation || !socket) {
      toast.error("No conversation selected or socket not connected");
      return;
    }

    setCallType(type);
    setIsCallActive(true);

    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    peerConnectionRef.current = new RTCPeerConnection(configuration);

    try {
      const constraints = { audio: true, video: type === "video" };
      localStreamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      if (localVideoRef.current && type === "video") {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      localStreamRef.current.getTracks().forEach((track) => {
        if (peerConnectionRef.current) {
          peerConnectionRef.current.addTrack(track, localStreamRef.current!);
        }
      });
    } catch (err) {
      console.error("Media error:", err);
      toast.error("Failed to access microphone or camera");
      endCall();
      return;
    }

    peerConnectionRef.current.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    };

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          conversationId: selectedConversation._id,
          candidate: event.candidate,
        });
      }
    };

    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socket.emit("offer", { conversationId: selectedConversation._id, offer });
    } catch (err) {
      console.error("Error creating offer:", err);
      toast.error("Failed to initiate call");
      endCall();
    }
  };

  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    remoteStreamRef.current = null;
    setIsCallActive(false);
    setCallType(null);
    toast.success("Call ended");
  };

  const handleCall = (type: "phone" | "video") => {
    startCall(type);
  };

  // Récupérer les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/getallUsers`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) throw new Error("Network error");
        const result = await response.json();
        if (!result.success) throw new Error(result.message || "Error fetching users");
        setUsers(
          result.data.map((user: any) => ({
            _id: user._id,
            name: user.name,
            email: user.email,
          }))
        );
      } catch (err: any) {
        toast.error("Error fetching users");
        console.error(err);
      }
    };
    fetchUsers();
  }, []);

  // Récupérer les conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user?.id) return; // Ne pas faire d'appel si pas d'utilisateur
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/chat/${user.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(`Network error: ${data.error || response.statusText}`);
        if (!data.success) throw new Error(data.error || "Error fetching conversations");
        setConversations(data.data);
        setFilteredChatList(data.data);
      } catch (err: any) {
        toast.error(err.message || "Error fetching conversations");
        console.error("Error fetching conversations:", err);
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) fetchConversations();
  }, [user?.id, authLoading]);

  // Filtrer les conversations
  useEffect(() => {
    if (!user?.id) return;
    setFilteredChatList(
      conversations.filter((conv) => {
        const otherUser = conv.members.find((p) => p._id !== user.id);
        const matchesSearch = otherUser?.name.toLowerCase().includes(search.toLowerCase());
        const matchesTab = activeTab === "active" ? !conv.isArchived : conv.isArchived;
        const matchesGroupFilter = showGroupsOnly ? isGroupConversation(conv) : true;
        return matchesSearch && matchesTab && matchesGroupFilter;
      })
    );
  }, [search, conversations, user?.id, activeTab, showGroupsOnly]);

  // Récupérer les messages
  const fetchMessages = async () => {
    if (!selectedConversation) return;
    if (!isValidObjectId(selectedConversation._id)) {
      toast.error("Invalid conversation ID");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${selectedConversation._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`);
      }
      if (!data.success) {
        throw new Error(data.error || "Error fetching messages");
      }
      setMessages(data.data || []);
    } catch (err: any) {
      toast.error(err.message || "Error fetching messages");
      console.error("Error fetching messages:", err, { conversationId: selectedConversation._id });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [selectedConversation]);

  // Grouper les messages par date
 useEffect(() => {
  const grouped = messages
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // Trier par date
    .reduce(
      (acc, msg) => {
        const date = format(new Date(msg.createdAt), "MMMM d, yyyy");
        if (!acc[date]) acc[date] = [];
        acc[date].push(msg);
        return acc;
      },
      {} as { [key: string]: Message[] }
    );
  setGroupedMessages(grouped);
}, [messages]);
useEffect(() => {
  if (chatContainerRef.current) {
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // Défilement si près du bas
    if (isNearBottom) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }
}, [groupedMessages]);
  // Faire défiler vers le bas
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [groupedMessages]);

  // Créer une nouvelle conversation
  const handleNewChat = async (otherUserId: string) => {
    if (!otherUserId || !user?.id) {
      toast.error("Invalid user selection");
      return;
    }
    if (!users.some((u) => u._id === otherUserId)) {
      toast.error("Selected user not found");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ members: [user.id, otherUserId] }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`);
      }
      if (!data.success) {
        throw new Error(data.error || "Error creating conversation");
      }
      setConversations((prev) => [...prev, data.data]);
      setFilteredChatList((prev) => [...prev, data.data]);
      setSelectedConversation(data.data);
      setMobileSelectedConversation(data.data);
      setCreateConversationDialog(false);
      socket?.emit("create-conversation", data.data);
      toast.success("Conversation created");
    } catch (err: any) {
      toast.error(err.message || "Error creating conversation");
      console.error("Error creating conversation:", err, { userId: user.id, otherUserId });
    } finally {
      setLoading(false);
    }
  };

  // Envoyer un message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation || !user?.id) return;
    if (!isValidObjectId(selectedConversation._id) || !isValidObjectId(user.id)) {
    toast.error("Invalid conversation or user ID");
    return;
    }  
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          conversationId: selectedConversation._id,
          senderId: user.id,
          message: messageInput,
          messageType: "text",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`);
      }
      if (!data.success) {
        throw new Error(data.error || "Error sending message");
      }
      const newMessage: Message = {
        _id: data.data._id,
        conversation: selectedConversation._id,
        sender: { _id: user.id, name: user.name || "You" },
        message: messageInput,
        messageType: "text",
        attachments: [],
        createdAt: new Date().toISOString(),
        readBy: [],
      };
      setMessages((prev) => [...prev, newMessage]);
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === selectedConversation._id
            ? {
                ...conv,
                lastMessage: {
                  content: messageInput,
                  sender: user.id,
                  timestamp: new Date().toISOString(),
                },
              }
            : conv
        )
      );
      socket?.emit("send-message", newMessage);
      setMessageInput("");
      toast.success("Message sent");
    } catch (err: any) {
      socket?.emit("send-message-error", { error: err.message, conversationId: selectedConversation._id });
      toast.error(err.message || "Error sending message");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Modifier un message
  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ message: editContent }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`);
      }
      if (!data.success) {
        throw new Error(data.error || "Error editing message");
      }
      setMessages((prev) => prev.map((msg) => (msg._id === messageId ? data.data : msg)));
      socket?.emit("edit-message", data.data);
      setEditingMessageId(null);
      setEditContent("");
      toast.success("Message edited");
    } catch (err: any) {
      toast.error(err.message || "Error editing message");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un message
  const handleDeleteMessage = async (messageId: string) => {
    if (!isValidObjectId(messageId)) {
      toast.error("Invalid message ID");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`);
      }
      if (!data.success) {
        throw new Error(data.error || "Error deleting message");
      }
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      if (selectedConversation) {
        await fetchMessages();
      }
      socket?.emit("delete-message", messageId);
      toast.success("Message deleted");
    } catch (err: any) {
      console.error("Error deleting message:", err, { messageId });
      toast.error(err.message || "Failed to delete message");
    } finally {
      setLoading(false);
    }
  };

  // Marquer comme lu
  const handleMarkAsRead = async (messageId: string) => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`);
      }
      if (!data.success) {
        throw new Error(data.error || "Error marking message as read");
      }
      setMessages((prev) => prev.map((msg) => (msg._id === messageId ? data.data : msg)));
      toast.success("Message marked as read");
    } catch (err: any) {
      toast.error(err.message || "Error marking message as read");
      console.error(err);
    }
  };

  // Supprimer une conversation
  const handleDeleteConversation = async (conversationId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${conversationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`);
      }
      if (!data.success) {
        throw new Error(data.error || "Error deleting conversation");
      }
      setConversations((prev) => prev.filter((conv) => conv._id !== conversationId));
      setFilteredChatList((prev) => prev.filter((conv) => conv._id !== conversationId));
      socket?.emit("delete-conversation", conversationId);
      if (selectedConversation?._id === conversationId) {
        setSelectedConversation(null);
        setMobileSelectedConversation(null);
        setMessages([]);
      }
      setDeleteConversationDialog(false);
      setConversationToDelete(null);
      toast.success("Conversation deleted");
    } catch (err: any) {
      toast.error(err.message || "Error deleting conversation");
      console.error("Error deleting conversation:", err, { conversationId });
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un utilisateur au groupe
  const handleAddToGroup = async (conversationId: string, userId: string) => {
    if (!userId || !conversationId) {
      toast.error("Invalid user or conversation selection");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${conversationId}/add-member`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`);
      }
      if (!data.success) {
        throw new Error(data.error || "Error adding user to group");
      }
      setConversations((prev) =>
        prev.map((conv) => (conv._id === conversationId ? { ...conv, members: data.data.members } : conv))
      );
      setFilteredChatList((prev) =>
        prev.map((conv) => (conv._id === conversationId ? { ...conv, members: data.data.members } : conv))
      );
      socket?.emit("update-group-members", { conversationId, members: data.data.members });
      setAddToGroupDialog(false);
      toast.success("User added to group");
    } catch (err: any) {
      toast.error(err.message || "Error adding user to group");
      console.error("Error adding user to group:", err, { conversationId, userId });
    } finally {
      setLoading(false);
    }
  };

  // Activer/désactiver les notifications
  const handleToggleMute = async (conversationId: string, isMuted: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${conversationId}/mute`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ isMuted: !isMuted }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`);
      }
      if (!data.success) {
        throw new Error(data.error || "Error toggling mute status");
      }
      setConversations((prev) =>
        prev.map((conv) => (conv._id === conversationId ? { ...conv, isMuted: !isMuted } : conv))
      );
      setFilteredChatList((prev) =>
        prev.map((conv) => (conv._id === conversationId ? { ...conv, isMuted: !isMuted } : conv))
      );
      socket?.emit("toggle-mute", { conversationId, isMuted: !isMuted });
      toast.success(`Notifications ${isMuted ? "unmuted" : "muted"}`);
    } catch (err: any) {
      toast.error(err.message || "Error toggling mute status");
      console.error("Error toggling mute status:", err, { conversationId });
    } finally {
      setLoading(false);
    }
  };

  // Archiver/désarchiver une conversation
const handleToggleArchive = async (conversationId: string, isArchived: boolean) => {
  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/chat/${conversationId}/archive`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ isArchived: !isArchived }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Error toggling archive status");
    }
    setConversations((prev) =>
      prev.map((conv) => (conv._id === conversationId ? { ...conv, isArchived: !isArchived } : conv))
    );
    setFilteredChatList((prev) =>
      prev.filter((conv) => (activeTab === "active" ? !conv.isArchived : conv.isArchived))
    );
    socket?.emit("toggle-archive", { conversationId, isArchived: !isArchived });

    if (selectedConversation?._id === conversationId) {
      setSelectedConversation(null);
      setMobileSelectedConversation(null);
      setMessages([]);
    }
    toast.success(`Conversation ${isArchived ? "unarchived" : "archived"}`);
  } catch (err: any) {
    toast.error(err.message || "Error toggling archive status");
    console.error("Error toggling archive status:", err, { conversationId });
  } finally {
    setLoading(false);
  }
};

  // Gérer le téléchargement de fichiers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation || !user?.id) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversationId", selectedConversation._id);
      formData.append("senderId", user.id);
      formData.append("messageType", file.type.startsWith("image/") ? "image" : "file");

      const response = await fetch(`${API_BASE_URL}/messages/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`);
      }
      if (!data.success) {
        throw new Error(data.error || "Error uploading file");
      }
      toast.success("File uploaded");
      socket?.emit("send-message", data.data);
    } catch (err: any) {
      toast.error(err.message || "Error uploading file");
      console.error("Error uploading file:", err);
    } finally {
      setLoading(false);
    }
  };

  // Gérer la sélection d'emoji
  const handleEmojiSelect = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Gérer le rendu pendant le chargement de l'authentification
  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-200"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Gérer le rendu si aucun utilisateur n'est authentifié
  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4">
          <IconMessages size={48} className="mx-auto text-gray-300" />
          <p className="text-gray-600">Please log in to access your chats.</p>
          <Button
            className="bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-xl"
            onClick={() => (window.location.href = "/sign-in-2")}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <section className="flex h-full gap-6">
          {/* Left Side - Chat List */}
          <div className="flex w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80">
            <div className="sticky top-0 z-10 -mx-4 bg-background/95 backdrop-blur-sm px-4 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none">
              <div className="flex items-center justify-between py-2">
                <div className="flex gap-2 items-center">
                  <div className="relative">
                    <h1 className="text-2xl font-bold text-black">Inbox</h1>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <IconMessages size={20} className="text-purple-300" />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setCreateConversationDialog(true)}
                  className="relative group rounded-3xl bg-pink-100 text-pink-300 hover:bg-pink-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  aria-label="New chat"
                >
                  <IconPlus size={20} className="transition-transform group-hover:duration-300" />
                  <div className="absolute inset-0 rounded-3xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </div>
              <div className="relative">
                <label className="flex h-12 w-full items-center space-x-0 rounded-3xl border-pink-50 border-input bg-pink-50 dark:bg-pink-900/20 pl-2 focus-within:outline-none focus-within:ring-2 focus-within:ring-pink-200 transition-all duration-300">
                  <IconSearch size={15} className="mr-2 stroke-pink-200" />
                  <span className="sr-only">Search</span>
                  <input
                    type="text"
                    className="w-full flex-1 bg-transparent text-sm focus-visible:outline-none placeholder:text-gray-500"
                    placeholder="Search conversations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
              <div className="mt-3 flex rounded-2xl bg-purple-50 dark:bg-purple-900/20 p-1 shadow-inner">
                <button
                  onClick={() => setActiveTab("active")}
                  className={cn(
                    "flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 transform hover:scale-[1.02]",
                    activeTab === "active"
                      ? "bg-pink-100 text-pink-500 shadow-lg ring-2 ring-pink-200/50"
                      : "text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-800/30"
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <IconMessages size={16} />
                    <span>Active</span>
                    <div className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-200 text-xs text-pink-700">
                      {conversations.filter((conv) => !conv.isArchived).length}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("archived")}
                  className={cn(
                    "flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 transform hover:scale-[1.02]",
                    activeTab === "archived"
                      ? "bg-pink-100 text-pink-500 shadow-lg ring-2 ring-pink-200/50"
                      : "text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-800/30"
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <IconArchive size={16} />
                    <span>Archived</span>
                    <div className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-200 text-xs text-purple-700">
                      {conversations.filter((conv) => conv.isArchived).length}
                    </div>
                  </div>
                </button>
              </div>
              <button
                onClick={() => setShowGroupsOnly(!showGroupsOnly)}
                className={cn(
                  "mt-3 w-full rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl",
                  showGroupsOnly
                    ? "bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 ring-2 ring-orange-200/50"
                    : "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700"
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <IconUsers size={18} className={showGroupsOnly ? "text-orange-600" : "text-purple-600"} />
                  <span>{showGroupsOnly ? "Show all" : "Show groups"}</span>
                  <div
                    className={cn(
                      "ml-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                      showGroupsOnly ? "bg-orange-200 text-orange-800" : "bg-purple-200 text-purple-800"
                    )}
                  >
                    {showGroupsOnly
                      ? conversations.length
                      : conversations.filter((conv) => isGroupConversation(conv)).length}
                  </div>
                </div>
              </button>
            </div>
            <ScrollArea className="-mx-3 h-full p-3">
              {loading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-200"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
                </div>
              )}
              {!loading && filteredChatList.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <IconMessages size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>{activeTab === "archived" ? "No archived conversations" : "No chats found"}</p>
                </div>
              )}
              {filteredChatList.map((conv) => {
                const otherUser = conv.members.find((p) => p._id !== user.id);
                const displayName = isGroupConversation(conv)
                  ? conv.members
                      .filter((m) => m._id !== user.id)
                      .map((m) => m.name)
                      .join(", ") || "Group"
                  : otherUser?.name || "Unknown";
                const isSelected = selectedConversation?._id === conv._id;
                return (
                  <Fragment key={conv._id}>
                    <div className="relative group">
                      <button
                        type="button"
                        className={cn(
                          "w-full rounded-xl px-3 py-3 text-left text-sm transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg",
                          isSelected
                            ? "bg-pink-100 text-pink-500 shadow-lg"
                            : "hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        )}
                        onClick={() => {
                          setSelectedConversation(conv);
                          setMobileSelectedConversation(conv);
                        }}
                      >
                        <div className="flex gap-3 items-center">
                          <div className="relative">
                            <Avatar className="ring-2 ring-white/20">
                              <AvatarFallback
                                className={cn(
                                  "font-semibold",
                                  isSelected ? "bg-pink-200 text-pink-500" : "bg-purple-100 text-purple-600"
                                )}
                              >
                                {isGroupConversation(conv) ? <IconUsers size={16} /> : displayName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-300 rounded-full border-2 border-white"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span
                                className={cn(
                                  "font-medium truncate",
                                  isSelected ? "text-pink-700" : "text-gray-900 dark:text-gray-100"
                                )}
                              >
                                {displayName}
                              </span>
                              {conv.lastMessage && (
                                <span className={cn("text-xs", isSelected ? "text-pink-500" : "text-gray-500")}>
                                  {format(new Date(conv.lastMessage.timestamp), "HH:mm")}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {conv.isMuted && <IconBellOff size={14} className="text-gray-500" />}
                              {isGroupConversation(conv) && <IconUsers size={14} className="text-gray-500" />}
                              <p
                                className={cn(
                                  "text-sm truncate mt-1",
                                  isSelected ? "text-pink-600" : "text-gray-600 dark:text-gray-400"
                                )}
                              >
                                {conv.lastMessage
                                  ? conv.lastMessage.sender === user.id
                                    ? `You: ${conv.lastMessage.content}`
                                    : conv.lastMessage.content
                                  : "No messages"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-200 hover:text-red-700 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConversationToDelete(conv._id);
                          setDeleteConversationDialog(true);
                        }}
                      >
                        <IconTrash size={16} />
                      </Button>
                    </div>
                    <Separator className="my-2 opacity-30" />
                  </Fragment>
                );
              })}
            </ScrollArea>
          </div>

          {/* Right Side - Chat Area */}
          {selectedConversation ? (
            <div
              className={cn(
                "absolute inset-0 left-full z-50 hidden w-full flex-1 flex-col rounded-xl border bg-yellow-50 dark:bg-yellow-900/20 shadow-xl transition-all duration-300 sm:static sm:z-auto sm:flex",
                mobileSelectedConversation && "left-0 flex"
              )}
            >
              {/* Chat Header */}
              <div className="flex-none rounded-t-xl bg-purple-100 p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex gap-3 items-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-purple-600 hover:bg-purple-200 sm:hidden"
                      onClick={() => setMobileSelectedConversation(null)}
                    >
                      <IconArrowLeft />
                    </Button>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="size-10 ring-2 ring-purple-200">
                          <AvatarFallback className="bg-purple-200 text-purple-700 font-semibold">
                            {isGroupConversation(selectedConversation) ? (
                              <IconUsers size={20} />
                            ) : (
                              selectedConversation.members.find((p) => p._id !== user.id)?.name.charAt(0) || "?"
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-300 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <h2 className="text-purple-700 font-semibold">
                          {isGroupConversation(selectedConversation)
                            ? selectedConversation.members
                                .filter((m) => m._id !== user.id)
                                .map((m) => m.name)
                                .join(", ")
                            : selectedConversation.members.find((p) => p._id !== user.id)?.name || "Unknown"}
                        </h2>
                        <p className="text-purple-500 text-sm">Online</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-purple-600 hover:bg-purple-200 rounded-lg"
                      onClick={() => handleCall("phone")}
                      disabled={isCallActive}
                    >
                      <IconPhone size={20} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-purple-600 hover:bg-purple-200 rounded-lg"
                      onClick={() => handleCall("video")}
                      disabled={isCallActive}
                    >
                      <IconVideo size={20} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-purple-600 hover:bg-purple-200 rounded-lg">
                          <IconDotsVertical size={20} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => setAddToGroupDialog(true)}>
                          <IconUserPlus className="mr-2 h-4 w-4" />
                          Add to group
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleToggleMute(selectedConversation._id, selectedConversation.isMuted || false)
                          }
                        >
                          {selectedConversation.isMuted ? (
                            <>
                              <IconBell className="mr-2 h-4 w-4" />
                              Unmute notifications
                            </>
                          ) : (
                            <>
                              <IconBellOff className="mr-2 h-4 w-4" />
                              Mute notifications
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleToggleArchive(selectedConversation._id, selectedConversation.isArchived || false)
                          }
                        >
                          <IconArchive className="mr-2 h-4 w-4" />
                          {selectedConversation.isArchived ? "Unarchive" : "Archive"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setConversationToDelete(selectedConversation._id);
                            setDeleteConversationDialog(true);
                          }}
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Messages or Call Area */}
              <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-2">
                {isCallActive ? (
                  <div className="flex flex-col gap-4 p-4 bg-black rounded-lg">
                    {callType === "video" ? (
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <video ref={localVideoRef} autoPlay muted className="w-full rounded-lg" />
                          <p className="text-white text-sm mt-2">You</p>
                        </div>
                        <div className="flex-1">
                          <video ref={remoteVideoRef} autoPlay className="w-full rounded-lg" />
                          <p className="text-white text-sm mt-2">Participant</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-white">
                        <p>Phone call in progress...</p>
                        <audio ref={localVideoRef} autoPlay muted />
                        <audio ref={remoteVideoRef} autoPlay />
                      </div>
                    )}
                    <Button variant="destructive" onClick={endCall} className="self-center">
                      End Call
                    </Button>
                  </div>
                ) : (
                  <div className="flex size-full flex-1">
                    <div className="relative -mr-4 flex flex-1 flex-col overflow-y-hidden">
                      {loading && (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-200"></div>
                          <p className="mt-2 text-sm text-muted-foreground">Loading messages...</p>
                        </div>
                      )}
                      <div
                        ref={chatContainerRef}
                        className="flex h-40 w-full flex-grow flex-col-reverse justify-start gap-4 overflow-y-auto py-2 pb-4 pr-4 scroll-smooth"
                      >
                        {Object.keys(groupedMessages).map((key) => (
                          <Fragment key={key}>
                            {groupedMessages[key].map((msg) => (
                              <div
                                key={msg._id}
                                className={cn(
                                  "chat-box max-w-72 break-words px-4 py-3 shadow-lg relative group transition-all duration-300 hover:shadow-xl",
                                  msg.sender._id === user.id
                                    ? "self-end rounded-[20px_20px_4px_20px] bg-pink-100 text-pink-700"
                                    : "self-start rounded-[20px_20px_20px_4px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                )}
                              >
                                {msg.edited && <span className="text-xs opacity-70 mr-2 italic">(edited)</span>}
                                {editingMessageId === msg._id ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      className="flex-1 bg-pink-50 border-pink-200 text-pink-700 placeholder:text-pink-500"
                                    />
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleEditMessage(msg._id)}
                                      disabled={loading}
                                      className="text-pink-600 hover:bg-pink-200"
                                    >
                                      <IconCircleCheck size={16} />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => setEditingMessageId(null)}
                                      className="text-pink-600 hover:bg-pink-200"
                                    >
                                      <IconX size={16} />
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    {msg.messageType === "text" ? (
                                      <p className="leading-relaxed">{msg.message}</p>
                                    ) : (
                                      <div>
                                        {msg.messageType === "image" && msg.attachments?.[0]?.url ? (
                                          <img
                                            src={msg.attachments[0].url}
                                            alt="Attachment"
                                            className="max-w-full rounded-lg"
                                          />
                                        ) : (
                                          msg.attachments?.[0]?.url && (
                                            <a
                                              href={msg.attachments[0].url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              {msg.attachments[0].filename}
                                            </a>
                                          )
                                        )}
                                      </div>
                                    )}
                                    <div
                                      className={cn(
                                        "mt-2 flex items-center gap-1 text-xs opacity-70",
                                        msg.sender._id === user.id && "justify-end"
                                      )}
                                    >
                                      <span>{format(new Date(msg.createdAt), "h:mm a")}</span>
                                      {msg.sender._id === user.id && msg.readBy && msg.readBy.length > 0 && (
                                        <IconCircleCheck size={12} className="text-green-500" title="Read" />
                                      )}
                                      {msg.sender._id !== user.id &&
                                        msg.readBy &&
                                        !msg.readBy.some((r) => r.user === user.id) && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleMarkAsRead(msg._id)}
                                            className="h-6 px-2 text-xs hover:bg-yellow-100 dark:hover:bg-yellow-800"
                                          >
                                            Mark as read
                                          </Button>
                                        )}
                                    </div>
                                    {msg.sender._id === user.id && !msg.deleted && (
                                      <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="h-8 w-8 bg-white hover:bg-gray-100 text-gray-700 rounded-full shadow-lg"
                                            >
                                              <IconDotsVertical size={14} />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                              onClick={() => {
                                                setEditingMessageId(msg._id);
                                                setEditContent(msg.message);
                                              }}
                                            >
                                              <IconEdit className="mr-2 h-4 w-4" />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => navigator.clipboard.writeText(msg.message)}
                                            >
                                              <IconCopy className="mr-2 h-4 w-4" />
                                              Copy
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={() => handleDeleteMessage(msg._id)}
                                              className="text-red-600"
                                            >
                                              <IconTrash className="mr-2 h-4 w-4" />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            ))}
                            <div className="text-center text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 mx-auto">
                              {key}
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {/* Message Input */}
                {!isCallActive && (
                  <form onSubmit={handleSendMessage} className="flex w-full flex-none gap-3">
                    <div className="flex flex-1 items-center gap-3 rounded-2xl border border-input bg-white dark:bg-gray-800 px-4 py-2 focus-within:outline-none focus-within:ring-2 focus-within:ring-yellow-200 shadow-lg">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-gray-500 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <IconPaperclip size={20} />
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                        accept="image/*,.pdf,.doc,.docx"
                      />
                      <label className="flex-1">
                        <span className="sr-only">Text box</span>
                        <input
                          type="text"
                          placeholder="Type your message..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          disabled={loading || !selectedConversation}
                          className="h-8 w-full bg-transparent focus-visible:outline-none placeholder:text-gray-500"
                        />
                      </label>
                      <DropdownMenu open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                          >
                            <IconMoodSmile size={20} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="p-2">
                          <div className="grid grid-cols-5 gap-2">
                            {EMOJIS.map((emoji) => (
                              <Button
                                key={emoji}
                                variant="ghost"
                                className="text-xl"
                                onClick={() => handleEmojiSelect(emoji)}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading || !messageInput.trim() || !selectedConversation}
                      className="h-12 w-12 rounded-2xl bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <IconSend size={20} />
                    </Button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "absolute inset-0 left-full z-50 hidden w-full flex-1 flex-col justify-center items-center rounded-xl border bg-yellow-50 dark:bg-yellow-900/20 shadow-xl transition-all duration-300 sm:static sm:z-auto sm:flex"
              )}
            >
              <div className="flex flex-col items-center space-y-6 text-center max-w-md">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-pink-100 shadow-lg">
                    <IconMessages className="h-10 w-10 text-pink-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-300 rounded-full border-4 border-white animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  <h1 className="text-2xl font-bold text-purple-500">Your messages</h1>
                  <p className="text-gray-600 dark:text-gray-400">Send a message to start a conversation.</p>
                </div>
                <Button
                  className="bg-pink-100 hover:bg-pink-200 text-pink-700 px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => setCreateConversationDialog(true)}
                >
                  <IconPlus className="mr-2 h-5 w-5" />
                  New conversation
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Dialog for creating a new conversation */}
        <Dialog open={createConversationDialogOpened} onOpenChange={setCreateConversationDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-purple-500">New conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select a user:</label>
                <Select onValueChange={setSelectedUserId} disabled={loading || users.length === 0}>
                  <SelectTrigger className="rounded-xl border-2 focus:border-pink-200">
                    <SelectValue placeholder="Choose someone..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((u) => u._id !== user.id)
                      .map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-yellow-100 text-yellow-700">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {loading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-200"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Creating...</p>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCreateConversationDialog(false)}
                  disabled={loading}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedUserId) handleNewChat(selectedUserId);
                    else toast.error("Please select a user");
                  }}
                  disabled={loading || !selectedUserId}
                  className="bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-xl"
                >
                  <IconPlus className="mr-2 h-4 w-4" />
                  Start
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog for adding to group */}
        <Dialog open={addToGroupDialogOpened} onOpenChange={setAddToGroupDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-purple-500">Add to group</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select a user:</label>
                <Select onValueChange={setSelectedUserId} disabled={loading || users.length === 0}>
                  <SelectTrigger className="rounded-xl border-2 focus:border-pink-200">
                    <SelectValue placeholder="Choose someone..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(
                        (u) => u._id !== user.id && !selectedConversation?.members.some((m) => m._id === u._id)
                      )
                      .map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-yellow-100 text-yellow-700">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {loading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-200"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Adding...</p>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setAddToGroupDialog(false)}
                  disabled={loading}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedUserId && selectedConversation)
                      handleAddToGroup(selectedConversation._id, selectedUserId);
                    else toast.error("Please select a user");
                  }}
                  disabled={loading || !selectedUserId}
                  className="bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-xl"
                >
                  <IconUserPlus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog for deleting conversation */}
        <Dialog open={deleteConversationDialogOpened} onOpenChange={setDeleteConversationDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-600">Delete conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <IconTrash className="h-6 w-6 text-red-500" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-red-200">Are you sure?</p>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    This action is irreversible. All messages will be deleted.
                  </p>
                </div>
              </div>
              {loading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Deleting...</p>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteConversationDialog(false);
                    setConversationToDelete(null);
                  }}
                  disabled={loading}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (conversationToDelete) handleDeleteConversation(conversationToDelete);
                  }}
                  disabled={loading}
                  className="rounded-xl bg-red-500 hover:bg-red-600"
                >
                  <IconTrash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Main>
    </>
  );
}