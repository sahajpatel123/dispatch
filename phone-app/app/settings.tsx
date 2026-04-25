import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, Image, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useDispatchStore } from "../store/useDispatchStore";
import { checkHealth, getScreenshot } from "../services/api";

export default function SettingsScreen() {
  const { serverUrl, secretToken, setServerUrl, setSecretToken, lastScreenshot, setScreenshot } = useDispatchStore();
  const [url, setUrl] = useState(serverUrl);
  const [token, setToken] = useState(secretToken);
  const [refreshing, setRefreshing] = useState(false);

  const save = () => {
    setServerUrl(url.trim());
    setSecretToken(token.trim());
    Alert.alert("Saved", "Settings updated.");
  };

  const test = async () => {
    try {
      const data = await checkHealth();
      Alert.alert("Connected", `Laptop is running. Uptime: ${data.uptime}`);
    } catch {
      Alert.alert("Failed", "Cannot reach laptop. Check URL and token.");
    }
  };

  const manualRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getScreenshot();
      setScreenshot(data.screenshot);
    } catch (e) {
      Alert.alert("Error", "Could not fetch screenshot.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.label}>Server URL</Text>
      <TextInput
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        style={styles.input}
        placeholder="https://abc123.ngrok.io"
        placeholderTextColor="#9ca3af"
      />

      <Text style={styles.label}>Secret Token</Text>
      <TextInput
        value={token}
        onChangeText={setToken}
        secureTextEntry
        style={styles.input}
        placeholder="your_secret_token"
        placeholderTextColor="#9ca3af"
      />

      <TouchableOpacity onPress={save} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={test} style={styles.testButton}>
        <Text style={styles.testButtonText}>Test Connection</Text>
      </TouchableOpacity>

      {/* Live Desktop View */}
      <View style={styles.screenshotSection}>
        <View style={styles.screenshotHeader}>
          <Text style={styles.screenshotLabel}>Desktop View</Text>
          <TouchableOpacity onPress={manualRefresh} disabled={refreshing}>
            {refreshing ? (
              <ActivityIndicator size="small" color="#A25945" />
            ) : (
              <Text style={styles.refreshText}>Refresh</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.screenshotCard}>
          {lastScreenshot ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${lastScreenshot}` }}
              style={styles.screenshot}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Tap refresh to see screen</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F8",
    padding: 20,
  },
  title: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 30,
    marginTop: 20,
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
    height: 200,
  },
  placeholder: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  placeholderText: {
    color: "#9ca3af",
    fontSize: 14,
  },
});
