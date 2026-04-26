import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, RefreshControl,
  KeyboardAvoidingView, Platform, StyleSheet, Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { sendCommand, getScreenshot, checkHealth } from "../services/api";
import { useDispatchStore } from "../store/useDispatchStore";

const { width, height } = Dimensions.get("window");

export default function MainScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"unknown" | "online" | "offline">("unknown");
  const { lastScreenshot, setScreenshot, addHistory, messages, addMessage } = useDispatchStore();

  const ping = useCallback(async () => {
    try {
      await checkHealth();
      setStatus("online");
    } catch {
      setStatus("offline");
    }
  }, []);

  const refreshScreenshot = useCallback(async () => {
    try {
      const data = await getScreenshot();
      setScreenshot(data.screenshot);
    } catch {}
  }, []);

  useEffect(() => {
    ping();
    const interval = setInterval(() => {
      ping();
    }, 10000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!command.trim()) return;
    const userCmd = command.trim();
    addMessage(userCmd, "user");
    setCommand("");
    setLoading(true);
    
    try {
      const result = await sendCommand(userCmd);
      if (result.message) {
        addMessage(result.message, "ai");
      }
      if (result.screenshot) {
        setScreenshot(result.screenshot);
      }
      addHistory({ command: userCmd, result, timestamp: new Date().toISOString() });
    } catch (e) {
      addMessage("Error communicating with laptop.", "ai");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Grid Background */}
      <View style={styles.gridOverlay}>
        {Array.from({ length: 15 }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLineV, { left: i * (width / 9) }]} />
        ))}
        {Array.from({ length: 40 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLineH, { top: i * (width / 9) }]} />
        ))}
      </View>

      {/* Floating Glass Header */}
      <View style={styles.floatingHeaderContainer}>
        <BlurView intensity={80} tint="light" style={styles.blurContainer}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.menuButton} onPress={() => router.push("/settings")}>
              <View style={styles.menuIconContainer}>
                <View style={styles.menuLine} />
                <View style={[styles.menuLine, { width: 14 }]} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitleText}>Dispatch</Text>
              <View style={styles.headerStatusContainer}>
                <Text style={[styles.headerStatusIcon, status === "online" && { color: "#4ade80" }]}>
                  {status === "online" ? "●" : "☾+"}
                </Text>
                <Text style={[styles.headerStatusText, status === "online" && { color: "#4ade80" }]}>
                  {status === "online" ? "Online" : "Asleep"}
                </Text>
              </View>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </BlurView>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refreshScreenshot} />}
      >
        <View style={{ height: 110 }} /> {/* Spacer for floating header */}

        {/* Connection Error Message */}
        {status !== "online" && (
          <View style={styles.statusMessageCard}>
            <View style={styles.statusMessageIconContainer}>
              <Text style={styles.statusMoonIcon}>☾</Text>
            </View>
            <Text style={styles.statusMessageText}>
              Can't reach your desktop. Check that your computer is online and desktop app is open.
            </Text>
          </View>
        )}

        {/* Chat Messages */}
        {messages.map((msg) => (
          <View key={msg.id} style={[
            styles.messageRow,
            msg.sender === "user" ? styles.userRow : styles.aiRow
          ]}>
            <View style={[
              styles.messageBubble,
              msg.sender === "user" ? styles.userBubble : styles.aiBubble
            ]}>
              <Text style={[
                styles.messageText,
                msg.sender === "user" ? styles.userText : styles.aiText
              ]}>
                {msg.text}
              </Text>
            </View>
            {msg.sender === "user" && (
              <View style={styles.readStatusContainer}>
                <Text style={styles.readStatusText}>✓ Read</Text>
              </View>
            )}
          </View>
        ))}

        {loading && (
          <View style={styles.aiRow}>
            <View style={[styles.messageBubble, styles.aiBubble, { paddingVertical: 15 }]}>
              <ActivityIndicator color="#6b7280" size="small" />
            </View>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <BlurView intensity={60} tint="light" style={styles.inputBlur}>
          <View style={styles.inputArea}>
            <View style={styles.inputBar}>
              <TextInput
                style={[styles.input, { paddingLeft: 16 }]}
                placeholder="Ask Anything"
                placeholderTextColor="#9ca3af"
                value={command}
                onChangeText={setCommand}
                multiline
              />
              
              <View style={styles.rightButtons}>
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={loading || !command.trim()}
                  style={[styles.sendButton, (loading || !command.trim()) && styles.sendButtonDisabled]}
                >
                  <Text style={styles.sendIcon}>↑</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F8",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#E5E5E5",
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#E5E5E5",
  },
  floatingHeaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  blurContainer: {
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  menuIconContainer: {
    alignItems: "flex-start",
  },
  menuLine: {
    width: 18,
    height: 2,
    backgroundColor: "#374151",
    marginVertical: 1.5,
    borderRadius: 1,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    letterSpacing: -0.5,
  },
  headerStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerStatusIcon: {
    fontSize: 10,
    color: "#6b7280",
    marginRight: 3,
  },
  headerStatusText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
  },
  chatList: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  statusMessageCard: {
    backgroundColor: "rgba(239, 239, 239, 0.8)",
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  statusMessageIconContainer: {
    marginRight: 15,
  },
  statusMoonIcon: {
    fontSize: 18,
    color: "#4B5563",
  },
  statusMessageText: {
    flex: 1,
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 21,
    fontWeight: "500",
  },
  messageRow: {
    marginBottom: 20,
    maxWidth: "80%",
  },
  userRow: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  aiRow: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: "#A25945",
  },
  aiBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userText: {
    color: "#FFFFFF",
  },
  aiText: {
    color: "#111827",
  },
  readStatusContainer: {
    flexDirection: "row",
    marginTop: 4,
    alignItems: "center",
  },
  readStatusText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginRight: 4,
  },
  inputBlur: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    paddingTop: 15,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 17,
    color: "#111827",
    maxHeight: 120,
    paddingTop: 0,
    paddingBottom: 4,
  },
  rightButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#A25945",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#F3F4F6",
  },
  sendIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
});
