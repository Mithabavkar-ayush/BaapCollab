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
        print(f"🔌 WebSocket connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"🔌 WebSocket disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, data: dict):
        """Send a JSON message to all connected clients."""
        message = json.dumps(data, default=str)
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)
        # Clean up dead connections
        for conn in disconnected:
            self.disconnect(conn)


# Singleton instance shared across the app
manager = ConnectionManager()
