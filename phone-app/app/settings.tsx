import React, { useState, useRef } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, Alert, Image, 
  StyleSheet, ScrollView, ActivityIndicator, Pressable, 
  Dimensions, Animated 
} from "react-native";
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { useDispatchStore } from "../store/useDispatchStore";
import { checkHealth, getScreenshot, ghostClick, teleport } from "../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function SettingsScreen() {
  const { serverUrl, secretToken, setServerUrl, setSecretToken, lastScreenshot, setScreenshot, addMessage } = useDispatchStore();
  const [url, setUrl] = useState(serverUrl);
  const [token, setToken] = useState(secretToken);
  const [refreshing, setRefreshing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [teleporting, setTeleporting] = useState(false);

  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0.5)).current;
  const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });

  const save = () => {
    setServerUrl(url.trim());
    setSecretToken(token.trim());
    Alert.alert("Saved", "Settings updated.");
  };

  const test = async () => {
    setTesting(true);
    try {
      const targetUrl = url.trim();
      const targetToken = token.trim();
      setServerUrl(targetUrl);
      setSecretToken(targetToken);
      const data = await checkHealth(targetUrl, targetToken);
      Alert.alert("Connected", `Laptop is running. Uptime: ${data.uptime}`);
    } catch (e: any) {
      Alert.alert("Failed", `Cannot reach laptop.\n\nError: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleTeleport = async () => {
    setTeleporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const data = await teleport();
      if (data.type === "url" && data.content) {
        Linking.openURL(data.content);
        addMessage(`Teleported ${data.app} context to iPhone.`, "ai");
      } else {
        Alert.alert("Teleport Failed", `The active app (${data.app}) is not compatible with iPhone teleportation.`);
      }
    } catch (e) {
      Alert.alert("Error", "Teleport connection failed.");
    } finally {
      setTeleporting(false);
    }
  };

  const handleGhostTouch = async (evt: any) => {
    const { locationX, locationY } = evt.nativeEvent;
    
    // 1. Visual Ripple Effect
    setRipplePos({ x: locationX, y: locationY });
    rippleScale.setValue(0);
    rippleOpacity.setValue(0.6);
    Animated.parallel([
      Animated.timing(rippleScale, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(rippleOpacity, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start();

    // 2. Haptics
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // 3. Coordinate Mapping
    const imgWidth = SCREEN_WIDTH - 40;
    const imgHeight = 220; 
    const pX = (locationX / imgWidth) * 100;
    const pY = (locationY / imgHeight) * 100;

    try {
      await ghostClick(pX, pY);
    } catch (e) {}
  };

  const manualRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getScreenshot();
      setScreenshot(data.screenshot);
    } catch (e) {
      Alert.alert("Error", `Could not fetch screenshot: ${e.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity 
          onPress={handleTeleport} 
          disabled={teleporting}
          style={styles.teleportButton}
        >
          {teleporting ? (
            <ActivityIndicator size="small" color="#A25945" />
          ) : (
            <Text style={styles.teleportIcon}>🌀</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Server URL</Text>
      <TextInput
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
        placeholder="https://abc123.ngrok.io"
        placeholderTextColor="#9ca3af"
      />

      <Text style={styles.label}>Secret Token</Text>
      <TextInput
        value={token}
        onChangeText={setToken}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
        placeholder="your_secret_token"
        placeholderTextColor="#9ca3af"
      />

      <TouchableOpacity onPress={save} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={test} disabled={testing} style={styles.testButton}>
        {testing ? (
          <ActivityIndicator size="small" color="#000000" />
        ) : (
          <Text style={styles.testButtonText}>Test Connection</Text>
        )}
      </TouchableOpacity>

      {/* Live Desktop View with Ghost Touch */}
      <View style={styles.screenshotSection}>
        <View style={styles.screenshotHeader}>
          <View>
            <Text style={styles.screenshotLabel}>Ghost Touch View</Text>
            <Text style={styles.screenshotSub}>Tap anywhere to click on Mac</Text>
          </View>
          <TouchableOpacity onPress={manualRefresh} disabled={refreshing}>
            {refreshing ? (
              <ActivityIndicator size="small" color="#A25945" />
            ) : (
              <Text style={styles.refreshText}>Refresh</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.screenshotCard}>
          <Pressable onPress={handleGhostTouch}>
            {lastScreenshot ? (
              <View>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${lastScreenshot}` }}
                  style={styles.screenshot}
                  resizeMode="stretch"
                />
                <Animated.View style={[
                  styles.ripple,
                  { 
                    left: ripplePos.x - 20, 
                    top: ripplePos.y - 20,
                    opacity: rippleOpacity,
                    transform: [{ scale: rippleScale }]
                  }
                ]} />
              </View>
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Tap refresh to enable Ghost Touch</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
      
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F8",
    padding: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "800",
  },
  teleportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  teleportIcon: {
    fontSize: 22,
  },
  label: {
    color: "#6b7280",
    marginBottom: 8,
    fontWeight: "600",
    fontSize: 14,
  },
  input: {
    backgroundColor: "#FFFFFF",
    color: "#000",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  testButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 55,
    justifyContent: "center",
  },
  testButtonText: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 16,
  },
  screenshotSection: {
    marginTop: 10,
  },
  screenshotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  screenshotLabel: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "700",
  },
  screenshotSub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  refreshText: {
    color: "#A25945",
    fontWeight: "700",
    fontSize: 14,
  },
  screenshotCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  screenshot: {
    width: "100%",
    height: 220,
  },
  ripple: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#A25945",
    zIndex: 10,
  },
  placeholder: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  placeholderText: {
    color: "#9ca3af",
    fontSize: 14,
  },
});
