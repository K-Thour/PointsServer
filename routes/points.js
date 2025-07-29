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
    const dateQuery = req.query.date;

    // --- Validate tasks structure ---
    if (!tasks || typeof tasks !== 'object') {
      return res.status(400).json({ msg: 'Tasks must be provided as an object' });
    }

    const requiredTasks = [
      "exercise",
      "eatHealthy",
      "meditation",
      "reading",
      "learning",
      "noSocialMedia",
      "noFap",
      "noBinge",
    ];

    for (const task of requiredTasks) {
      if (!(task in tasks)) {
        return res.status(400).json({ msg: `Missing task: ${task}` });
      }
    }

    // --- Validate reasons ---
    for (const task of requiredTasks) {
      const done = tasks[task];
      const reason = reasons?.[task];
      if (done === false) {
        if (!reason || reason.trim() === '') {
          return res.status(400).json({ msg: `Reason is required for not completing "${task}"` });
        }
      }
    }

    // --- Parse & normalize target date ---
    let targetDate = new Date();
    if (dateQuery) {
      const parsedDate = new Date(dateQuery);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ msg: 'Invalid date format' });
      }
      targetDate = parsedDate;
    }
    targetDate.setHours(0, 0, 0, 0); // Normalize to 00:00

    // --- Prevent double submission ---
    const already = await Point.findOne({
      userId: req.user,
      date: targetDate,
    });

    if (already) {
      return res.status(400).json({ msg: 'Points for this date already submitted' });
    }

    // --- Save to DB ---
    const total = Object.values(tasks).filter(Boolean).length;

    const point = new Point({
      userId: req.user,
      date: targetDate,
      tasks,
      totalPoints: total,
      reasons,
    });

    await point.save();
    return res.status(201).json(point);

  } catch (err) {
    console.error("Error in POST /points:", err.message);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

// ✅ GET /api/points/today – Get today’s points
router.get('/by-date', auth, async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ msg: 'Query parameter "date" is required in YYYY-MM-DD format.' });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ msg: 'Invalid date format. Expected format: YYYY-MM-DD' });
    }

    parsedDate.setHours(0, 0, 0, 0); // Normalize to midnight

    const point = await Point.findOne({
      userId: req.user,
      date: parsedDate,
    });

    if (!point) {
      return res.status(404).json({ msg: `No points found for ${parsedDate.toDateString()}` });
    }

    return res.json(point);

  } catch (err) {
    console.error('Error in GET /points/by-date:', err.message);
    return res.status(500).json({ msg: 'Server Error' });
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

// Get overall points summary for the logged-in user
router.get('/overall', auth, async (req, res) => {
  try {
    const userId = req.user;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const points = await Point.find({
      userId,
      date: { $gte: startOfMonth },
    }).sort({ date: 1 }); // optional: sort chronologically

    const dailyPoints = points.map(p => ({
      date: p.date,
      totalPoints: p.totalPoints || 0,
    }));

    const monthlyTotal = dailyPoints.reduce((sum, entry) => sum + entry.totalPoints, 0);

    res.json({
      monthlyTotal,
      dailyPoints,
    });
  } catch (error) {
    console.error('Error fetching overall points:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;