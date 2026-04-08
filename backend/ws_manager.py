"""
WebSocket Connection Manager for real-time feed updates.
Tracks connected clients and broadcasts events (new posts, comments, etc.)
"""

from fastapi import WebSocket
import json
from typing import Optional


class ConnectionManager:
    def __init__(self):
        # Maps room (str) -> user_id (int) -> list of active WebSocket connections
        self.active_connections: dict[str, dict[int, list[WebSocket]]] = {}

    async def connect(self, websocket: WebSocket, user_id: Optional[int] = None, room: str = "feed"):
        await websocket.accept()
        if room not in self.active_connections:
            self.active_connections[room] = {}
            
        uid = user_id if user_id is not None else 0
        if uid not in self.active_connections[room]:
            self.active_connections[room][uid] = []
            
        self.active_connections[room][uid].append(websocket)
        print(f"🔌 WebSocket connected for User {uid} in room '{room}'.")

    def disconnect(self, websocket: WebSocket, user_id: Optional[int] = None, room: str = "feed"):
        uid = user_id if user_id is not None else 0
        if room in self.active_connections:
            if uid in self.active_connections[room]:
                if websocket in self.active_connections[room][uid]:
                    self.active_connections[room][uid].remove(websocket)
                if not self.active_connections[room][uid]:
                    del self.active_connections[room][uid]
            if not self.active_connections[room]:
                del self.active_connections[room]
        print(f"🔌 WebSocket disconnected for User {uid} from room '{room}'.")

    async def send_to_user(self, user_id: int, data: dict, room: str = "feed"):
        """Send a JSON message ONLY to a specific user's active connections in a room."""
        if room not in self.active_connections or user_id not in self.active_connections[room]:
            return
            
        message = json.dumps(data, default=str)
        dead_connections = []
        for connection in self.active_connections[room][user_id]:
            try:
                await connection.send_text(message)
            except Exception:
                dead_connections.append(connection)
        
        # Cleanup
        for conn in dead_connections:
            self.disconnect(conn, user_id, room)

    async def broadcast(self, data: dict, room: str = "feed"):
        """Send a JSON message to all connected clients in a room."""
        if room not in self.active_connections:
            return
            
        message = json.dumps(data, default=str)
        for user_id, connections in list(self.active_connections[room].items()):
            dead_connections = []
            for connection in connections:
                try:
                    await connection.send_text(message)
                except Exception:
                    dead_connections.append(connection)
            
            # Cleanup
            for conn in dead_connections:
                self.disconnect(conn, user_id, room)

# Singleton instance shared across the app
manager = ConnectionManager()
