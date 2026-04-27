# ⚡ Dispatch: Your Mac, Autonomous.

> "The bridge between your pocket and your workstation is now a living, breathing agent."

Dispatch is a high-performance, autonomous macOS automation system that turns your laptop into a self-aware agent. It doesn't just "remote control" your Mac; it **sees**, **remembers**, and **reasons** through complex objectives.

---

## 🧠 What makes Dispatch "Extreme"?

### 🛰️ The Autonomous Agent Loop
Dispatch doesn't just execute single commands. You give it a **Goal** (e.g., *"Find the hex code from the design I was looking at 2 hours ago and Slack it to John"*), and the backend enters a reasoning loop. It observes the screen, takes an action, evaluates the result, and continues until the objective is met.

### 📼 "Rewind" Semantic Memory
A background daemon silently monitors your Mac's state every 30 seconds. Using **Native macOS Vision OCR**, it indexes everything you see into a local SQLite FTS5 database. 
- **Privacy First:** All OCR and indexing happen locally on your silicon.
- **Instant Recall:** The agent can search its own memory to answer questions about things you've seen in the past.

### 👻 Ghost Touch & Native Injection
- **Zero-Latency Control:** Uses native AppleScript for hardware-level UI interaction.
- **Buffer Injection:** Bypasses the keyboard to inject text directly into UI elements, making it faster and more reliable than standard "typewriter" automation.
- **Smart Search:** Deep integration with Safari, Chrome, Cursor, Spotify, and Finder.

---

## 🛠️ Tech Stack

- **Backend:** FastAPI (Python 3.14+)
- **Brain:** Gemini Pro (via Gemini CLI)
- **Mobile:** React Native / Expo (Liquid Glass UI)
- **Vision:** macOS Native Vision Framework (OCR)
- **Tunneling:** Ngrok for secure, permanent global access.

---

## 🚀 Quick Start

1. **Clone the brain:**
   ```bash
   git clone https://github.com/sahajpatel123/dispatch.git
   cd dispatch
   ```

2. **Power up the server:**
   ```bash
   cd server
   source venv/bin/activate
   pip install -r requirements.txt
   python main.py
   ```

3. **Ignite the Mobile App:**
   ```bash
   cd phone-app
   npm install
   npx expo start
   ```

---

## 📜 Roadmap

- [x] **Autonomous Reasoning Loop**
- [x] **Semantic "Rewind" Memory**
- [x] **Liquid Glass Mobile UI**
- [ ] **Real-time WebSocket Voice Stream**
- [ ] **Vector Embedding Search for Visual Memory**

---

*Built with ❤️ for the dreamers who want their Mac to work while they sleep.*
