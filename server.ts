import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercel = Boolean(process.env.VERCEL);

// Ensure uploads directory exists
const dataDir = isVercel ? "/tmp" : __dirname;
const uploadDir = path.join(dataDir, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const allowedUploadMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
]);

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExt = ext === ".pdf" || ext === ".jpg" || ext === ".jpeg";
    const allowedMime = allowedUploadMimeTypes.has((file.mimetype || "").toLowerCase());
    if (allowedExt && allowedMime) {
      return cb(null, true);
    }
    cb(new Error("Only PDF and JPG files are allowed."));
  },
});

const dbPath = path.join(dataDir, "hossana_driving.db");
const db = new Database(dbPath);
const hasColumn = (tableName: string, columnName: string) => {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  return columns.some((c) => c.name === columnName);
};

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone_number TEXT UNIQUE NOT NULL,
    national_id TEXT UNIQUE NOT NULL,
    license_number TEXT UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS licenses (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    plate_info TEXT,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    license_number TEXT NOT NULL,
    national_id TEXT NOT NULL,
    last_registration_date TEXT,
    expiry_date TEXT,
    documents TEXT,
    status TEXT DEFAULT 'pending',
    paid INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    status TEXT DEFAULT 'ordered', -- ordered, manufactured, given
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    method TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id)
  );

  CREATE TABLE IF NOT EXISTS profile_change_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    requested_full_name TEXT,
    requested_national_id TEXT,
    requested_license_number TEXT,
    status TEXT DEFAULT 'pending',
    admin_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_plates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plate_number TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS license_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    where_learned TEXT,
    passed_exam TEXT,
    exam_score TEXT,
    training_document TEXT,
    coc_document TEXT,
    status TEXT DEFAULT 'pending',
    admin_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    invited_full_name TEXT,
    invited_phone TEXT,
    invited_email TEXT NOT NULL,
    invited_password TEXT,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'pending',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME
  );
