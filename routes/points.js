const express = require('express');
const router = express.Router();
const auth = require('../Middleware/auth');
const Point = require('../models/Point');

// ✅ POST /api/points – Submit today's points
const requiredTasks = [
  "exercise",
  "eatHealthy",
  "meditation",
  "reading",
  "learning",
  "noSocialMedia",
  "noFap",
  "noBinge"
];

router.post('/', auth, async (req, res) => {
  try {
    const { tasks, reasons } = req.body;

    // Check tasks object exists and is valid
    if (!tasks || typeof tasks !== 'object') {
      return res.status(400).json({ msg: 'Tasks must be provided as an object' });
    }

    // Check all required tasks are present
    for (const task of requiredTasks) {
      if (!(task in tasks)) {
        return res.status(400).json({ msg: `Missing task: ${task}` });
      }
    }

    // Check reasons if task is false
    for (const task of requiredTasks) {
      const done = tasks[task];
      const reason = reasons?.[task];

      if (done === false) {
        if (!reason || reason.trim() === '') {
          return res.status(400).json({ msg: `Reason is required for not completing "${task}"` });
        }
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const total = Object.values(tasks).filter(Boolean).length;

    let existing = await Point.findOne({ userId: req.user, date: today });
    if (existing) {
      return res.status(400).json({ msg: 'Points for today already submitted' });
    }

    const point = new Point({
      userId: req.user,
      date: today,
      tasks,
      totalPoints: total,
      reasons
    });

    await point.save();
    res.json(point);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// ✅ GET /api/points/today – Get today’s points
router.get('/today', auth, async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const point = await Point.findOne({ userId: req.user, date: today });
    if (!point) return res.status(404).json({ msg: 'No points found for today' });

    res.json(point);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ✅ GET /api/points – Get all points
router.get('/', auth, async (req, res) => {
  try {
    const points = await Point.find({ userId: req.user }).sort({ date: -1 });
    res.json(points);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;