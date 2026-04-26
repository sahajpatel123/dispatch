import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, RefreshControl,
  KeyboardAvoidingView, Platform, StyleSheet, Dimensions,
  Animated, Pressable
} from "react-native";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import * as Haptics from 'expo-haptics';
import { sendCommand, getScreenshot, checkHealth } from "../services/api";
import { useDispatchStore } from "../store/useDispatchStore";

const { width } = Dimensions.get("window");

// ─── AUTHENTIC LIQUID GLASS COMPONENTS ──────────────────────────────────────

const LiquidGlassButton = ({ onPress, children, style }: { onPress: () => void, children: any, style?: any }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      bounciness: 12,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 12,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={({ pressed }) => [
          styles.menuButton,
          pressed && { backgroundColor: "rgba(255,255,255,0.4)" },
          style
        ]}
      >
        <GlassContainer intensity={40} style={StyleSheet.absoluteFill} />
        {children}
      </Pressable>
    </Animated.View>
  );
};

const GlassContainer = ({ children, intensity, style }: { children?: any, intensity: number, style?: any }) => {
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={intensity} tint="light" style={style}>
        {children}
      </BlurView>
    );
  }
  return (
    <View style={[style, { backgroundColor: 'rgba(249, 249, 248, 0.85)' }]}>
      {children}
    </View>
  );
};

// ─── MAIN SCREEN ───────────────────────────────────────────────────────────

export default function MainScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"unknown" | "online" | "offline">("unknown");
  const { lastScreenshot, setScreenshot, addHistory, messages, addMessage } = useDispatchStore();

  const inputScale = useRef(new Animated.Value(1)).current;

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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        <GlassContainer intensity={90} style={styles.blurContainer}>
          <View style={styles.header}>
            <LiquidGlassButton onPress={() => router.push("/settings")}>
              <View style={styles.menuIconContainer}>
                <View style={styles.menuLine} />
                <View style={[styles.menuLine, { width: 14 }]} />
              </View>
            </LiquidGlassButton>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitleText}>Dispatch</Text>
              <View style={[
                styles.headerStatusContainer,
                status === "online" ? styles.statusOnlineBadge : styles.statusAsleepBadge
              ]}>
                <Text style={[
                  styles.headerStatusIcon,
                  status === "online" ? { color: "#166534" } : { color: "#6b7280" }
                ]}>
                  ●
                </Text>
                <Text style={[
                  styles.headerStatusText,
                  status === "online" ? { color: "#166534" } : { color: "#6b7280" }
                ]}>
                  {status === "online" ? "Online" : "Asleep"}
                </Text>
              </View>
            </View>            <View style={{ width: 44 }} />
          </View>
        </GlassContainer>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refreshScreenshot} />}
      >
        <View style={{ height: 145 }} />

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
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Liquid Glass Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputOuterContainer}>
          <GlassContainer intensity={60} style={styles.inputGlass}>
            <View style={styles.inputBar}>
              <TextInput
                style={[styles.input, { paddingLeft: 16 }]}
                placeholder="Ask Anything"
                placeholderTextColor="#9ca3af"
                value={command}
                onChangeText={setCommand}
                multiline
                onFocus={() => {
                  Animated.spring(inputScale, { toValue: 1.02, useNativeDriver: true }).start();
                }}
                onBlur={() => {
                  Animated.spring(inputScale, { toValue: 1, useNativeDriver: true }).start();
                }}
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
          </GlassContainer>
        </View>
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
  },
  blurContainer: {
    paddingTop: Platform.OS === "ios" ? 65 : 25,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)", // Rim light effect
  },
  menuIconContainer: {
    alignItems: "flex-start",
    paddingLeft: 2,
    zIndex: 1,
  },
  menuLine: {
    width: 18,
    height: 2,
    backgroundColor: "#111827",
    marginVertical: 1.8,
    borderRadius: 1,
  },
  headerTitleContainer: {
    alignItems: "center",
    paddingRight: 4,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000",
    letterSpacing: -0.6,
  },
  headerStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusOnlineBadge: {
    backgroundColor: "#dcfce7", // Light green capsule
  },
  statusAsleepBadge: {
    backgroundColor: "#f3f4f6", // Light gray capsule
  },
  headerStatusIcon: {
    fontSize: 7,
    marginRight: 4,
  },
  headerStatusText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.1,
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
    shadowOffset: { width: 0, height: 2 },
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
  inputOuterContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    paddingTop: 15,
    backgroundColor: "transparent",
  },
  inputGlass: {
    borderRadius: 35,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)", // Glass rim
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.4)", // Liquid transparency
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  sendIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
});