`);

// Migration: Add 'paid' column if it doesn't exist
try {
  db.exec("ALTER TABLE applications ADD COLUMN paid INTEGER DEFAULT 0");
} catch (e) {
  // Column probably already exists
}

// Migration: Add 'email' column if it doesn't exist.
// SQLite cannot reliably add a new UNIQUE column via ALTER TABLE on existing tables.
try {
  db.exec("ALTER TABLE users ADD COLUMN email TEXT");
} catch (e) {
  // Column probably already exists
}
try {
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)");
} catch (e) {
  // Keep startup resilient if existing data violates uniqueness
}

// Migration: Add admin-manageable user profile/document columns
try {
  db.exec("ALTER TABLE users ADD COLUMN profile_note TEXT");
} catch (e) {
  // Column probably already exists
}
try {
  db.exec("ALTER TABLE users ADD COLUMN license_document TEXT");
} catch (e) {
  // Column probably already exists
}
try {
  db.exec("ALTER TABLE users ADD COLUMN plate_document TEXT");
} catch (e) {
  // Column probably already exists
}
try {
  db.exec("ALTER TABLE users ADD COLUMN created_at DATETIME");
} catch (e) {
  // Column probably already exists
}

const usersHasCreatedAt = hasColumn("users", "created_at");

// Seed some sample licenses for testing search
const seedLicenses = db.prepare("INSERT OR IGNORE INTO licenses (id, full_name, issue_date, expiry_date, plate_info) VALUES (?, ?, ?, ?, ?)");
seedLicenses.run("DL-12345", "Abebe Kebede", "2020-01-15", "2025-01-15", "AA-2-B12345");
seedLicenses.run("DL-67890", "Mulugeta Tesfaye", "2021-05-20", "2026-05-20", "OR-3-A67890");

// Seed Admin User
const seedAdmin = db.prepare("INSERT OR IGNORE INTO users (full_name, email, phone_number, national_id, license_number, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)");
seedAdmin.run("Admin User", "admin@hossana.local", "0900000000", "ADMIN-001", "ADMIN-001", "admin123", "admin");

const app = express();
app.use(express.json());

const PORT = 3000;

// Auth Endpoints
const otps = new Map<string, string>();
const passwordOtps = new Map<string, string>();

const smtpConfigured = Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  process.env.SMTP_FROM
);

const mailTransporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

app.post("/api/otp/send", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (!mailTransporter) {
    return res.status(503).json({
      error: "Email OTP is not configured on server. Add SMTP settings in .env and restart.",
    });
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  otps.set(email, otp);

  try {
    await mailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Your Hossana verification code",
      text: `Your Hossana Driving License verification code is: ${otp}`,
    });
    res.json({ success: true, message: "OTP sent to your email" });
  } catch (err: any) {
    console.error("Email delivery error:", err);
    res.status(500).json({ error: "Failed to send email OTP. Check SMTP configuration." });
  }
});

app.post("/api/register", (req, res) => {
  const {
    full_name,
    email,
    phone_number,
    national_id,
    license_number,
    password,
    otp,
    has_license,
    issue_date,
    expiry_date,
    invite_token,
  } = req.body;
  
  let inviteRow: any = null;
  if (invite_token) {
    inviteRow = db.prepare("SELECT * FROM user_invites WHERE token = ? AND status = 'pending'").get(invite_token) as any;
    if (!inviteRow) {
      return res.status(400).json({ error: "Invalid or expired invite link." });
    }
    if (String(inviteRow.invited_email).toLowerCase() !== String(email).toLowerCase()) {
      return res.status(400).json({ error: "Invite email does not match this account email." });
    }
  }

  // Verify OTP for normal registrations (invite link can bypass OTP)
  if (!inviteRow && otps.get(email) !== otp) {
    return res.status(400).json({ error: "Invalid OTP." });
  }
  if (!inviteRow) otps.delete(email);

  const hasLicense = Boolean(has_license);
  const checkUserByLicense = db.prepare("SELECT id FROM users WHERE license_number = ?");
  const finalLicenseNumber = (license_number || "").trim();

  if (hasLicense) {
    if (!finalLicenseNumber) {
      return res.status(400).json({ error: "License number is required if you already have a license." });
    }
    const existing = checkUserByLicense.get(finalLicenseNumber);
    if (existing) {
      return res.status(400).json({ error: "License number already exists. Use a different one." });
    }
    if (!issue_date) {
      return res.status(400).json({ error: "Issue date is required." });
    }

    const issue = new Date(issue_date);
    if (Number.isNaN(issue.getTime())) {
      return res.status(400).json({ error: "Invalid issue date." });
    }
    const expectedExpiry = new Date(issue);
    expectedExpiry.setFullYear(expectedExpiry.getFullYear() + 4);
    const expectedExpiryStr = expectedExpiry.toISOString().split("T")[0];
    const providedExpiryStr = expiry_date ? String(expiry_date) : expectedExpiryStr;

    if (providedExpiryStr !== expectedExpiryStr) {
      return res.status(400).json({
        error: `Expiry date must be exactly 4 years after issue date (${expectedExpiryStr}).`,
      });
    }
  }

  try {
    const role = inviteRow?.role === "admin" ? "admin" : "user";
    const finalPassword = password || inviteRow?.invited_password;
    if (!finalPassword) {
      return res.status(400).json({ error: "Password is required." });
    }
    const stmt = usersHasCreatedAt
      ? db.prepare("INSERT INTO users (full_name, email, phone_number, national_id, license_number, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)")
      : db.prepare("INSERT INTO users (full_name, email, phone_number, national_id, license_number, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)");
    const info = stmt.run(
      full_name,
      email,
      phone_number,
      national_id,
      hasLicense ? finalLicenseNumber : null,
      finalPassword,
      role
    );
    
    // Create license record only for users who already have a license.
    if (hasLicense) {
      const checkLicense = db.prepare("SELECT * FROM licenses WHERE id = ?");
      if (!checkLicense.get(finalLicenseNumber)) {
        const createLicense = db.prepare("INSERT INTO licenses (id, full_name, issue_date, expiry_date, status) VALUES (?, ?, ?, ?, ?)");
        const issue = String(issue_date);
        const expiryDate = new Date(issue);
        expiryDate.setFullYear(expiryDate.getFullYear() + 4);
        const expiry = expiryDate.toISOString().split("T")[0];
        const status = new Date(expiry) < new Date() ? "expired" : "active";
        createLicense.run(finalLicenseNumber, full_name, issue, expiry, status);
      }
    }

    if (inviteRow) {
      db.prepare("UPDATE user_invites SET status = 'used', used_at = CURRENT_TIMESTAMP WHERE id = ?").run(inviteRow.id);
    }

    res.json({ id: info.lastInsertRowid, full_name, email, role, license_number: hasLicense ? finalLicenseNumber : null });
  } catch (err: any) {
    if (typeof err?.message === "string") {
      if (err.message.includes("users.phone_number")) {
        return res.status(400).json({ error: "Phone number already registered." });
      }
      if (err.message.includes("users.national_id")) {
        return res.status(400).json({ error: "National ID already registered." });
      }
      if (err.message.includes("users.email")) {
        return res.status(400).json({ error: "Email already registered." });
      }
      if (err.message.includes("users.license_number")) {
        return res.status(400).json({ error: "License number already exists. Use a different one or leave it empty." });
      }
    }
    res.status(400).json({ error: err.message || "Registration failed." });
  }
});

app.post("/api/login", (req, res) => {
  const { identifier, password } = req.body; // identifier can be phone, email, or license ID
  const stmt = db.prepare("SELECT * FROM users WHERE (phone_number = ? OR email = ? OR license_number = ?) AND password = ?");
  const user = stmt.get(identifier, identifier, identifier, password) as any;
  if (user) {
    res.json({ id: user.id, full_name: user.full_name, email: user.email, role: user.role, phone_number: user.phone_number, national_id: user.national_id, license_number: user.license_number });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.post("/api/password/forgot", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (!user) {
    return res.status(404).json({ error: "No account found with this email." });
  }
  if (!mailTransporter) {
    return res.status(503).json({ error: "Email service is not configured." });
  }
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  passwordOtps.set(email, otp);
  try {
    await mailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Password reset verification code",
      text: `Your password reset code is: ${otp}`,
    });
    res.json({ success: true, message: "Verification code sent to your email." });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to send reset code." });
  }
});

app.post("/api/password/reset", (req, res) => {
  const { email, otp, new_password } = req.body;
  if (!email || !otp || !new_password) {
    return res.status(400).json({ error: "Email, OTP, and new password are required." });
  }
  if (passwordOtps.get(email) !== otp) {
    return res.status(400).json({ error: "Invalid verification code." });
  }
  passwordOtps.delete(email);
  db.prepare("UPDATE users SET password = ? WHERE email = ?").run(new_password, email);
  res.json({ success: true, message: "Password reset successful." });
});

app.post("/api/contact", async (req, res) => {
  const { name, phone, email, body } = req.body;
  if (!name || !phone || !email || !body) {
    return res.status(400).json({ error: "Name, phone, email, and message are required." });
  }
  if (!mailTransporter || !process.env.SMTP_FROM) {
    return res.status(503).json({ error: "Email service is not configured." });
  }

  try {
    await mailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_FROM,
      subject: `Contact Message - Hossana DL (${name})`,
      text: [
        `Name: ${name}`,
        `Phone: ${phone}`,
        `Email: ${email}`,
        "",
        "Message:",
        body,
      ].join("\n"),
    });
    res.json({ success: true, message: "Message sent successfully." });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to send message." });
  }
});

// License Search
app.get("/api/license/:id", (req, res) => {
  const stmt = db.prepare("SELECT * FROM licenses WHERE id = ?");
  const license = stmt.get(req.params.id);
  if (license) {
    res.json(license);
  } else {
    res.status(404).json({ error: "License not found" });
  }
});

// Applications
app.post("/api/applications", (req, res) => {
  const { user_id, license_number, national_id, last_registration_date, expiry_date, documents } = req.body;
  try {
    const stmt = db.prepare("INSERT INTO applications (user_id, license_number, national_id, last_registration_date, expiry_date, documents) VALUES (?, ?, ?, ?, ?, ?)");
    const docValue = typeof documents === "string" ? documents : "";
    const info = stmt.run(user_id, license_number, national_id, last_registration_date, expiry_date, docValue);
    res.json({ id: info.lastInsertRowid });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/user/:userId/applications", (req, res) => {
  const stmt = db.prepare(`
    SELECT 
      a.id,
      a.user_id,
      a.license_number,
      a.national_id,
      a.last_registration_date,
      a.expiry_date,
      TRIM(COALESCE(a.documents, ''), '"') as documents,
      a.status,
      a.paid,
      a.created_at,
      o.status as order_status,
      p.transaction_id as receipt_transaction_id,
      p.method as payment_method,
      p.amount as payment_amount,
      p.created_at as payment_created_at
    FROM applications a 
    LEFT JOIN orders o ON a.id = o.application_id
    LEFT JOIN payments p ON a.id = p.application_id
    WHERE a.user_id = ? 
    ORDER BY a.created_at DESC
  `);
  const apps = stmt.all(req.params.userId);
  res.json(apps);
});

app.get("/api/user/:userId/profile", (req, res) => {
  const userStmt = db.prepare(`
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.phone_number,
      u.national_id,
      u.license_number,
      u.license_document,
      u.plate_document,
      u.profile_note,
      l.issue_date,
      l.expiry_date,
      l.status as license_status,
      l.plate_info
    FROM users u
    LEFT JOIN licenses l ON l.id = u.license_number
    WHERE u.id = ?
  `);
  const userProfile = userStmt.get(req.params.userId);
  if (!userProfile) {
    return res.status(404).json({ error: "User not found." });
  }

  const plates = db.prepare("SELECT id, plate_number, created_at FROM user_plates WHERE user_id = ? ORDER BY id DESC").all(req.params.userId);
  const profileChanges = db.prepare("SELECT id, requested_full_name, requested_national_id, requested_license_number, status, admin_note, created_at FROM profile_change_requests WHERE user_id = ? ORDER BY id DESC").all(req.params.userId);
  const licenseRequests = db.prepare("SELECT id, where_learned, passed_exam, exam_score, training_document, coc_document, status, admin_note, created_at FROM license_requests WHERE user_id = ? ORDER BY id DESC").all(req.params.userId);

  res.json({ user: userProfile, plates, profile_changes: profileChanges, license_requests: licenseRequests });
});

app.post("/api/user/:userId/profile-change-request", (req, res) => {
  const { full_name, national_id, license_number } = req.body;
  try {
    db.prepare(`
      INSERT INTO profile_change_requests (user_id, requested_full_name, requested_national_id, requested_license_number)
      VALUES (?, ?, ?, ?)
    `).run(req.params.userId, full_name || null, national_id || null, license_number || null);
    res.json({ success: true, message: "Profile change request submitted to admin." });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to submit profile change request." });
  }
});

app.get("/api/user/:userId/plates", (req, res) => {
  const plates = db.prepare("SELECT id, plate_number, created_at FROM user_plates WHERE user_id = ? ORDER BY id DESC").all(req.params.userId);
  res.json(plates);
});

app.post("/api/user/:userId/plates", (req, res) => {
  const { plate_number } = req.body;
  if (!plate_number || !String(plate_number).trim()) {
    return res.status(400).json({ error: "Plate number is required." });
  }
  try {
    db.prepare("INSERT INTO user_plates (user_id, plate_number) VALUES (?, ?)").run(req.params.userId, String(plate_number).trim());
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to add plate." });
  }
});

app.delete("/api/user/:userId/plates/:plateId", (req, res) => {
  db.prepare("DELETE FROM user_plates WHERE id = ? AND user_id = ?").run(req.params.plateId, req.params.userId);
  res.json({ success: true });
});

app.post("/api/user/:userId/license-requests", (req, res) => {
  const { where_learned, passed_exam, exam_score, training_document, coc_document } = req.body;
  try {
    db.prepare(`
      INSERT INTO license_requests (user_id, where_learned, passed_exam, exam_score, training_document, coc_document)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.params.userId, where_learned || null, passed_exam || null, exam_score || null, training_document || null, coc_document || null);
    res.json({ success: true, message: "License request submitted to admin." });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to submit license request." });
  }
});

