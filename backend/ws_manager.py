"""
WebSocket Connection Manager for real-time feed updates.
Tracks connected clients and broadcasts events (new posts, comments, etc.)
"""

from fastapi import WebSocket
import json


class ConnectionManager:
    def __init__(self):
        # Maps user_id (int) to a list of active WebSocket connections
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: Optional[int] = None):
        await websocket.accept()
        if user_id is not None:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = []
            self.active_connections[user_id].append(websocket)
            print(f"🔌 WebSocket connected for User {user_id}. Connections for this user: {len(self.active_connections[user_id])}")
        else:
            # Anonymous or handle fallback
            if 0 not in self.active_connections:
                self.active_connections[0] = []
            self.active_connections[0].append(websocket)
            print("🔌 Anonymous WebSocket connected.")

    def disconnect(self, websocket: WebSocket, user_id: Optional[int] = None):
        uid = user_id if user_id is not None else 0
        if uid in self.active_connections:
            if websocket in self.active_connections[uid]:
                self.active_connections[uid].remove(websocket)
            if not self.active_connections[uid]:
                del self.active_connections[uid]
        print(f"🔌 WebSocket disconnected for User {uid}. Remaining users: {len(self.active_connections)}")

    async def send_to_user(self, user_id: int, data: dict):
        """Send a JSON message ONLY to a specific user's active connections."""
        if user_id not in self.active_connections:
            return
            
        message = json.dumps(data, default=str)
        dead_connections = []
        for connection in self.active_connections[user_id]:
            try:
                await connection.send_text(message)
            except Exception:
                dead_connections.append(connection)
        
        # Cleanup
        for conn in dead_connections:
            self.disconnect(conn, user_id)

    async def broadcast(self, data: dict):
        """Send a JSON message to all connected clients."""
        message = json.dumps(data, default=str)
        for user_id, connections in list(self.active_connections.items()):
            dead_connections = []
            for connection in connections:
                try:
                    await connection.send_text(message)
                except Exception:
                    dead_connections.append(connection)
            
            # Cleanup
            for conn in dead_connections:
                self.disconnect(conn, user_id)

# Singleton instance shared across the app
manager = ConnectionManager()
