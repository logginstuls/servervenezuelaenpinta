import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ======================================================
// 🔥 Almacenamiento en memoria
// ======================================================
let sessions = {};
let lastId = 0;

// ======================================================
// 📩 Enviar mensaje
// ======================================================
app.post("/api/send", (req, res) => {
  const { sender, text, sessionId } = req.body;
  if (!sender || !text || !sessionId) {
    return res.status(400).json({ success: false, message: "Faltan datos o sessionId" });
  }
  if (!sessions[sessionId]) sessions[sessionId] = [];
  const newMessage = {
    id: ++lastId,
    sender,
    text,
    timestamp: new Date().toISOString(),
  };
  sessions[sessionId].push(newMessage);
  console.log(`💬 [${sessionId}] ${sender}: ${text}`);
  return res.json({ success: true });
});

// ======================================================
// 💬 Obtener mensajes de una sesión específica
// ======================================================
app.post("/api/messages", (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ success: false, message: "Falta sessionId" });
  const chatMessages = sessions[sessionId] || [];
  return res.json({ success: true, messages: chatMessages });
});

// ======================================================
// 🧩 Obtener lista de sesiones activas
// ======================================================
app.get("/api/sessions", (req, res) => {
  const list = Object.keys(sessions)
    .map(id => ({
      id,
      messageCount: sessions[id].length,
      lastMessage: sessions[id][sessions[id].length-1] || null,
      online: true,
      name: sessions[id].meta?.name || id
    }))
    .sort((a, b) => {
      const timeA = a.lastMessage?.timestamp || 0;
      const timeB = b.lastMessage?.timestamp || 0;
      return timeB.localeCompare(timeA); // más reciente primero
    });
  return res.json({ success: true, sessions: list });
});

// ======================================================
// ✏️ Renombrar sesión
// ======================================================
app.post("/api/rename-session", (req, res) => {
  const { sessionId, newName } = req.body;
  if (!sessionId || !newName) return res.status(400).json({ success: false, message: "Faltan datos" });
  if (!sessions[sessionId]) return res.status(404).json({ success: false, message: "Sesión no encontrada" });
  if (!sessions[sessionId].meta) sessions[sessionId].meta = {};
  sessions[sessionId].meta.name = newName;
  console.log(`✏️ Sesión ${sessionId} renombrada a "${newName}"`);
  return res.json({ success: true, message: "Sesión renombrada correctamente" });
});

// ======================================================
// 🗑️ Eliminar sesión
// ======================================================
app.post("/api/delete-session", (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ success: false, message: "Falta sessionId" });
  if (!sessions[sessionId]) return res.status(404).json({ success: false, message: "Sesión no encontrada" });
  delete sessions[sessionId];
  console.log(`🗑️ Sesión eliminada: ${sessionId}`);
  return res.json({ success: true, message: "Sesión eliminada correctamente" });
});


// ======================================================
// 🟢 Ping para mantener vivo
// ======================================================
app.get("/ping", (req, res) => res.send("pong"));

// ======================================================
// 🚀 Inicializar servidor
// ======================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor activo en puerto ${PORT}`));