// Payments
app.post("/api/payments", (req, res) => {
  const { application_id, amount, method } = req.body;
  const transaction_id = "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  try {
    const stmt = db.prepare("INSERT INTO payments (application_id, amount, method, transaction_id) VALUES (?, ?, ?, ?)");
    stmt.run(application_id, amount, method, transaction_id);
    
    // Update application as paid
    db.prepare("UPDATE applications SET paid = 1 WHERE id = ?").run(application_id);
    
    // Create initial order
    db.prepare("INSERT INTO orders (application_id, status) VALUES (?, 'ordered')").run(application_id);

    res.json({ transaction_id, status: 'completed' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Admin Endpoints
app.get("/api/admin/applications", (req, res) => {
  const stmt = db.prepare(`
    SELECT
      a.id,
      a.user_id,
      a.license_number,
      a.national_id,
      a.last_registration_date,
      a.expiry_date,
      TRIM(COALESCE(a.documents, ''), '"') as documents,
      a.status,
      a.paid,
      a.created_at,
      u.full_name as user_name,
      u.phone_number,
      o.status as order_status,
      o.id as order_id
    FROM applications a 
    JOIN users u ON a.user_id = u.id 
    LEFT JOIN orders o ON a.id = o.application_id
    ORDER BY a.created_at DESC
  `);
  const apps = stmt.all();
  res.json(apps);
});

app.get("/api/admin/users", (req, res) => {
  const createdAtSelect = usersHasCreatedAt ? "u.created_at as created_at," : "NULL as created_at,";
  const stmt = db.prepare(`
    SELECT 
      u.id,
      u.full_name,
      u.email,
      u.phone_number,
      u.national_id,
      u.license_number,
      u.role,
      u.profile_note,
      u.license_document,
      u.plate_document,
      ${createdAtSelect}
      l.issue_date,
      l.expiry_date,
      l.status as license_status,
      l.plate_info,
      (
        SELECT lr.status
        FROM license_requests lr
        WHERE lr.user_id = u.id
        ORDER BY lr.id DESC
        LIMIT 1
      ) as latest_license_request_status,
      CASE 
        WHEN (u.license_number IS NULL OR u.license_number = '')
          AND EXISTS (
            SELECT 1
            FROM license_requests lr2
            WHERE lr2.user_id = u.id
          ) THEN 'new_registered'
        WHEN l.expiry_date IS NOT NULL AND date(l.expiry_date) < date('now') THEN 'expired'
        ELSE 'active'
      END as lifecycle_status,
      CASE WHEN l.expiry_date IS NOT NULL AND date(l.expiry_date) < date('now') THEN 1 ELSE 0 END as is_expired
    FROM users u
    LEFT JOIN licenses l ON l.id = u.license_number
    WHERE u.role != 'admin'
    ORDER BY u.id DESC
  `);
  const users = stmt.all();
  res.json(users);
});

app.get("/api/admin/admins", (req, res) => {
  const admins = db.prepare(`
    SELECT id, full_name, email, phone_number, created_at
    FROM users
    WHERE role = 'admin'
    ORDER BY id DESC
  `).all();
  res.json(admins);
});

app.delete("/api/admin/admins/:id", (req, res) => {
  const actorId = Number(req.body?.actor_id || 0);
  const targetId = Number(req.params.id);
  if (actorId && actorId === targetId) {
    return res.status(400).json({ error: "You cannot remove your own admin account." });
  }
  db.prepare("DELETE FROM users WHERE id = ? AND role = 'admin'").run(targetId);
  res.json({ success: true });
});

app.post("/api/admin/invites", async (req, res) => {
  const { full_name, email, role, created_by } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Invite email is required." });
  }
  if (!mailTransporter) {
    return res.status(503).json({ error: "Email service is not configured." });
  }
  const token = `inv_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  const safeRole = role === "admin" ? "admin" : "user";

  db.prepare(`
    INSERT INTO user_invites (token, invited_full_name, invited_phone, invited_email, invited_password, role, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(token, full_name || null, null, email, null, safeRole, created_by || null);

  const baseUrl = process.env.APP_URL || `http://localhost:${PORT}`;
  const inviteUrl = `${baseUrl}?invite=${token}`;

  try {
    await mailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: `You are invited to Hossana DL (${safeRole})`,
      text: `You were invited as ${safeRole}. Open this link to complete registration: ${inviteUrl}`,
    });
    res.json({ success: true, invite_url: inviteUrl });
  } catch (err: any) {
    res.status(500).json({ error: "Invite created but failed to send email." });
  }
});

app.get("/api/admin/invites", (req, res) => {
  const invites = db.prepare(`
    SELECT id, token, invited_full_name, invited_phone, invited_email, invited_password, role, status, created_at, used_at
    FROM user_invites
    ORDER BY id DESC
  `).all();
  res.json(invites);
});

app.get("/api/invites/:token", (req, res) => {
  const invite = db.prepare(`
    SELECT token, invited_full_name, invited_phone, invited_email, invited_password, role, status
    FROM user_invites
    WHERE token = ?
  `).get(req.params.token) as any;
  if (!invite || invite.status !== "pending") {
    return res.status(404).json({ error: "Invite is invalid or already used." });
  }
  res.json(invite);
});

app.post("/api/invites/:token/complete-admin", (req, res) => {
  const { full_name, phone_number, email, password } = req.body;
  const invite = db.prepare(`
    SELECT *
    FROM user_invites
    WHERE token = ? AND status = 'pending'
  `).get(req.params.token) as any;

  if (!invite) {
    return res.status(404).json({ error: "Invite is invalid or already used." });
  }
  if (invite.role !== "admin") {
    return res.status(400).json({ error: "This invite is not for admin registration." });
  }
  if (!full_name || !phone_number || !email || !password) {
    return res.status(400).json({ error: "Name, phone, email, and password are required." });
  }
  if (String(email).toLowerCase() !== String(invite.invited_email).toLowerCase()) {
    return res.status(400).json({ error: "Invite email does not match." });
  }

  const nationalId = `ADMIN-${Date.now()}`;
  const licenseNumber = `ADMIN-${Math.floor(100000 + Math.random() * 899999)}`;

  try {
    const stmt = usersHasCreatedAt
      ? db.prepare("INSERT INTO users (full_name, email, phone_number, national_id, license_number, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?, 'admin', CURRENT_TIMESTAMP)")
      : db.prepare("INSERT INTO users (full_name, email, phone_number, national_id, license_number, password, role) VALUES (?, ?, ?, ?, ?, ?, 'admin')");
    const info = stmt.run(full_name, email, phone_number, nationalId, licenseNumber, password);

    db.prepare("UPDATE user_invites SET status = 'used', used_at = CURRENT_TIMESTAMP WHERE id = ?").run(invite.id);

    res.json({
      id: info.lastInsertRowid,
      full_name,
      email,
      role: "admin",
      phone_number,
      national_id: nationalId,
      license_number: licenseNumber,
    });
  } catch (err: any) {
    if (typeof err?.message === "string") {
      if (err.message.includes("users.phone_number")) {
        return res.status(400).json({ error: "Phone number already registered." });
      }
      if (err.message.includes("users.email")) {
        return res.status(400).json({ error: "Email already registered." });
      }
    }
    res.status(400).json({ error: err.message || "Failed to complete admin registration." });
  }
});

app.get("/api/admin/profile-change-requests", (req, res) => {
  const rows = db.prepare(`
    SELECT
      r.*,
      u.full_name as current_full_name,
      u.national_id as current_national_id,
      u.license_number as current_license_number
    FROM profile_change_requests r
    JOIN users u ON u.id = r.user_id
    ORDER BY r.created_at DESC
  `).all();
  res.json(rows);
});

app.post("/api/admin/profile-change-requests/:id/status", (req, res) => {
  const { status, admin_note } = req.body;
  const requestRow = db.prepare("SELECT * FROM profile_change_requests WHERE id = ?").get(req.params.id) as any;
  if (!requestRow) {
    return res.status(404).json({ error: "Request not found." });
  }
  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  if (status === "approved") {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(requestRow.user_id) as any;
    const nextFullName = requestRow.requested_full_name || user.full_name;
    const nextNationalId = requestRow.requested_national_id || user.national_id;
    const nextLicenseNumber = requestRow.requested_license_number || user.license_number;
    try {
      db.prepare("UPDATE users SET full_name = ?, national_id = ?, license_number = ? WHERE id = ?").run(
        nextFullName,
        nextNationalId,
        nextLicenseNumber,
        requestRow.user_id
      );
    } catch (err: any) {
      return res.status(400).json({ error: err.message || "Failed to apply approved profile change." });
    }
  }

  db.prepare("UPDATE profile_change_requests SET status = ?, admin_note = ? WHERE id = ?").run(status, admin_note || null, req.params.id);
  res.json({ success: true });
});

app.get("/api/admin/license-requests", (req, res) => {
  const rows = db.prepare(`
    SELECT
      r.*,
      u.full_name,
      u.email,
      u.phone_number,
      u.national_id,
      u.license_number
    FROM license_requests r
    JOIN users u ON u.id = r.user_id
    ORDER BY r.created_at DESC
  `).all();
  res.json(rows);
});

app.post("/api/admin/license-requests/:id/status", (req, res) => {
  const { status, admin_note } = req.body;
  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }
  db.prepare("UPDATE license_requests SET status = ?, admin_note = ? WHERE id = ?").run(status, admin_note || null, req.params.id);
  res.json({ success: true });
});

app.put("/api/admin/users/:id", (req, res) => {
  const {
    full_name,
    email,
    phone_number,
    national_id,
    license_number,
    profile_note,
    plate_info,
    issue_date,
    expiry_date,
    license_status,
    license_document,
    plate_document,
  } = req.body;

  const current = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id) as any;
  if (!current) {
    return res.status(404).json({ error: "User not found." });
  }

  const nextFullName = full_name ?? current.full_name;
  const nextEmail = email ?? current.email;
  const nextPhone = phone_number ?? current.phone_number;
  const nextNationalId = national_id ?? current.national_id;
  const nextLicenseNumber = license_number ?? current.license_number;
  const nextProfileNote = profile_note ?? current.profile_note ?? "";
  const nextLicenseDocument = license_document ?? current.license_document ?? null;
  const nextPlateDocument = plate_document ?? current.plate_document ?? null;
  const previouslyHadNoLicense = !current.license_number;

  try {
    db.prepare(`
      UPDATE users
      SET
        full_name = ?,
        email = ?,
        phone_number = ?,
        national_id = ?,
        license_number = ?,
        profile_note = ?,
        license_document = ?,
        plate_document = ?
      WHERE id = ?
    `).run(
      nextFullName,
      nextEmail,
      nextPhone,
      nextNationalId,
      nextLicenseNumber,
      nextProfileNote,
      nextLicenseDocument,
      nextPlateDocument,
      req.params.id
    );

    if (nextLicenseNumber) {
      const currentLicense = db.prepare("SELECT * FROM licenses WHERE id = ?").get(nextLicenseNumber) as any;
      const today = new Date().toISOString().split("T")[0];
      const finalIssueDate = issue_date || currentLicense?.issue_date || today;
      const fourYearsFromIssue = new Date(finalIssueDate);
      fourYearsFromIssue.setFullYear(fourYearsFromIssue.getFullYear() + 4);
      const expectedExpiry = fourYearsFromIssue.toISOString().split("T")[0];
      const finalExpiryDate = expiry_date || expectedExpiry;

      if (finalExpiryDate !== expectedExpiry) {
        return res.status(400).json({
          error: `Expiry date must be exactly 4 years after issue date (${expectedExpiry}).`,
        });
      }
      const computedStatus = new Date(finalExpiryDate) < new Date() ? "expired" : "active";

      if (!currentLicense) {
        db.prepare(`
          INSERT INTO licenses (id, full_name, issue_date, expiry_date, plate_info, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          nextLicenseNumber,
          nextFullName,
          finalIssueDate,
          finalExpiryDate,
          plate_info || "",
          license_status || computedStatus
        );
      } else {
        db.prepare(`
          UPDATE licenses
          SET
            full_name = ?,
            issue_date = ?,
            expiry_date = ?,
            plate_info = COALESCE(?, plate_info),
            status = COALESCE(?, status)
          WHERE id = ?
        `).run(
          nextFullName,
          finalIssueDate,
          finalExpiryDate,
          plate_info ?? null,
          license_status ?? computedStatus,
          nextLicenseNumber
        );
      }

      if (previouslyHadNoLicense) {
        const latestPendingLicenseReq = db
          .prepare(
            "SELECT id FROM license_requests WHERE user_id = ? AND status = 'pending' ORDER BY id DESC LIMIT 1"
          )
          .get(req.params.id) as any;
        if (latestPendingLicenseReq) {
          db.prepare(
            "UPDATE license_requests SET status = 'approved', admin_note = COALESCE(admin_note, 'Approved after admin assigned license.') WHERE id = ?"
          ).run(latestPendingLicenseReq.id);
        }
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    if (typeof err?.message === "string") {
      if (err.message.includes("users.phone_number")) {
        return res.status(400).json({ error: "Phone number already registered." });
      }
      if (err.message.includes("users.national_id")) {
        return res.status(400).json({ error: "National ID already registered." });
      }
      if (err.message.includes("users.email")) {
        return res.status(400).json({ error: "Email already registered." });
      }
      if (err.message.includes("users.license_number")) {
        return res.status(400).json({ error: "License number already exists." });
      }
    }
    res.status(400).json({ error: err.message || "Failed to update user profile." });
  }
});

app.post("/api/admin/applications/:id/status", (req, res) => {
  const { status, expiry_date } = req.body;
  const appRow = db
    .prepare("SELECT * FROM applications WHERE id = ?")
    .get(req.params.id) as any;
  if (!appRow) {
    return res.status(404).json({ error: "Application not found." });
  }

  if (status === "approved" && expiry_date) {
    db.prepare("UPDATE applications SET status = ?, expiry_date = ? WHERE id = ?").run(
      status,
      expiry_date,
      req.params.id
    );

    // Keep license record in sync when admin approves an update request
    db.prepare(
      "UPDATE licenses SET expiry_date = ?, status = ? WHERE id = ?"
    ).run(
      expiry_date,
      new Date(expiry_date) < new Date() ? "expired" : "active",
      appRow.license_number
    );
  } else {
    db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(
      status,
      req.params.id
    );
  }

  res.json({ success: true });
});

app.post("/api/admin/orders/:id/status", (req, res) => {
  const { status } = req.body;
  const stmt = db.prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
  stmt.run(status, req.params.id);
  res.json({ success: true });
});

// File Upload
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({ filename: req.file.filename, originalName: req.file.originalname });
});

app.use((err: any, req: any, res: any, next: any) => {
  if (err && typeof err.message === "string" && err.message.includes("Only PDF and JPG files are allowed")) {
    return res.status(400).json({ error: "Only PDF and JPG files are allowed." });
  }
  next(err);
});

// Serve uploaded files
app.use("/uploads", express.static(uploadDir));

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`SMTP configured: ${smtpConfigured ? "yes" : "no"}`);
    if (!smtpConfigured) {
      console.log("Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM in .env");
    }
  });
}

if (!isVercel) {
  startServer();
}

export default app;
