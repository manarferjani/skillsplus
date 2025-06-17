// Chats.tsx
'use client'

import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useMemo } from 'react'
import { Fragment } from 'react/jsx-runtime'
import { format } from 'date-fns'
import { IconFileText } from '@tabler/icons-react'
// Importer le hook useAuth
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
} from '@tabler/icons-react'
import toast from 'react-hot-toast'
import { io, type Socket } from 'socket.io-client'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/context/SidebarContext'
import { useAuth } from '@/context/authContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

// Chats.tsx

// Types (inchangés, inclus pour référence)
interface Conversation {
  _id: string
  members: Array<{ _id: string; name: string; email: string }>
  lastMessage?: {
    content: string
    sender: string
    timestamp: string
  }
  isMuted?: boolean
  isArchived?: boolean
}

interface Message {
  _id: string
  conversation: string
  sender: { _id: string; name: string }
  message: string
  messageType: 'text' | 'image' | 'file' | 'audio' | 'video'
  attachments: Array<{
    url: string
    filename: string
    mimeType: string
    size: number
  }>
  createdAt: string
  edited?: boolean
  editedAt?: string
  deleted?: boolean
  deletedAt?: string
  readBy?: Array<{ user: string; readAt: string }>
  isTemp?: boolean // Ajout du drapeau isTemp
}

interface ChatUser {
  _id: string
  name: string
  email: string
}
interface FilePreview {
  file: File
  url: string
  type: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_FILES = 5
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
]
const API_BASE_URL = 'http://localhost:5000/api'

const EMOJIS = ['😊', '😂', '😍', '👍', '🙌', '😎', '😢', '😡', '🚀', '💡']

