// Author: [my name] | External/AI code in this file: AI-assisted (Antigravity), reviewed and understood by me

import { createPuzzle, checkAnswer } from '../services/puzzleService.js';

export async function createNewPuzzle(req, res, next) {
  try {
    const userId = req.session.userId || req.session.user?.id;
    const puzzle = await createPuzzle(userId);
    return res.status(201).json(puzzle);
  } catch (err) {
    return next(err);
  }
}

export function submitGuess(req, res, next) {
  try {
    const userId = req.session.userId || req.session.user?.id;
    const puzzleId = req.params.id;
    const { guess } = req.body || {};

    // Validate that guess is a string of exactly one digit 0 to 9
    if (typeof guess !== 'string' || !/^[0-9]$/.test(guess)) {
      return res.status(400).json({ error: 'Guess must be a single digit between 0 and 9' });
    }

    const result = checkAnswer(userId, puzzleId, guess);

    if (result.status === 'not_found') {
      return res.status(404).json({ error: 'Puzzle not found' });
    }

    if (result.status === 'not_active') {
      return res.status(409).json({ error: 'Puzzle is no longer active' });
    }

    if (result.status === 'expired') {
      return res.status(410).json({ error: 'Puzzle expired' });
    }

    // Return 200 with either correct: true, attemptsLeft remaining, or failed: true
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export default {
  createNewPuzzle,
  submitGuess,
};

