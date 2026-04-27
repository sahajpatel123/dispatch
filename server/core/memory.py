import sqlite3
import time
import os
import json
from datetime import datetime
from pathlib import Path
from PIL import Image
import io
import mss

# Try to import native macOS Vision for OCR
try:
    import Vision
    import Quartz
    import Cocoa
    from objc import at
    HAS_NATIVE_OCR = True
except ImportError:
    HAS_NATIVE_OCR = False

DB_PATH = Path("logs/memory.db")

class MemoryStore:
    def __init__(self):
        DB_PATH.parent.mkdir(exist_ok=True)
        self.conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        self.create_tables()

    def create_tables(self):
        cursor = self.conn.cursor()
        # Full Text Search (FTS5) for fast querying
        cursor.execute("CREATE VIRTUAL TABLE IF NOT EXISTS screen_memory USING fts5(content, app_context, timestamp UNINDEXED)")
        # Metadata table for raw data
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS metadata (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                app_name TEXT,
                window_title TEXT,
                ocr_text TEXT,
                screenshot_path TEXT
            )
        """)
        self.conn.commit()

    def save_moment(self, app_name, window_title, ocr_text, screenshot_path=None):
        cursor = self.conn.cursor()
        timestamp = datetime.now().isoformat()
        
        # Save to FTS table
        context = f"App: {app_name} | Window: {window_title}"
        cursor.execute("INSERT INTO screen_memory (content, app_context, timestamp) VALUES (?, ?, ?)",
                       (ocr_text, context, timestamp))
        
        # Save to metadata table
        cursor.execute("INSERT INTO metadata (timestamp, app_name, window_title, ocr_text, screenshot_path) VALUES (?, ?, ?, ?, ?)",
                       (timestamp, app_name, window_title, ocr_text, screenshot_path))
        
        self.conn.commit()

    def search(self, query: str, limit: int = 5):
        cursor = self.conn.cursor()
        if not query or query.strip() in ['*', '']:
            cursor.execute("""
                SELECT content, app_context, timestamp 
                FROM screen_memory 
                ORDER BY timestamp DESC 
                LIMIT ?
            """, (limit,))
        else:
            try:
                cursor.execute("""
                    SELECT content, app_context, timestamp 
                    FROM screen_memory 
                    WHERE content MATCH ? 
                    ORDER BY timestamp DESC 
                    LIMIT ?
                """, (query, limit))
            except sqlite3.OperationalError:
                # Fallback to simple LIKE if FTS5 syntax fails
                cursor.execute("""
                    SELECT content, app_context, timestamp 
                    FROM screen_memory 
                    WHERE content LIKE ? 
                    ORDER BY timestamp DESC 
                    LIMIT ?
                """, (f"%{query}%", limit))
        return cursor.fetchall()

class OCRProcessor:
    @staticmethod
    def get_text_native(image_bytes):
        if not HAS_NATIVE_OCR:
            return "OCR Not Supported (Missing pyobjc Vision)"

        # Convert bytes to NSData
        data = Cocoa.NSData.dataWithBytes_length_(image_bytes, len(image_bytes))
        image = Cocoa.NSImage.alloc().initWithData_(data)
        
        if not image:
            return ""

        # Create Vision request
        request = Vision.VNRecognizeTextRequest.alloc().init()
        request.setRecognitionLevel_(Vision.VNRequestTextRecognitionLevelAccurate)
        
        handler = Vision.VNImageRequestHandler.alloc().initWithData_options_(data, None)
        success, error = handler.performRequests_error_([request], None)
        
        if not success:
            return ""

        results = request.results()
        text_segments = []
        for result in results:
            candidates = result.topCandidates_(1)
            if candidates:
                text_segments.append(candidates[0].string())
        
        return "\n".join(text_segments)

def get_screen_hash():
    """Returns a simple hash of the screen to detect changes"""
    with mss.mss() as sct:
        # Grab a very small thumbnail for comparison
        monitor = sct.monitors[1]
        sct_img = sct.grab(monitor)
        img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
        img = img.resize((32, 32)).convert("L")
        return hash(img.tobytes())

def run_memory_loop():
    print("Starting Memory Daemon...")
    store = MemoryStore()
    ocr = OCRProcessor()
    last_hash = None
    
    # Imports here to avoid circular dependencies
    from core.action_primitives import get_active_window, take_screenshot
    import base64

    while True:
        try:
            current_hash = get_screen_hash()
            
            # Only process if screen changed
            if current_hash != last_hash:
                active_app = get_active_window()
                
                # Take raw screenshot for OCR
                with mss.mss() as sct:
                    monitor = sct.monitors[1]
                    sct_img = sct.grab(monitor)
                    img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
                    
                    # Convert to bytes for Vision
                    buffer = io.BytesIO()
                    img.save(buffer, format="JPEG", quality=80)
                    img_bytes = buffer.getvalue()
                
                text = ocr.get_text_native(img_bytes)
                
                if text.strip():
                    store.save_moment(active_app, active_app, text)
                    # print(f"Memory Saved: {active_app}")
                
                last_hash = current_hash
            
            # Wait 30 seconds (Battery efficiency)
            time.sleep(30)
            
        except Exception as e:
            print(f"Memory Loop Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    run_memory_loop()