export default function Chats() {
  const { user, isLoading: authLoading } = useAuth() // Utiliser useAuth pour récupérer l'utilisateur
  const { setUnreadCount } = useSidebar()
  const [users, setUsers] = useState<ChatUser[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null)
  const [mobileSelectedConversation, setMobileSelectedConversation] =
    useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [filteredChatList, setFilteredChatList] = useState<Conversation[]>([])
  const [groupedMessages, setGroupedMessages] = useState<{
    [key: string]: Message[]
  }>({})
  const [editContent, setEditContent] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [visibleGroupCount, setVisibleGroupCount] = useState<number>(3) // Afficher les 3 derniers groupes par défaut
  const isLoadingMoreRef = useRef<boolean>(false) // Éviter les chargements multiples
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [createConversationDialogOpened, setCreateConversationDialog] =
    useState(false)
  const [deleteConversationDialogOpened, setDeleteConversationDialog] =
    useState(false)
  const [addToGroupDialogOpened, setAddToGroupDialog] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [activeTab, setActiveTab] = useState('active')
  const [showGroupsOnly, setShowGroupsOnly] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [messageInput, setMessageInput] = useState('')
  const [socket, setSocket] = useState<Socket | null>(null)
  const [callType, setCallType] = useState<'phone' | 'video' | null>(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const [incomingCall, setIncomingCall] = useState<{
    conversationId: string
    offer: any
    callerId: string
  } | null>(null)
  // Valider le format ObjectId
  const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id)

  // Vérifier si une conversation est un groupe
  const isGroupConversation = (conv: Conversation) => conv.members.length > 2
  useEffect(() => {
    if (!socket) return

    socket.on('offer', ({ offer, conversationId, callerId }) => {
      console.log(
        `Received offer for conversation ${conversationId} from ${callerId}`
      )
      setIncomingCall({ conversationId, offer, callerId })
      toast.success(
        `Incoming ${callType === 'video' ? 'video' : 'phone'} call from ${callerId}`
      )
    })

    socket.on('call-rejected', () => {
      endCall()
      toast.error('Call was rejected by the recipient')
    })

    return () => {
      socket.off('offer')
      socket.off('call-rejected')
    }
  }, [socket, callType])

  const acceptCall = async () => {
    if (!incomingCall || !socket || !user?.id) {
      console.error(
        'Cannot accept call: missing incomingCall, socket, or user ID',
        {
          incomingCall,
          socket,
          userId: user?.id,
        }
      )
      toast.error('Cannot accept call')
      return
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    const configuration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    }

    peerConnectionRef.current = new RTCPeerConnection(configuration)
    console.log('Created new RTCPeerConnection for accepting call')

    // Gérer les candidats ICE
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate from acceptor', event.candidate)
        socket.emit('ice-candidate', {
          conversationId: incomingCall.conversationId,
          candidate: event.candidate,
        })
      }
    }

    // Gérer les flux distants
    peerConnectionRef.current.ontrack = (event) => {
      console.log('Received remote track', event)
      remoteStreamRef.current = event.streams[0]
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current
        console.log('Set remote video stream')
      }
    }

    // Suivre l'état de la connexion
    peerConnectionRef.current.oniceconnectionstatechange = () => {
      console.log(
        'ICE connection state:',
        peerConnectionRef.current?.iceConnectionState
      )
      if (peerConnectionRef.current?.iceConnectionState === 'failed') {
        toast.error('Call connection failed')
        endCall()
      }
    }

    setCallType(
      incomingCall.conversationId === selectedConversation?._id
        ? callType
        : 'video'
    )
    setIsCallActive(true)

    try {
      const constraints = { audio: true, video: callType === 'video' }
      console.log('Requesting media with constraints:', constraints)
      localStreamRef.current =
        await navigator.mediaDevices.getUserMedia(constraints)
      console.log('Got local stream:', localStreamRef.current)
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = localStreamRef.current
        console.log('Set local video stream')
      }
      localStreamRef.current.getTracks().forEach((track) => {
        if (peerConnectionRef.current) {
          peerConnectionRef.current.addTrack(track, localStreamRef.current!)
          console.log('Added track to peer connection:', track)
        }
      })

      console.log('Setting remote description with offer:', incomingCall.offer)
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      )
      console.log('Creating answer')
      const answer = await peerConnectionRef.current.createAnswer()
      console.log('Setting local description with answer:', answer)
      await peerConnectionRef.current.setLocalDescription(answer)
      console.log(
        'Emitting answer to conversation:',
        incomingCall.conversationId
      )
      socket.emit('answer', {
        conversationId: incomingCall.conversationId,
        answer,
      })
      setIncomingCall(null)
      toast.success('Call accepted')
    } catch (err: any) {
      console.error('Error accepting call:', err)
      toast.error(`Failed to accept call: ${err.message}`)
      endCall()
    }
  }

  const rejectCall = () => {
    if (incomingCall && socket) {
      socket.emit('reject-call', {
        conversationId: incomingCall.conversationId,
      })
    }
    setIncomingCall(null)
  }
  // Calculer le nombre de messages non lus
  const getUnreadMessagesCount = () => {
    if (!user?.id) return 0
    let totalUnread = 0
    conversations.forEach((conv) => {
      const convMessages = messages.filter(
        (msg) => msg.conversation === conv._id
      )
      const unread = convMessages.filter(
        (msg) => !msg.readBy?.some((r) => r.user === user.id)
      ).length
      totalUnread += unread
    })
    return totalUnread
  }

  useEffect(() => {
    const count = getUnreadMessagesCount()
    setUnreadCount(count)
  }, [conversations, messages, user?.id, setUnreadCount])

  // Initialiser Socket.IO
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
      withCredentials: true,
    })
    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO server')
      if (user?.id) {
        newSocket.emit('register-user', user.id) // Associer le socket à l'userId
        console.log(`Emitted register-user for user ${user.id}`)
      }
    })

    newSocket.on('error', (error) => {
      console.error('Socket error:', error)
      toast.error('Socket error occurred')
    })

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err)
      toast.error('Failed to connect to chat server. Please try again later.')
    })

    // Gestion des messages (votre code existant)
    newSocket.on('receive-message', (message: Message) => {
      if (message.sender._id === user?.id) return // Ignorer les messages envoyés par l'utilisateur actuel
      if (message.conversation === selectedConversation?._id) {
        setMessages((prev) => {
          // Vérifier si le message existe déjà ou correspond à un message temporaire
          if (
            prev.some(
              (m) =>
                m._id === message._id ||
                (m.isTemp && m.message === message.message)
            )
          ) {
            // Remplacer le message temporaire par le message réel
            return prev.map((m) =>
              m._id === message._id ||
              (m.isTemp && m.message === message.message)
                ? message
                : m
            )
          }
          return [...prev, message]
        })
      }
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === message.conversation
            ? {
                ...conv,
                lastMessage: {
                  content:
                    message.message ||
                    (message.attachments.length ? '[Attachment]' : ''),
                  sender: message.sender._id,
                  timestamp: message.createdAt,
                },
              }
            : conv
        )
      )
    })
    newSocket.on('delete-message', (messageId: string) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId))
    })

    newSocket.on('last-message-updated', ({ conversationId, lastMessage }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversationId
            ? { ...conv, lastMessage: lastMessage || undefined }
            : conv
        )
      )
    })
    newSocket.on('conversation-deleted', (conversationId: string) => {
      setConversations((prev) =>
        prev.filter((conv) => conv._id !== conversationId)
      )
      setFilteredChatList((prev) =>
        prev.filter((conv) => conv._id !== conversationId)
      )
      if (
        selectedConversation?._id === conversationId ||
        mobileSelectedConversation?._id === conversationId
      ) {
        setSelectedConversation(null)
        setMobileSelectedConversation(null)
        setMessages([])
      }
    })

    return () => {
      newSocket.off('receive-message')
      newSocket.off('delete-message')
      newSocket.off('last-message-updated')
      newSocket.off('conversation-deleted')
      newSocket.disconnect()
    }
  }, [selectedConversation, user?.id])
  // Rejoindre une conversation et gérer WebRTC
  useEffect(() => {
    if (!selectedConversation || !socket) return

    socket.emit('join-conversation', selectedConversation._id)

    socket.on('offer', async ({ offer }) => {
      if (!peerConnectionRef.current) return
      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        )
        const answer = await peerConnectionRef.current.createAnswer()
        await peerConnectionRef.current.setLocalDescription(answer)
        socket.emit('answer', {
          conversationId: selectedConversation._id,
          answer,
        })
      } catch (err) {
        console.error('Error handling offer:', err)
        toast.error('Failed to process call offer')
      }
    })

    socket.on('answer', async ({ answer }) => {
      if (!peerConnectionRef.current) return
      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        )
      } catch (err) {
        console.error('Error handling answer:', err)
        toast.error('Failed to process call answer')
      }
    })

    socket.on('ice-candidate', async ({ candidate }) => {
      if (!peerConnectionRef.current) return
      try {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        )
      } catch (err) {
        console.error('Error adding ICE candidate:', err)
      }
    })

    return () => {
      socket.off('offer')
      socket.off('answer')
      socket.off('ice-candidate')
    }
  }, [selectedConversation, socket])

  // Démarrer un appel
  const startCall = async (type: 'phone' | 'video') => {
    if (!selectedConversation || !socket || !user?.id) {
      toast.error('No conversation selected or socket not connected')
      return
    }

    setCallType(type)
    setIsCallActive(true)

    const configuration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    }

    peerConnectionRef.current = new RTCPeerConnection(configuration)

    try {
      const constraints = { audio: true, video: type === 'video' }
      localStreamRef.current =
        await navigator.mediaDevices.getUserMedia(constraints)
      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = localStreamRef.current
      }
      localStreamRef.current.getTracks().forEach((track) => {
        if (peerConnectionRef.current) {
          peerConnectionRef.current.addTrack(track, localStreamRef.current!)
        }
      })
    } catch (err) {
      console.error('Media error:', err)
      toast.error('Failed to access microphone or camera')
      endCall()
      return
    }

    peerConnectionRef.current.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0]
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current
      }
    }

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          conversationId: selectedConversation._id,
          candidate: event.candidate,
        })
      }
    }

    try {
      const offer = await peerConnectionRef.current.createOffer()
      await peerConnectionRef.current.setLocalDescription(offer)
      socket.emit('offer', {
        conversationId: selectedConversation._id,
        offer,
        callerId: user.id,
      })
      console.log(
        `Emitted offer for conversation ${selectedConversation._id} from ${user.id}`
      )
    } catch (err) {
      console.error('Error creating offer:', err)
      toast.error('Failed to initiate call')
      endCall()
    }
  }
  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    remoteStreamRef.current = null
    setIsCallActive(false)
    setCallType(null)
    toast.success('Call ended')
  }

  const handleCall = (type: 'phone' | 'video') => {
    startCall(type)
  }

  // Récupérer les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/getallUsers`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })
        if (!response.ok) throw new Error('Network error')
        const result = await response.json()
        if (!result.success)
          throw new Error(result.message || 'Error fetching users')
        setUsers(
          result.data.map((user: any) => ({
            _id: user._id,
            name: user.name,
            email: user.email,
          }))
        )
      } catch (err: any) {
        toast.error('Error fetching users')
        console.error(err)
      }
    }
    fetchUsers()
  }, [])

  // Récupérer les conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user?.id) return // Ne pas faire d'appel si pas d'utilisateur
      setLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/chat/${user.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })
        const data = await response.json()
        if (!response.ok)
          throw new Error(`Network error: ${data.error || response.statusText}`)
        if (!data.success)
          throw new Error(data.error || 'Error fetching conversations')
        setConversations(data.data)
        setFilteredChatList(data.data)
      } catch (err: any) {
        toast.error(err.message || 'Error fetching conversations')
        console.error('Error fetching conversations:', err)
      } finally {
        setLoading(false)
      }
    }
    if (!authLoading) fetchConversations()
  }, [user?.id, authLoading])

  // Filtrer les conversations
  useEffect(() => {
    if (!user?.id) return
    setFilteredChatList(
      conversations.filter((conv) => {
        const otherUser = conv.members.find((p) => p._id !== user.id)
        const matchesSearch = otherUser?.name
          .toLowerCase()
          .includes(search.toLowerCase())
        const matchesTab =
          activeTab === 'active' ? !conv.isArchived : conv.isArchived
        const matchesGroupFilter = showGroupsOnly
          ? isGroupConversation(conv)
          : true
        return matchesSearch && matchesTab && matchesGroupFilter
      })
    )
  }, [search, conversations, user?.id, activeTab, showGroupsOnly])

  // Récupérer les messages
  const fetchMessages = async () => {
    if (!selectedConversation) return
    if (!isValidObjectId(selectedConversation._id)) {
      toast.error('Invalid conversation ID')
      return
    }
    setLoading(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/messages/${selectedConversation._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`)
      }
      if (!data.success) {
        throw new Error(data.error || 'Error fetching messages')
      }
      setMessages(data.data || [])
    } catch (err: any) {
      toast.error(err.message || 'Error fetching messages')
      console.error('Error fetching messages:', err, {
        conversationId: selectedConversation._id,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [selectedConversation])

  // Grouper les messages par date
  const computedGroupedMessages = useMemo(() => {
    return messages
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime()
        const timeB = new Date(b.createdAt).getTime()
        return timeA - timeB // Garder le tri chronologique normal
      })
      .reduce(
        (acc, msg) => {
          const date = format(new Date(msg.createdAt), 'MMMM d, yyyy')
          acc[date] = acc[date] || []
          acc[date].push(msg)
          return acc
        },
        {} as { [key: string]: Message[] }
      )
  }, [messages])
  // Utiliser useEffect pour mettre à jour l'état avec la valeur calculée
  useEffect(() => {
    setGroupedMessages(computedGroupedMessages)
  }, [computedGroupedMessages])

  // Effets existants pour le défilement
  // Scroll automatique amélioré pour les nouveaux messages
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    const isAtBottom =
      container.scrollHeight - container.scrollTop <=
      container.clientHeight + 100

    if (isAtBottom) {
      // Scroll fluide vers le bas
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])

  // Gestion du bouton scroll to bottom
  useEffect(() => {
    const handleScroll = () => {
      if (!chatContainerRef.current) return
      const { scrollHeight, scrollTop } = chatContainerRef.current

      // Load more messages if near top
      if (
        scrollTop < 100 &&
        visibleGroupCount < Object.keys(groupedMessages).length &&
        !isLoadingMoreRef.current
      ) {
        isLoadingMoreRef.current = true
        const previousScrollHeight = scrollHeight
        setVisibleGroupCount((prev) => {
          const newCount = prev + 3
          setTimeout(() => {
            if (chatContainerRef.current) {
              const newScrollHeight = chatContainerRef.current.scrollHeight
              chatContainerRef.current.scrollTop =
                newScrollHeight - previousScrollHeight + scrollTop
            }
            isLoadingMoreRef.current = false
          }, 100)
          return newCount
        })
      }
    }

    const container = chatContainerRef.current
    container?.addEventListener('scroll', handleScroll)
    return () => container?.removeEventListener('scroll', handleScroll)
  }, [visibleGroupCount, groupedMessages])
  // Scroll initial vers le bas lors du changement de conversation
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      setTimeout(() => {
        const container = chatContainerRef.current
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth',
          })
        }
      }, 100)
    }
  }, [selectedConversation])
  // Créer une nouvelle conversation
  const handleNewChat = async (otherUserId: string) => {
    if (!otherUserId || !user?.id) {
      toast.error('Invalid user selection')
      return
    }
    if (!users.some((u) => u._id === otherUserId)) {
      toast.error('Selected user not found')
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ members: [user.id, otherUserId] }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`)
      }
      if (!data.success) {
        throw new Error(data.error || 'Error creating conversation')
      }
      setConversations((prev) => [...prev, data.data])
      setFilteredChatList((prev) => [...prev, data.data])
      setSelectedConversation(data.data)
      setMobileSelectedConversation(data.data)
      setCreateConversationDialog(false)
      socket?.emit('create-conversation', data.data)
      toast.success('Conversation created')
    } catch (err: any) {
      toast.error(err.message || 'Error creating conversation')
      console.error('Error creating conversation:', err, {
        userId: user.id,
        otherUserId,
      })
    } finally {
      setLoading(false)
    }
  }
  const scrollToBottom = () => {
    const container = chatContainerRef.current
    if (container) {
      const shouldAutoScroll =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 100
      if (shouldAutoScroll) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        })
      }
    }
  }

  // Ajouter un useEffect pour le défilement automatique
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConversation || !user?.id) return
    if (!messageInput.trim() && !filePreviews.length) return
    if (
      !isValidObjectId(selectedConversation._id) ||
      !isValidObjectId(user.id)
    ) {
      toast.error('Invalid conversation or user ID')
      return
    }

    setLoading(true)

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const tempMessage: Message = {
      _id: tempId,
      conversation: selectedConversation._id,
      sender: { _id: user.id, name: user.name || 'You' },
      message: messageInput || '',
      messageType: filePreviews.length
        ? filePreviews[0].type.startsWith('image/')
          ? 'image'
          : 'file'
        : 'text',
      attachments: filePreviews.length
        ? filePreviews.map(({ file, type }) => ({
            url: URL.createObjectURL(file),
            filename: file.name,
            mimeType: type,
            size: file.size,
          }))
        : [],
      createdAt: new Date().toISOString(),
      readBy: [],
      isTemp: true,
    }

    setMessages((prev) => [...prev, tempMessage])
    setConversations((prev) =>
      prev.map((conv) =>
        conv._id === selectedConversation._id
          ? {
              ...conv,
              lastMessage: {
                content: messageInput || '[Attachment]',
                sender: user.id,
                timestamp: new Date().toISOString(),
              },
            }
          : conv
      )
    )

    try {
      // Gérer les fichiers séparément
      if (filePreviews.length) {
        await handleFileUpload(tempId)
      }

      // Gérer les messages textuels uniquement si messageInput existe
      if (messageInput.trim()) {
        const response = await fetch(`${API_BASE_URL}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            conversationId: selectedConversation._id,
            senderId: user.id,
            message: messageInput,
            messageType: 'text',
          }),
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || `Network error: ${response.statusText}`)
        }
        if (!data.success) {
          throw new Error(data.error || 'Error sending message')
        }

        const newMessage: Message = {
          _id: data.data._id,
          conversation: selectedConversation._id,
          sender: { _id: user.id, name: user.name || 'You' },
          message: data.data.message,
          messageType: data.data.messageType,
          attachments: data.data.attachments || [],
          createdAt: data.data.createdAt,
          readBy: data.data.readBy || [],
        }

        setMessages((prev) =>
          prev.map((msg) => (msg._id === tempId ? newMessage : msg))
        )
        socket?.emit('send-message', newMessage)
      }

      setMessageInput('')
      setFilePreviews([]) // Réinitialiser les prévisualisations après envoi
      toast.success('Message sent')
    } catch (err: any) {
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId))
      socket?.emit('send-message-error', {
        error: err.message,
        conversationId: selectedConversation._id,
      })
      toast.error(err.message || 'Error sending message')
      console.error(err)
    } finally {
      setLoading(false)
      setUploading(false) // S'assurer que uploading est réinitialisé
    }
  }

  // Modifier un message
  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ message: editContent }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`)
      }
      if (!data.success) {
        throw new Error(data.error || 'Error editing message')
      }
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? data.data : msg))
      )
      socket?.emit('edit-message', data.data)
      setEditingMessageId(null)
      setEditContent('')
      toast.success('Message edited')
    } catch (err: any) {
      toast.error(err.message || 'Error editing message')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Supprimer un message
  const handleDeleteMessage = async (messageId: string) => {
    if (!isValidObjectId(messageId)) {
      toast.error('Invalid message ID')
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`)
      }
      if (!data.success) {
        throw new Error(data.error || 'Error deleting message')
      }
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId))
      if (selectedConversation) {
        await fetchMessages()
      }
      socket?.emit('delete-message', messageId)
      toast.success('Message deleted')
    } catch (err: any) {
      console.error('Error deleting message:', err, { messageId })
      toast.error(err.message || 'Failed to delete message')
    } finally {
      setLoading(false)
    }
  }

  // Marquer comme lu
  const handleMarkAsRead = async (messageId: string) => {
    if (!user?.id) return
    try {
      const response = await fetch(
        `${API_BASE_URL}/messages/${messageId}/read`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ userId: user.id }),
        }
      )
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`)
      }
      if (!data.success) {
        throw new Error(data.error || 'Error marking message as read')
      }
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? data.data : msg))
      )
      toast.success('Message marked as read')
    } catch (err: any) {
      toast.error(err.message || 'Error marking message as read')
      console.error(err)
    }
  }

  // Supprimer une conversation
  const handleDeleteConversation = async (conversationId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${conversationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`)
      }
      if (!data.success) {
        throw new Error(data.error || 'Error deleting conversation')
      }
      setConversations((prev) =>
        prev.filter((conv) => conv._id !== conversationId)
      )
      setFilteredChatList((prev) =>
        prev.filter((conv) => conv._id !== conversationId)
      )
      socket?.emit('delete-conversation', conversationId)
      if (selectedConversation?._id === conversationId) {
        setSelectedConversation(null)
        setMobileSelectedConversation(null)
        setMessages([])
      }
      setDeleteConversationDialog(false)
      setConversationToDelete(null)
      toast.success('Conversation deleted')
    } catch (err: any) {
      toast.error(err.message || 'Error deleting conversation')
      console.error('Error deleting conversation:', err, { conversationId })
    } finally {
      setLoading(false)
    }
  }

  // Ajouter un utilisateur au groupe
  const handleAddToGroup = async (conversationId: string, userId: string) => {
    if (!userId || !conversationId) {
      toast.error('Invalid user or conversation selection')
      return
    }
    setLoading(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/${conversationId}/add-member`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ userId }),
        }
      )
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`)
      }
      if (!data.success) {
        throw new Error(data.error || 'Error adding user to group')
      }
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversationId
            ? { ...conv, members: data.data.members }
            : conv
        )
      )
      setFilteredChatList((prev) =>
        prev.map((conv) =>
          conv._id === conversationId
            ? { ...conv, members: data.data.members }
            : conv
        )
      )
      socket?.emit('update-group-members', {
        conversationId,
        members: data.data.members,
      })
      setAddToGroupDialog(false)
      toast.success('User added to group')
    } catch (err: any) {
      toast.error(err.message || 'Error adding user to group')
      console.error('Error adding user to group:', err, {
        conversationId,
        userId,
      })
    } finally {
      setLoading(false)
    }
  }

  // Activer/désactiver les notifications
  const handleToggleMute = async (conversationId: string, isMuted: boolean) => {
    setLoading(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/${conversationId}/mute`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ isMuted: !isMuted }),
        }
      )
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`)
      }
      if (!data.success) {
        throw new Error(data.error || 'Error toggling mute status')
      }
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversationId ? { ...conv, isMuted: !isMuted } : conv
        )
      )
      setFilteredChatList((prev) =>
        prev.map((conv) =>
          conv._id === conversationId ? { ...conv, isMuted: !isMuted } : conv
        )
      )
      socket?.emit('toggle-mute', { conversationId, isMuted: !isMuted })
      toast.success(`Notifications ${isMuted ? 'unmuted' : 'muted'}`)
    } catch (err: any) {
      toast.error(err.message || 'Error toggling mute status')
      console.error('Error toggling mute status:', err, { conversationId })
    } finally {
      setLoading(false)
    }
  }

  // Archiver/désarchiver une conversation
  const handleToggleArchive = async (
    conversationId: string,
    isArchived: boolean
  ) => {
    setLoading(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/${conversationId}/archive`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ isArchived: !isArchived }),
        }
      )
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error toggling archive status')
      }
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversationId
            ? { ...conv, isArchived: !isArchived }
            : conv
        )
      )
      setFilteredChatList((prev) =>
        prev.filter((conv) =>
          activeTab === 'active' ? !conv.isArchived : conv.isArchived
        )
      )
      socket?.emit('toggle-archive', {
        conversationId,
        isArchived: !isArchived,
      })

      if (selectedConversation?._id === conversationId) {
        setSelectedConversation(null)
        setMobileSelectedConversation(null)
        setMessages([])
      }
      toast.success(`Conversation ${isArchived ? 'unarchived' : 'archived'}`)
    } catch (err: any) {
      toast.error(err.message || 'Error toggling archive status')
      console.error('Error toggling archive status:', err, { conversationId })
    } finally {
      setLoading(false)
    }
  }
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`)
      return
    }

    const validFiles: FilePreview[] = []
    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error(`File type ${file.type} not supported`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          `File ${file.name} exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
        )
        continue
      }
      validFiles.push({
        file,
        url: URL.createObjectURL(file),
        type: file.type,
      })
    }

    setFilePreviews((prev) => [...prev, ...validFiles])
    if (fileInputRef.current) fileInputRef.current.value = '' // Réinitialiser l'input
  }

  // Gérer le téléchargement de fichiers
  const handleFileUpload = async (tempId: string) => {
    if (!filePreviews.length || !selectedConversation || !user?.id) return
    setUploading(true)

    try {
      const formData = new FormData()
      filePreviews.forEach(({ file }) => {
        formData.append(`files`, file)
      })
      formData.append('conversationId', selectedConversation._id)
      formData.append('senderId', user.id)
      formData.append(
        'messageType',
        filePreviews[0].type.startsWith('image/') ? 'image' : 'file'
      )

      const response = await fetch(`${API_BASE_URL}/messages/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })

      let data
      try {
        data = await response.json()
      } catch (err) {
        console.error('Invalid server response:', await response.text())
        throw new Error('Invalid server response')
      }

      if (!response.ok) {
        throw new Error(data.error || `Network error: ${response.statusText}`)
      }
      if (!data.success) {
        throw new Error(data.error || 'Error uploading files')
      }

      // Replace the temporary message with the server response
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? { ...data.data, isTemp: false } : msg
        )
      )
      socket?.emit('send-message', data.data)
      toast.success('Files uploaded successfully')
      setFilePreviews([])
    } catch (err: any) {
      toast.error(err.message || 'Error uploading files')
      console.error('Upload error:', err)
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId))
    } finally {
      setUploading(false)
    }
  }
  // Gérer la sélection d'emoji
  const handleEmojiSelect = (emoji: string) => {
    setMessageInput((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  // Gérer le rendu pendant le chargement de l'authentification
  if (authLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='space-y-4 text-center'>
          <div className='inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-pink-200'></div>
          <p className='text-gray-600'>Loading authentication...</p>
        </div>
      </div>
    )
  }

  // Gérer le rendu si aucun utilisateur n'est authentifié
  if (!user) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='space-y-4 text-center'>
          <IconMessages size={48} className='mx-auto text-gray-300' />
          <p className='text-gray-600'>Please log in to access your chats.</p>
          <Button
            className='rounded-xl bg-pink-100 text-pink-700 hover:bg-pink-200'
            onClick={() => (window.location.href = '/sign-in-2')}
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <section className='flex min-h-0 flex-1 gap-6 overflow-hidden'>
          {/* Left Side - Chat List */}
          <div className='flex w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80'>
            <div className='sticky top-0 z-10 -mx-4 bg-background/95 px-4 pb-3 shadow-md backdrop-blur-sm sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none'>
              <div className='flex items-center justify-between py-2'>
                <div className='flex items-center gap-2'>
                  <div className='relative'>
                    <h1 className='text-2xl font-bold text-black'>Inbox</h1>
                    <div className='absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-green-400'></div>
                  </div>
                  <IconMessages size={20} className='text-purple-300' />
                </div>
                <Button
                  size='icon'
                  variant='ghost'
                  onClick={() => setCreateConversationDialog(true)}
                  className='group relative transform rounded-3xl bg-pink-100 text-pink-300 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-pink-200 hover:shadow-xl'
                  aria-label='New chat'
                >
                  <IconPlus
                    size={20}
                    className='transition-transform group-hover:duration-300'
                  />
                  <div className='absolute inset-0 rounded-3xl bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100'></div>
                </Button>
              </div>
              <div className='relative'>
                <label className='flex h-12 w-full items-center space-x-0 rounded-3xl border-input border-pink-50 bg-pink-50 pl-2 transition-all duration-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-pink-200 dark:bg-pink-900/20'>
                  <IconSearch size={15} className='mr-2 stroke-pink-200' />
                  <span className='sr-only'>Search</span>
                  <input
                    type='text'
                    className='w-full flex-1 bg-transparent text-sm placeholder:text-gray-500 focus-visible:outline-none'
                    placeholder='Search conversations...'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
              <div className='mt-3 flex rounded-2xl bg-purple-50 p-1 shadow-inner dark:bg-purple-900/20'>
                <button
                  onClick={() => setActiveTab('active')}
                  className={cn(
                    'flex-1 transform rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:scale-[1.02]',
                    activeTab === 'active'
                      ? 'bg-pink-100 text-pink-500 shadow-lg ring-2 ring-pink-200/50'
                      : 'text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-800/30'
                  )}
                >
                  <div className='flex items-center justify-center gap-2'>
                    <IconMessages size={16} />
                    <span>Active</span>
                    <div className='ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-200 text-xs text-pink-700'>
                      {conversations.filter((conv) => !conv.isArchived).length}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('archived')}
                  className={cn(
                    'flex-1 transform rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:scale-[1.02]',
                    activeTab === 'archived'
                      ? 'bg-pink-100 text-pink-500 shadow-lg ring-2 ring-pink-200/50'
                      : 'text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-800/30'
                  )}
                >
                  <div className='flex items-center justify-center gap-2'>
                    <IconArchive size={16} />
                    <span>Archived</span>
                    <div className='ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-200 text-xs text-purple-700'>
                      {conversations.filter((conv) => conv.isArchived).length}
                    </div>
                  </div>
                </button>
              </div>
              <button
                onClick={() => setShowGroupsOnly(!showGroupsOnly)}
                className={cn(
                  'mt-3 w-full transform rounded-2xl px-4 py-3 text-sm font-medium shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl',
                  showGroupsOnly
                    ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 ring-2 ring-orange-200/50'
                    : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700'
                )}
              >
                <div className='flex items-center justify-center gap-2'>
                  <IconUsers
                    size={18}
                    className={
                      showGroupsOnly ? 'text-orange-600' : 'text-purple-600'
                    }
                  />
                  <span>{showGroupsOnly ? 'Show all' : 'Show groups'}</span>
                  <div
                    className={cn(
                      'ml-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                      showGroupsOnly
                        ? 'bg-orange-200 text-orange-800'
                        : 'bg-purple-200 text-purple-800'
                    )}
                  >
                    {showGroupsOnly
                      ? conversations.length
                      : conversations.filter((conv) =>
                          isGroupConversation(conv)
                        ).length}
                  </div>
                </div>
              </button>
            </div>
            <ScrollArea className='-mx-3 h-full p-3'>
              {loading && (
                <div className='py-8 text-center'>
                  <div className='inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-pink-200'></div>
                  <p className='mt-2 text-sm text-muted-foreground'>
                    Loading...
                  </p>
                </div>
              )}
              {!loading && filteredChatList.length === 0 && (
                <div className='py-8 text-center text-muted-foreground'>
                  <IconMessages
                    size={48}
                    className='mx-auto mb-4 text-gray-300'
                  />
                  <p>
                    {activeTab === 'archived'
                      ? 'No archived conversations'
                      : 'No chats found'}
                  </p>
                </div>
              )}
              {filteredChatList.map((conv) => {
                const otherUser = conv.members.find((p) => p._id !== user.id)
                const displayName = isGroupConversation(conv)
                  ? conv.members
                      .filter((m) => m._id !== user.id)
                      .map((m) => m.name)
                      .join(', ') || 'Group'
                  : otherUser?.name || 'Unknown'
                const isSelected = selectedConversation?._id === conv._id
                return (
                  <Fragment key={conv._id}>
                    <div className='group relative'>
                      <button
                        type='button'
                        className={cn(
                          'w-full transform rounded-xl px-3 py-3 text-left text-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
                          isSelected
                            ? 'bg-pink-100 text-pink-500 shadow-lg'
                            : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'
                        )}
                        onClick={() => {
                          setSelectedConversation(conv)
                          setMobileSelectedConversation(conv)
                        }}
                      >
                        <div className='flex items-center gap-3'>
                          <div className='relative'>
                            <Avatar className='ring-2 ring-white/20'>
                              <AvatarFallback
                                className={cn(
                                  'font-semibold',
                                  isSelected
                                    ? 'bg-pink-200 text-pink-500'
                                    : 'bg-purple-100 text-purple-600'
                                )}
                              >
                                {isGroupConversation(conv) ? (
                                  <IconUsers size={16} />
                                ) : (
                                  displayName.charAt(0)
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className='absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-green-300'></div>
                          </div>
                          <div className='min-w-0 flex-1'>
                            <div className='flex items-center justify-between'>
                              <span
                                className={cn(
                                  'truncate font-medium',
                                  isSelected
                                    ? 'text-pink-700'
                                    : 'text-gray-900 dark:text-gray-100'
                                )}
                              >
                                {displayName}
                              </span>
                              {conv.lastMessage && (
                                <span
                                  className={cn(
                                    'text-xs',
                                    isSelected
                                      ? 'text-pink-500'
                                      : 'text-gray-500'
                                  )}
                                >
                                  {format(
                                    new Date(conv.lastMessage.timestamp),
                                    'HH:mm'
                                  )}
                                </span>
                              )}
                            </div>
                            <div className='flex items-center gap-2'>
                              {conv.isMuted && (
                                <IconBellOff
                                  size={14}
                                  className='text-gray-500'
                                />
                              )}
                              {isGroupConversation(conv) && (
                                <IconUsers
                                  size={14}
                                  className='text-gray-500'
                                />
                              )}
                              <p
                                className={cn(
                                  'mt-1 truncate text-sm',
                                  isSelected
                                    ? 'text-pink-600'
                                    : 'text-gray-600 dark:text-gray-400'
                                )}
                              >
                                {conv.lastMessage
                                  ? conv.lastMessage.sender === user.id
                                    ? `You: ${conv.lastMessage.content}`
                                    : conv.lastMessage.content
                                  : 'No messages'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='absolute right-2 top-1/2 -translate-y-1/2 rounded-lg opacity-0 transition-all duration-300 hover:bg-red-200 hover:text-red-700 group-hover:opacity-100'
                        onClick={(e) => {
                          e.stopPropagation()
                          setConversationToDelete(conv._id)
                          setDeleteConversationDialog(true)
                        }}
                      >
                        <IconTrash size={16} />
                      </Button>
                    </div>
                    <Separator className='my-2 opacity-30' />
                  </Fragment>
                )
              })}
            </ScrollArea>
          </div>

          {/* Right Side - Chat Area */}
          {selectedConversation ? (
            <div
              className={cn(
                'absolute inset-0 left-full z-50 hidden w-full flex-1 flex-col rounded-xl border bg-yellow-50 shadow-xl transition-all duration-300 dark:bg-yellow-900/20 sm:static sm:z-auto sm:flex',
                mobileSelectedConversation && 'left-0 flex'
              )}
            >
              {/* Chat Header */}
              <div className='flex-none rounded-t-xl bg-purple-100 p-4 shadow-lg'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='text-purple-600 hover:bg-purple-200 sm:hidden'
                      onClick={() => setMobileSelectedConversation(null)}
                    >
                      <IconArrowLeft />
                    </Button>
                    <div className='flex items-center gap-3'>
                      <div className='relative'>
                        <Avatar className='size-10 ring-2 ring-purple-200'>
                          <AvatarFallback className='bg-purple-200 font-semibold text-purple-700'>
                            {isGroupConversation(selectedConversation) ? (
                              <IconUsers size={20} />
                            ) : (
                              selectedConversation.members
                                .find((p) => p._id !== user.id)
                                ?.name.charAt(0) || '?'
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className='absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-green-300'></div>
                      </div>
                      <div>
                        <h2 className='font-semibold text-purple-700'>
                          {isGroupConversation(selectedConversation)
                            ? selectedConversation.members
                                .filter((m) => m._id !== user.id)
                                .map((m) => m.name)
                                .join(', ')
                            : selectedConversation.members.find(
                                (p) => p._id !== user.id
                              )?.name || 'Unknown'}
                        </h2>
                        <p className='text-sm text-purple-500'>Online</p>
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='rounded-lg text-purple-600 hover:bg-purple-200'
                      onClick={() => handleCall('phone')}
                      disabled={isCallActive}
                    >
                      <IconPhone size={20} />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='rounded-lg text-purple-600 hover:bg-purple-200'
                      onClick={() => handleCall('video')}
                      disabled={isCallActive}
                    >
                      <IconVideo size={20} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size='icon'
                          variant='ghost'
                          className='rounded-lg text-purple-600 hover:bg-purple-200'
                        >
                          <IconDotsVertical size={20} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' className='w-56'>
                        <DropdownMenuItem
                          onClick={() => setAddToGroupDialog(true)}
                        >
                          <IconUserPlus className='mr-2 h-4 w-4' />
                          Add to group
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleToggleMute(
                              selectedConversation._id,
                              selectedConversation.isMuted || false
                            )
                          }
                        >
                          {selectedConversation.isMuted ? (
                            <>
                              <IconBell className='mr-2 h-4 w-4' />
                              Unmute notifications
                            </>
                          ) : (
                            <>
                              <IconBellOff className='mr-2 h-4 w-4' />
                              Mute notifications
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleToggleArchive(
                              selectedConversation._id,
                              selectedConversation.isArchived || false
                            )
                          }
                        >
                          <IconArchive className='mr-2 h-4 w-4' />
                          {selectedConversation.isArchived
                            ? 'Unarchive'
                            : 'Archive'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className='text-red-600'
                          onClick={() => {
                            setConversationToDelete(selectedConversation._id)
                            setDeleteConversationDialog(true)
                          }}
                        >
                          <IconTrash className='mr-2 h-4 w-4' />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Messages or Call Area */}
              <div className='flex flex-1 flex-col gap-2 px-4 pb-4 pt-2 overflow-auto'>
                {isCallActive ? (
                  <div className='flex flex-col gap-4 rounded-lg bg-black p-4'>
                    {callType === 'video' ? (
                      <div className='flex gap-4'>
                        <div className='flex-1'>
                          <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            className='w-full rounded-lg'
                          />
                          <p className='mt-2 text-sm text-white'>You</p>
                        </div>
                        <div className='flex-1'>
                          <video
                            ref={remoteVideoRef}
                            autoPlay
                            className='w-full rounded-lg'
                          />
                          <p className='mt-2 text-sm text-white'>Participant</p>
                        </div>
                      </div>
                    ) : (
                      <div className='text-center text-white'>
                        <p>Phone call in progress...</p>
                        <audio ref={localVideoRef} autoPlay muted />
                        <audio ref={remoteVideoRef} autoPlay />
                      </div>
                    )}
                    <Button
                      variant='destructive'
                      onClick={endCall}
                      className='self-center'
                    >
                      End Call
                    </Button>
                  </div>
                ) : (
                  <div className='flex size-full flex-1'>
                    <div className='relative flex min-h-0 flex-1 flex-col'>
                      {loading && (
                        <div className='py-8 text-center'>
                          <div className='inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-purple-200'></div>
                          <p className='mt-2 text-sm text-muted-foreground'>
                            Loading messages...
                          </p>
                        </div>
                      )}

                      <div
                        ref={chatContainerRef}
                        className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden scroll-smooth py-2 pb-4 pr-2'
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#cbd5e1 #f1f5f9',
                          maxHeight: '100%',
                          height: '100%',
                        }}
                      >
                        {/* Bouton Load More en haut */}
                        {visibleGroupCount <
                          Object.keys(groupedMessages).length && (
                          <div className='sticky top-0 z-10 bg-white/90 py-2 text-center backdrop-blur-sm dark:bg-gray-900/90'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() =>
                                setVisibleGroupCount((prev) => prev + 3)
                              }
                              disabled={isLoadingMoreRef.current}
                            >
                              {isLoadingMoreRef.current ? (
                                <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-purple-500'></div>
                              ) : (
                                'Load older messages'
                              )}
                            </Button>
                          </div>
                        )}

                        {/* Messages Container */}
                        <div className='flex min-h-0 flex-col gap-4'>
                          {Object.keys(groupedMessages)
                            .sort(
                              (a, b) =>
                                new Date(a).getTime() - new Date(b).getTime()
                            )
                            .slice(-visibleGroupCount)
                            .map((key) => (
                              <Fragment key={key}>
                                {/* Date Separator */}
                                <div className='sticky top-12 z-10 mx-auto mt-4 rounded-full bg-gray-100 px-3 py-1 text-center text-xs text-muted-foreground dark:bg-gray-800'>
                                  {key}
                                </div>

                                {/* Messages du groupe */}
                                {groupedMessages[key].map((msg) => (
                                  <div
                                    key={msg._id}
                                    className={cn(
                                      'chat-box group relative max-w-72 flex-shrink-0 break-words px-4 py-3 shadow-lg transition-all duration-300 hover:shadow-xl',
                                      msg.sender._id === user.id
                                        ? 'self-end rounded-[20px_20px_4px_20px] bg-pink-100 text-pink-700'
                                        : 'self-start rounded-[20px_20px_20px_4px] border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                    )}
                                  >
                                    {msg.edited && (
                                      <span className='mr-2 text-xs italic opacity-70'>
                                        (edited)
                                      </span>
                                    )}

                                    {editingMessageId === msg._id ? (
                                      <div className='flex items-center gap-2'>
                                        <Input
                                          value={editContent}
                                          onChange={(e) =>
                                            setEditContent(e.target.value)
                                          }
                                          className='flex-1 border-pink-200 bg-pink-50 text-pink-700 placeholder:text-pink-500'
                                          autoFocus
                                        />
                                        <Button
                                          size='icon'
                                          variant='ghost'
                                          onClick={() =>
                                            handleEditMessage(msg._id)
                                          }
                                          disabled={loading}
                                          className='text-pink-600 hover:bg-pink-200'
                                        >
                                          <IconCircleCheck size={16} />
                                        </Button>
                                        <Button
                                          size='icon'
                                          variant='ghost'
                                          onClick={() =>
                                            setEditingMessageId(null)
                                          }
                                          className='text-pink-600 hover:bg-pink-200'
                                        >
                                          <IconX size={16} />
                                        </Button>
                                      </div>
                                    ) : (
                                      <>
                                        {/* Contenu du message */}
                                        {msg.messageType === 'text' &&
                                        msg.message ? (
                                          <p className='whitespace-pre-wrap leading-relaxed'>
                                            {msg.message}
                                          </p>
                                        ) : (
                                          <div className='space-y-2'>
                                            {msg.attachments?.map(
                                              (attachment, index) => (
                                                <div
                                                  key={index}
                                                  className='flex items-center gap-2'
                                                >
                                                  {attachment.mimeType.startsWith(
                                                    'image/'
                                                  ) ? (
                                                    <div className='relative'>
                                                      <img
                                                        src={
                                                          attachment.url ||
                                                          '/placeholder.svg'
                                                        }
                                                        alt={
                                                          attachment.filename
                                                        }
                                                        className='max-h-[200px] max-w-[200px] cursor-pointer rounded-lg object-cover'
                                                        onClick={() =>
                                                          setLightboxImage(
                                                            attachment.url
                                                          )
                                                        }
                                                        loading='lazy'
                                                      />
                                                      <div className='absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-xs text-white'>
                                                        {attachment.filename}
                                                      </div>
                                                    </div>
                                                  ) : attachment.mimeType ===
                                                    'application/pdf' ? (
                                                    <a
                                                      href={attachment.url}
                                                      download={
                                                        attachment.filename
                                                      }
                                                      className='flex items-center gap-2 rounded-lg bg-red-50 p-2 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-800/30'
                                                      onClick={(e) => {
                                                        e.preventDefault()
                                                        fetch(attachment.url)
                                                          .then((response) =>
                                                            response.blob()
                                                          )
                                                          .then((blob) => {
                                                            const url =
                                                              window.URL.createObjectURL(
                                                                blob
                                                              )
                                                            const link =
                                                              document.createElement(
                                                                'a'
                                                              )
                                                            link.href = url
                                                            link.download =
                                                              attachment.filename
                                                            document.body.appendChild(
                                                              link
                                                            )
                                                            link.click()
                                                            document.body.removeChild(
                                                              link
                                                            )
                                                            window.URL.revokeObjectURL(
                                                              url
                                                            )
                                                          })
                                                          .catch((err) => {
                                                            console.error(
                                                              'Error downloading PDF:',
                                                              err
                                                            )
                                                            toast.error(
                                                              'Failed to download PDF'
                                                            )
                                                          })
                                                      }}
                                                    >
                                                      <IconFileText
                                                        size={16}
                                                        className='text-red-500'
                                                      />
                                                      <div>
                                                        <p className='text-sm font-medium text-red-600'>
                                                          {attachment.filename}
                                                        </p>
                                                        <p className='text-xs text-gray-500'>
                                                          {(
                                                            attachment.size /
                                                            1024
                                                          ).toFixed(2)}{' '}
                                                          KB
                                                        </p>
                                                      </div>
                                                    </a>
                                                  ) : (
                                                    <a
                                                      href={attachment.url}
                                                      target='_blank'
                                                      rel='noopener noreferrer'
                                                      className='flex items-center gap-2 rounded-lg bg-gray-100 p-2 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                                    >
                                                      <IconPaperclip
                                                        size={16}
                                                        className='text-gray-500'
                                                      />
                                                      <div>
                                                        <p className='text-sm font-medium'>
                                                          {attachment.filename}
                                                        </p>
                                                        <p className='text-xs text-gray-500'>
                                                          {(
                                                            attachment.size /
                                                            1024
                                                          ).toFixed(2)}{' '}
                                                          KB
                                                        </p>
                                                      </div>
                                                    </a>
                                                  )}
                                                </div>
                                              )
                                            )}
                                            {msg.message && (
                                              <p className='mt-2 whitespace-pre-wrap leading-relaxed'>
                                                {msg.message}
                                              </p>
                                            )}
                                          </div>
                                        )}

                                        {/* Metadata du message */}
                                        <div
                                          className={cn(
                                            'mt-2 flex items-center gap-1 text-xs opacity-70',
                                            msg.sender._id === user.id &&
                                              'justify-end'
                                          )}
                                        >
                                          <span>
                                            {format(
                                              new Date(msg.createdAt),
                                              'h:mm a'
                                            )}
                                          </span>
                                          {msg.sender._id === user.id &&
                                            msg.readBy &&
                                            msg.readBy.length > 0 && (
                                              <IconCircleCheck
                                                size={12}
                                                className='text-green-500'
                                                title='Read'
                                              />
                                            )}
                                          {msg.sender._id !== user.id &&
                                            msg.readBy &&
                                            !msg.readBy.some(
                                              (r) => r.user === user.id
                                            ) && (
                                              <Button
                                                size='sm'
                                                variant='ghost'
                                                onClick={() =>
                                                  handleMarkAsRead(msg._id)
                                                }
                                                className='h-6 px-2 text-xs transition-colors hover:bg-yellow-100 dark:hover:bg-yellow-800'
                                              >
                                                Mark as read
                                              </Button>
                                            )}
                                        </div>

                                        {/* Menu d'actions */}
                                        {msg.sender._id === user.id &&
                                          !msg.deleted && (
                                            <div className='absolute -right-2 -top-2 opacity-0 transition-all duration-300 group-hover:opacity-100'>
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button
                                                    size='icon'
                                                    variant='ghost'
                                                    className='h-8 w-8 rounded-full border bg-white text-gray-700 shadow-lg hover:bg-gray-100'
                                                  >
                                                    <IconDotsVertical
                                                      size={14}
                                                    />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                  align='end'
                                                  className='z-50'
                                                >
                                                  <DropdownMenuItem
                                                    onClick={() => {
                                                      setEditingMessageId(
                                                        msg._id
                                                      )
                                                      setEditContent(
                                                        msg.message
                                                      )
                                                    }}
                                                  >
                                                    <IconEdit className='mr-2 h-4 w-4' />
                                                    Edit
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem
                                                    onClick={() =>
                                                      navigator.clipboard.writeText(
                                                        msg.message
                                                      )
                                                    }
                                                  >
                                                    <IconCopy className='mr-2 h-4 w-4' />
                                                    Copy
                                                  </DropdownMenuItem>
                                                  <DropdownMenuSeparator />
                                                  <DropdownMenuItem
                                                    onClick={() =>
                                                      handleDeleteMessage(
                                                        msg._id
                                                      )
                                                    }
                                                    className='text-red-600'
                                                  >
                                                    <IconTrash className='mr-2 h-4 w-4' />
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
                              </Fragment>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Message Input */}
                {!isCallActive && (
                  <form
                    onSubmit={handleSendMessage}
                    className='flex w-full flex-none flex-col gap-3'
                  >
                    {/* Prévisualisation des fichiers */}
                    {filePreviews.length > 0 && (
                      <div className='flex flex-wrap gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800'>
                        {filePreviews.map((preview, _index) => (
                          <div key={_index} className='relative'>
                            {preview.type.startsWith('image/') ? (
                              <img
                                src={preview.url || '/placeholder.svg'}
                                alt='Preview'
                                className='h-16 w-16 rounded-lg object-cover'
                              />
                            ) : (
                              <div className='flex h-16 w-16 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700'>
                                <IconPaperclip
                                  size={24}
                                  className='text-gray-500'
                                />
                              </div>
                            )}
                            <Button
                              size='icon'
                              variant='ghost'
                              className='absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-500 text-white'
                              onClick={() =>
                                setFilePreviews((prev) =>
                                  prev.filter((_, i) => i !== _index)
                                )
                              }
                            >
                              <IconX size={12} />
                            </Button>
                            <p className='w-16 truncate text-xs text-gray-500'>
                              {preview.file.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className='flex flex-1 items-center gap-3 rounded-2xl border border-input bg-white px-4 py-2 shadow-lg focus-within:outline-none focus-within:ring-2 focus-within:ring-yellow-200 dark:bg-gray-800'>
                      <Button
                        type='button'
                        size='icon'
                        variant='ghost'
                        className='text-gray-500 hover:bg-pink-50 hover:text-pink-500 dark:hover:bg-pink-900/20'
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <IconPaperclip size={20} />
                      </Button>
                      <input
                        type='file'
                        ref={fileInputRef}
                        className='hidden'
                        onChange={handleFileSelect}
                        accept={ALLOWED_FILE_TYPES.join(',')}
                        multiple
                      />
                      <label className='flex-1'>
                        <span className='sr-only'>Text box</span>
                        <input
                          type='text'
                          placeholder='Type your message...'
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          disabled={
                            loading || uploading || !selectedConversation
                          }
                          className='h-8 w-full bg-transparent placeholder:text-gray-500 focus-visible:outline-none'
                        />
                      </label>
                      <DropdownMenu
                        open={showEmojiPicker}
                        onOpenChange={setShowEmojiPicker}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button
                            type='button'
                            size='icon'
                            variant='ghost'
                            className='text-gray-500 hover:bg-yellow-50 hover:text-yellow-500 dark:hover:bg-yellow-900/20'
                            disabled={uploading}
                          >
                            <IconMoodSmile size={20} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className='p-2'>
                          <div className='grid grid-cols-5 gap-2'>
                            {EMOJIS.map((emoji) => (
                              <Button
                                key={emoji}
                                variant='ghost'
                                className='text-xl'
                                onClick={() => handleEmojiSelect(emoji)}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        type='submit'
                        disabled={
                          loading ||
                          uploading ||
                          (!messageInput.trim() && !filePreviews.length) ||
                          !selectedConversation
                        }
                        className='h-12 w-12 transform rounded-2xl bg-yellow-100 text-yellow-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-yellow-200 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50'
                      >
                        {uploading ? (
                          <div className='h-5 w-5 animate-spin rounded-full border-b-2 border-yellow-700'></div>
                        ) : (
                          <IconSend size={20} />
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'absolute inset-0 left-full z-50 hidden w-full flex-1 flex-col items-center justify-center rounded-xl border bg-yellow-50 shadow-xl transition-all duration-300 dark:bg-yellow-900/20 sm:static sm:z-auto sm:flex'
              )}
            >
              <div className='flex max-w-md flex-col items-center space-y-6 text-center'>
                <div className='relative'>
                  <div className='flex h-20 w-20 items-center justify-center rounded-full bg-pink-100 shadow-lg'>
                    <IconMessages className='h-10 w-10 text-pink-600' />
                  </div>
                  <div className='absolute -right-2 -top-2 h-6 w-6 animate-pulse rounded-full border-4 border-white bg-green-300'></div>
                </div>
                <div className='space-y-3'>
                  <h1 className='text-2xl font-bold text-purple-500'>
                    Your messages
                  </h1>
                  <p className='text-gray-600 dark:text-gray-400'>
                    Send a message to start a conversation.
                  </p>
                </div>
                <Button
                  className='transform rounded-xl bg-pink-100 px-8 py-3 text-pink-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-pink-200 hover:shadow-xl'
                  onClick={() => setCreateConversationDialog(true)}
                >
                  <IconPlus className='mr-2 h-5 w-5' />
                  New conversation
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Dialog for creating a new conversation */}
        <Dialog
          open={createConversationDialogOpened}
          onOpenChange={setCreateConversationDialog}
        >
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle className='text-xl font-semibold text-purple-500'>
                New conversation
              </DialogTitle>
            </DialogHeader>
            <div className='space-y-6'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Select a user:</label>
                <Select
                  onValueChange={setSelectedUserId}
                  disabled={loading || users.length === 0}
                >
                  <SelectTrigger className='rounded-xl border-2 focus:border-pink-200'>
                    <SelectValue placeholder='Choose someone...' />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((u) => u._id !== user.id)
                      .map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          <div className='flex items-center gap-2'>
                            <Avatar className='h-6 w-6'>
                              <AvatarFallback className='bg-yellow-100 text-xs text-yellow-700'>
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className='font-medium'>{user.name}</div>
                              <div className='text-xs text-gray-500'>
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {loading && (
                <div className='py-4 text-center'>
                  <div className='inline-block h-6 w-6 animate-spin rounded-full border-b-2 border-pink-200'></div>
                  <p className='mt-2 text-sm text-muted-foreground'>
                    Creating...
                  </p>
                </div>
              )}
              <div className='flex justify-end gap-3'>
                <Button
                  variant='outline'
                  onClick={() => setCreateConversationDialog(false)}
                  disabled={loading}
                  className='rounded-xl'
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedUserId) handleNewChat(selectedUserId)
                    else toast.error('Please select a user')
                  }}
                  disabled={loading || !selectedUserId}
                  className='rounded-xl bg-pink-100 text-pink-700 hover:bg-pink-200'
                >
                  <IconPlus className='mr-2 h-4 w-4' />
                  Start
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog for adding to group */}
        <Dialog
          open={addToGroupDialogOpened}
          onOpenChange={setAddToGroupDialog}
        >
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle className='text-xl font-semibold text-purple-500'>
                Add to group
              </DialogTitle>
            </DialogHeader>
            <div className='space-y-6'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Select a user:</label>
                <Select
                  onValueChange={setSelectedUserId}
                  disabled={loading || users.length === 0}
                >
                  <SelectTrigger className='rounded-xl border-2 focus:border-pink-200'>
                    <SelectValue placeholder='Choose someone...' />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(
                        (u) =>
                          u._id !== user.id &&
                          !selectedConversation?.members.some(
                            (m) => m._id === u._id
                          )
                      )
                      .map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          <div className='flex items-center gap-2'>
                            <Avatar className='h-6 w-6'>
                              <AvatarFallback className='bg-yellow-100 text-xs text-yellow-700'>
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className='font-medium'>{user.name}</div>
                              <div className='text-xs text-gray-500'>
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {loading && (
                <div className='py-4 text-center'>
                  <div className='inline-block h-6 w-6 animate-spin rounded-full border-b-2 border-pink-200'></div>
                  <p className='mt-2 text-sm text-muted-foreground'>
                    Adding...
                  </p>
                </div>
              )}
              <div className='flex justify-end gap-3'>
                <Button
                  variant='outline'
                  onClick={() => setAddToGroupDialog(false)}
                  disabled={loading}
                  className='rounded-xl'
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedUserId && selectedConversation)
                      handleAddToGroup(selectedConversation._id, selectedUserId)
                    else toast.error('Please select a user')
                  }}
                  disabled={loading || !selectedUserId}
                  className='rounded-xl bg-pink-100 text-pink-700 hover:bg-pink-200'
                >
                  <IconUserPlus className='mr-2 h-4 w-4' />
                  Add
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog for deleting conversation */}
        <Dialog
          open={deleteConversationDialogOpened}
          onOpenChange={setDeleteConversationDialog}
        >
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle className='text-xl font-semibold text-gray-600'>
                Delete conversation
              </DialogTitle>
            </DialogHeader>
            <div className='space-y-4'>
              <div className='flex items-center gap-3 rounded-xl bg-red-50 p-4 dark:bg-red-900/20'>
                <IconTrash className='h-6 w-6 text-red-500' />
                <div>
                  <p className='font-medium text-gray-800 dark:text-red-200'>
                    Are you sure?
                  </p>
                  <p className='text-sm text-red-600 dark:text-red-300'>
                    This action is irreversible. All messages will be deleted.
                  </p>
                </div>
              </div>
              {loading && (
                <div className='py-4 text-center'>
                  <div className='inline-block h-6 w-6 animate-spin rounded-full border-b-2 border-red-500'></div>
                  <p className='mt-2 text-sm text-muted-foreground'>
                    Deleting...
                  </p>
                </div>
              )}
              <div className='flex justify-end gap-3'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setDeleteConversationDialog(false)
                    setConversationToDelete(null)
                  }}
                  disabled={loading}
                  className='rounded-xl'
                >
                  Cancel
                </Button>
                <Button
                  variant='destructive'
                  onClick={() => {
                    if (conversationToDelete)
                      handleDeleteConversation(conversationToDelete)
                  }}
                  disabled={loading}
                  className='rounded-xl bg-red-500 hover:bg-red-600'
                >
                  <IconTrash className='mr-2 h-4 w-4' />
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {/* Dialog for incoming call */}
        <Dialog open={!!incomingCall} onOpenChange={rejectCall}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Incoming Call</DialogTitle>
            </DialogHeader>
            <div className='space-y-4'>
              <p>
                Incoming {callType === 'video' ? 'video' : 'phone'} call from{' '}
                {users.find((u) => u._id === incomingCall?.callerId)?.name ||
                  'Unknown'}
              </p>
              <div className='flex justify-end gap-3'>
                <Button variant='destructive' onClick={rejectCall}>
                  Reject
                </Button>
                <Button onClick={acceptCall}>Accept</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog
          open={!!lightboxImage}
          onOpenChange={() => setLightboxImage(null)}
        >
          <DialogContent className='max-w-3xl p-0'>
            <img
              src={lightboxImage || ''}
              alt='Full image'
              className='h-auto w-full rounded-lg'
            />
            <Button
              variant='ghost'
              size='icon'
              className='absolute right-4 top-4 bg-black/50 text-white hover:bg-black/70'
              onClick={() => setLightboxImage(null)}
            >
              <IconX size={24} />
            </Button>
          </DialogContent>
        </Dialog>
      </Main>
    </>
  )
}
