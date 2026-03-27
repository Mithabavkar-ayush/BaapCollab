"""
WebSocket Connection Manager for real-time feed updates.
Tracks connected clients and broadcasts events (new posts, comments, etc.)
"""

from fastapi import WebSocket
import json


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"🔌 [WS] Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"🔌 [WS] Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, data: dict):
        """Send a JSON message to all connected clients."""
        if not self.active_connections:
            return

        message = json.dumps(data, default=str)
        print(f"📡 [WS] Broadcasting {data.get('type')}: {len(self.active_connections)} clients")
        
        dead_links = []
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"⚠️ [WS] Broadcast failed for a client: {e}")
                dead_links.append(connection)

        # Cleanup
        for dead in dead_links:
            self.disconnect(dead)


# Singleton instance
manager = ConnectionManager()
