import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, fontSize, shadows } from '../../src/utils/theme';
import { useChat, useChatSessions, useDeleteChatSession } from '../../src/hooks/useChat';
import { ChatMessage, ChatSession } from '../../src/services/chat';

export default function ChatScreen() {
  const { messages, sessionId, isLoading, sendMessage, loadSession, startNewSession } = useChat();
  const { data: sessionsData } = useChatSessions();
  const deleteSession = useDeleteChatSession();

  const [inputText, setInputText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Add welcome message if no messages
  const displayMessages: ChatMessage[] = messages.length === 0
    ? [{ role: 'assistant', content: 'Bonjour ! Je suis l\'assistant TRIBE. Comment puis-je vous aider aujourd\'hui ? 👋' }]
    : messages;

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    await sendMessage(text);
  };

  useEffect(() => {
    if (flatListRef.current && displayMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [displayMessages]);

  const handleSelectSession = (session: ChatSession) => {
    loadSession(session.id);
    setShowHistory(false);
  };

  const handleNewChat = () => {
    startNewSession();
    setShowHistory(false);
  };

  const handleDeleteSession = (id: string) => {
    deleteSession.mutate(id);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary[500]} />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  const suggestedQuestions = [
    'Comment ajouter un POI ?',
    'Comment gagner des points ?',
    'Quels sont les niveaux ?',
    'Des conseils pour progresser ?',
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[800]} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={20} color={colors.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Assistant TRIBE</Text>
            <Text style={styles.headerSubtitle}>Propulsé par Claude</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowHistory(true)} style={styles.historyButton}>
            <Ionicons name="time-outline" size={24} color={colors.gray[600]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNewChat} style={styles.newChatButton}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary[500]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={displayMessages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item.id || index.toString()}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
              <Text style={styles.loadingText}>Réflexion en cours...</Text>
            </View>
          ) : null
        }
      />

      {/* Suggested Questions */}
      {messages.length === 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Questions suggérées :</Text>
          <View style={styles.suggestionsRow}>
            {suggestedQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => setInputText(question)}
              >
                <Text style={styles.suggestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Écrivez votre message..."
            placeholderTextColor={colors.gray[400]}
            multiline
            maxLength={500}
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() && !isLoading ? colors.white : colors.gray[400]}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistory(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Historique des conversations</Text>
            <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          {sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
            <FlatList
              data={sessionsData.sessions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.sessionItem,
                    sessionId === item.id && styles.sessionItemActive,
                  ]}
                  onPress={() => handleSelectSession(item)}
                >
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle} numberOfLines={1}>
                      {item.title || 'Conversation'}
                    </Text>
                    <Text style={styles.sessionMeta}>
                      {item.messageCount} messages • {new Date(item.updatedAt).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteSession(item.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.red[500]} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.sessionsList}
            />
          ) : (
            <View style={styles.emptyHistory}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyHistoryText}>Aucune conversation</Text>
              <Text style={styles.emptyHistorySubtext}>
                Commencez une nouvelle conversation pour la voir ici
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.newChatModalButton} onPress={handleNewChat}>
            <Ionicons name="add" size={24} color={colors.white} />
            <Text style={styles.newChatModalText}>Nouvelle conversation</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  historyButton: {
    padding: spacing.sm,
  },
  newChatButton: {
    padding: spacing.sm,
  },
  messagesList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  userBubble: {
    backgroundColor: colors.primary[500],
    borderBottomRightRadius: borderRadius.sm,
  },
  assistantBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: borderRadius.sm,
    ...(Platform.OS === 'ios' ? shadows.sm : {}),
    elevation: 2,
  },
  messageText: {
    fontSize: fontSize.base,
    color: colors.gray[800],
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.gray[500],
    fontSize: fontSize.sm,
  },
  suggestionsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  suggestionsTitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.sm,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  suggestionText: {
    color: colors.primary[600],
    fontSize: fontSize.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[900],
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray[200],
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  closeButton: {
    padding: spacing.sm,
  },
  sessionsList: {
    padding: spacing.lg,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...(Platform.OS === 'ios' ? shadows.sm : {}),
    elevation: 1,
  },
  sessionItemActive: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  sessionMeta: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  emptyHistory: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  emptyHistoryText: {
    fontSize: fontSize.lg,
    color: colors.gray[500],
    marginTop: spacing.lg,
  },
  emptyHistorySubtext: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  newChatModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  newChatModalText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
});
