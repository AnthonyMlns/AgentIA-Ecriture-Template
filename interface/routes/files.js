// ─── Routes d'import de fichiers ──────────────────────────────────────────

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../auth');

// ─── Configuration multer ─────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Déterminer le dossier de destination selon la catégorie
    const category = req.body.category || 'echantillons';
    const allowed = ['echantillons', 'idees', 'ressources'];
    const safeCategory = allowed.includes(category) ? category : 'echantillons';

    const dest = path.join(auth.userDir(req.user.id), safeCategory);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Garder le nom original mais éviter les collisions
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 80);
    const timestamp = Date.now();
    cb(null, `${base}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (req, file, cb) => {
    // S7 : .svg retiré — un SVG peut contenir du <script> et serait servi
    // inline par /view → XSS stocké.
    const allowed = ['.md', '.txt', '.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.json', '.yaml', '.yml'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error(`Format non supporté : ${ext}. Formats autorisés : ${allowed.join(', ')}`));
  }
});

// ─── POST /api/files/upload ───────────────────────────────────────────────
// Multipart: file + category (echantillons|idees|ressources)
router.post('/upload', auth.authMiddleware, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Erreur d'upload : ${err.message}` });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni.' });
    }

    // Traitement : si c'est un fichier texte, ajouter un en-tête d'échantillon
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (['.md', '.txt'].includes(ext)) {
      try {
        const header = `---
type: echantillon-utilisateur
importe_le: ${new Date().toISOString()}
---

`;
        const content = fs.readFileSync(req.file.path, 'utf-8');
        if (!content.startsWith('---')) {
          fs.writeFileSync(req.file.path, header + content, 'utf-8');
        }
      } catch (e) {
        console.error(`[upload] Erreur traitement ${req.file.filename}: ${e.message}`);
      }
    }

    res.json({
      success: true,
      file: {
        originalName: req.file.originalname,
        storedName: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        category: req.body.category || 'echantillons'
      }
    });
  });
});

// ─── GET /api/files/list ──────────────────────────────────────────────────
// Query: category (optionnel)
router.get('/list', auth.authMiddleware, (req, res) => {
  const category = req.query.category; // optionnel
  const userBase = auth.userDir(req.user.id);
  const categories = category ? [category] : ['echantillons', 'idees', 'ressources'];
  const results = [];

  for (const cat of categories) {
    const dir = path.join(userBase, cat);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir, { withFileTypes: true })
        .filter(f => f.isFile() && !f.name.startsWith('.'))
        .map(f => {
          const fp = path.join(dir, f.name);
          const stat = fs.statSync(fp);
          return {
            name: f.name,
            category: cat,
            size: stat.size,
            modifiedAt: stat.mtimeMs,
            path: `${cat}/${f.name}`
          };
        });
      results.push(...files);
    }
  }

  res.json(results.sort((a, b) => b.modifiedAt - a.modifiedAt));
});

// ─── GET /api/files/view/:category/:filename ──────────────────────────────
router.get('/view/:category/:filename', auth.authMiddleware, (req, res) => {
  const { category, filename } = req.params;
  const allowed = ['echantillons', 'idees', 'ressources'];
  if (!allowed.includes(category)) {
    return res.status(400).json({ error: 'Catégorie invalide.' });
  }
  // Sécurité : empêcher le path traversal
  const safeName = path.basename(filename);
  const filePath = path.join(auth.userDir(req.user.id), category, safeName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier introuvable.' });
  }
  const ext = path.extname(safeName).toLowerCase();
  const textExts = ['.md', '.txt', '.json', '.yaml', '.yml'];
  if (textExts.includes(ext)) {
    res.json({ content: fs.readFileSync(filePath, 'utf-8'), type: 'text' });
  } else {
    // S7 : empêcher le navigateur de "sniffer" un type HTML/script depuis un
    // fichier binaire servi inline.
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(filePath);
  }
});

// ─── DELETE /api/files/delete/:category/:filename ─────────────────────────
router.delete('/delete/:category/:filename', auth.authMiddleware, (req, res) => {
  const { category, filename } = req.params;
  const allowed = ['echantillons', 'idees', 'ressources'];
  if (!allowed.includes(category)) {
    return res.status(400).json({ error: 'Catégorie invalide.' });
  }
  const safeName = path.basename(filename);
  const filePath = path.join(auth.userDir(req.user.id), category, safeName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier introuvable.' });
  }
  fs.unlinkSync(filePath);
  res.json({ success: true });
});

module.exports = router;
