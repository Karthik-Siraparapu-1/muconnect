import express from "express";
import { createServer as createViteServer } from "vite";
import db from "./src/db";
import multer from "multer";
import path from "path";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";

// Configure Multer for file uploads
const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Create HTTP server explicitly to attach WebSocket
  const server = http.createServer(app);

  // Initialize WebSocket Server
  const wss = new WebSocketServer({ server });

  // Map to store connected clients: userId -> WebSocket
  const clients = new Map<number, WebSocket>();

  wss.on('connection', (ws, req) => {
    // Simple auth via query param for this demo
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const userId = parseInt(url.searchParams.get('userId') || '0');

    if (userId) {
      clients.set(userId, ws);
      console.log(`User ${userId} connected via WebSocket`);

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === 'chat') {
            const { receiverId, content } = data;
            
            // Save to DB
            const info = db.prepare('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)').run(userId, receiverId, content);
            const messageId = info.lastInsertRowid;
            const timestamp = new Date().toISOString(); // Use current time for immediate feedback

            const payload = JSON.stringify({
              type: 'chat',
              id: messageId,
              senderId: userId,
              receiverId,
              content,
              createdAt: timestamp
            });

            // Send to receiver if connected
            const receiverWs = clients.get(receiverId);
            if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
              receiverWs.send(payload);
            }

            // Send confirmation back to sender (optional, but good for consistency)
            // In a real app, we might rely on optimistic UI updates or wait for server ack.
            // Here we just let the client handle its own optimistic update or refetch.
          }
        } catch (e) {
          console.error('WebSocket message error:', e);
        }
      });

      ws.on('close', () => {
        clients.delete(userId);
        console.log(`User ${userId} disconnected`);
      });
    } else {
      ws.close();
    }
  });

  app.use(express.json());
  
  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadDir));

  // API Routes

  // Signup
  app.post("/api/signup", (req, res) => {
    try {
      const { email, password, gender } = req.body;

      // Validate Email Domain
      if (!email.endsWith("@marwadiuniversity.ac.in")) {
        return res.status(400).json({ error: "Must use a Marwadi University email (@marwadiuniversity.ac.in)" });
      }

      // Simple validation
      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      if (!['male', 'female'].includes(gender)) {
        return res.status(400).json({ error: "Please select a gender" });
      }

      // Check if user exists
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Create user
      const info = db.prepare('INSERT INTO users (email, password, gender) VALUES (?, ?, ?)').run(email, password, gender);
      
      res.json({ success: true, userId: info.lastInsertRowid });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Login
  app.post("/api/login", (req, res) => {
    try {
      const { email, password } = req.body;
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({ success: true, user: { id: user.id, email: user.email, gender: user.gender } });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Verify User
  app.get("/api/me/:userId", (req, res) => {
    try {
      const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify user" });
    }
  });

  // Get Profile
  app.get("/api/profile/:userId", (req, res) => {
    try {
      const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.params.userId);
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Upload Profile Picture
  app.post("/api/upload", upload.single('profilePic'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // Create/Update Profile
  app.post("/api/profile", async (req, res) => {
    try {
      const { 
        userId, name, bio, course, year, interests, 
        profile_pic_url, social_links, nicknames, habits, 
        department, class_section, location, dob, hometown,
        aiEnhancedBio, aiTags
      } = req.body;

      const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
      if (!userExists) {
        return res.status(400).json({ error: "User not found" });
      }

      const existing = db.prepare('SELECT user_id FROM profiles WHERE user_id = ?').get(userId);

      if (existing) {
        db.prepare(`
          UPDATE profiles 
          SET name = ?, bio = ?, course = ?, year = ?, interests = ?, ai_enhanced_bio = ?, ai_tags = ?,
              profile_pic_url = ?, social_links = ?, nicknames = ?, habits = ?, department = ?, 
              class_section = ?, location = ?, dob = ?, hometown = ?
          WHERE user_id = ?
        `).run(
          name, bio, course, year, interests, aiEnhancedBio, aiTags,
          profile_pic_url, social_links, nicknames, habits, department, 
          class_section, location, dob, hometown,
          userId
        );
      } else {
        db.prepare(`
          INSERT INTO profiles (
            user_id, name, bio, course, year, interests, ai_enhanced_bio, ai_tags,
            profile_pic_url, social_links, nicknames, habits, department, 
            class_section, location, dob, hometown
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          userId, name, bio, course, year, interests, aiEnhancedBio, aiTags,
          profile_pic_url, social_links, nicknames, habits, department, 
          class_section, location, dob, hometown
        );
      }

      res.json({ success: true, aiEnhancedBio, aiTags: JSON.parse(aiTags || "[]") });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to save profile" });
    }
  });

  // Get Matches (Opposite Gender)
  app.get("/api/matches", (req, res) => {
    try {
      const { userId, gender } = req.query;
      const targetGender = gender === 'male' ? 'female' : 'male';
      
      const matches = db.prepare(`
        SELECT u.id, p.*
        FROM users u
        JOIN profiles p ON u.id = p.user_id
        WHERE u.gender = ? AND u.id != ?
      `).all(targetGender, userId);

      res.json(matches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });

  // Discover Profiles (for swiping)
  app.get("/api/discover", (req, res) => {
    try {
      const { userId, gender } = req.query;
      const targetGender = gender === 'male' ? 'female' : 'male';
      
      // Get profiles of opposite gender that haven't been swiped on yet
      const profiles = db.prepare(`
        SELECT u.id, p.*
        FROM users u
        JOIN profiles p ON u.id = p.user_id
        WHERE u.gender = ? AND u.id != ?
        AND u.id NOT IN (
          SELECT receiver_id FROM connections WHERE sender_id = ?
        )
      `).all(targetGender, userId, userId);

      res.json(profiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch discover profiles" });
    }
  });

  // Search Profiles
  app.get("/api/search", (req, res) => {
    try {
      const { userId, gender, department, year, city, interest } = req.query;
      const targetGender = gender === 'male' ? 'female' : 'male';
      
      let query = `
        SELECT u.id, p.*
        FROM users u
        JOIN profiles p ON u.id = p.user_id
        WHERE u.gender = ? AND u.id != ?
      `;
      const params: any[] = [targetGender, userId];

      if (department) {
        query += ` AND p.department LIKE ?`;
        params.push(`%${department}%`);
      }
      if (year) {
        query += ` AND p.year = ?`;
        params.push(year);
      }
      if (city) {
        query += ` AND (p.location LIKE ? OR p.hometown LIKE ?)`;
        params.push(`%${city}%`, `%${city}%`);
      }
      if (interest) {
        query += ` AND (p.interests LIKE ? OR p.ai_tags LIKE ?)`;
        params.push(`%${interest}%`, `%${interest}%`);
      }

      const profiles = db.prepare(query).all(...params);
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to search profiles" });
    }
  });

  // Swipe / Connect
  app.post("/api/connections", (req, res) => {
    try {
      const { senderId, receiverId, action } = req.body; // action: 'like' or 'pass'
      
      if (action === 'pass') {
        db.prepare('INSERT INTO connections (sender_id, receiver_id, status) VALUES (?, ?, ?)')
          .run(senderId, receiverId, 'rejected');
        return res.json({ success: true, match: false });
      }

      // Check if receiver already liked sender
      const existingLike = db.prepare('SELECT id FROM connections WHERE sender_id = ? AND receiver_id = ? AND status = ?')
        .get(receiverId, senderId, 'pending');

      if (existingLike) {
        // It's a match! Update both to accepted
        db.prepare('UPDATE connections SET status = ? WHERE id = ?').run('accepted', existingLike.id);
        db.prepare('INSERT INTO connections (sender_id, receiver_id, status) VALUES (?, ?, ?)')
          .run(senderId, receiverId, 'accepted');
        return res.json({ success: true, match: true });
      } else {
        // Just a regular like
        db.prepare('INSERT INTO connections (sender_id, receiver_id, status) VALUES (?, ?, ?)')
          .run(senderId, receiverId, 'pending');
        return res.json({ success: true, match: false });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to process connection" });
    }
  });

  // Get Connections (Accepted)
  app.get("/api/connections/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      const connections = db.prepare(`
        SELECT u.id, p.*
        FROM users u
        JOIN profiles p ON u.id = p.user_id
        JOIN connections c ON u.id = c.receiver_id
        WHERE c.sender_id = ? AND c.status = 'accepted'
      `).all(userId);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch connections" });
    }
  });

  // Report User
  app.post("/api/reports", (req, res) => {
    try {
      const { reporterId, reportedId, reason } = req.body;
      db.prepare('INSERT INTO reports (reporter_id, reported_id, reason) VALUES (?, ?, ?)')
        .run(reporterId, reportedId, reason);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to submit report" });
    }
  });

  // Get Messages
  app.get("/api/messages/:otherUserId", (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const otherUserId = parseInt(req.params.otherUserId);

      if (!userId) return res.status(400).json({ error: "User ID required" });

      const messages = db.prepare(`
        SELECT * FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at ASC
      `).all(userId, otherUserId, otherUserId, userId);

      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
