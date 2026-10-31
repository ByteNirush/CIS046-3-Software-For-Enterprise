import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { newPuzzle, submitAnswer } from '../api/puzzle.js';

function PuzzlePage() {
  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isServiceUnavailable, setIsServiceUnavailable] = useState(false);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Guard against React StrictMode double invocation in development
  const fetchedRef = useRef(false);

  const loadPuzzle = async () => {
    setLoading(true);
    setError(null);
    setIsServiceUnavailable(false);
    setResult(null);
    setIsExpired(false);
    setGuess('');

    try {
      const data = await newPuzzle();
      setPuzzle(data);
    } catch (err) {
      if (err.status === 502) {
        setIsServiceUnavailable(true);
      }
      setError(err.message || 'Puzzle service is unavailable, please try again shortly');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    loadPuzzle();
  }, []);

  // Display-only countdown timer based on server-provided expiresAt
  useEffect(() => {
    if (!puzzle?.expiresAt || result?.correct || result?.failed || isExpired) {
      return;
    }

    const expiryTime = new Date(puzzle.expiresAt).getTime();

    const checkTime = () => {
      const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setIsExpired(true);
      }
    };

    checkTime();
    const intervalId = setInterval(checkTime, 1000);
    return () => clearInterval(intervalId);
  }, [puzzle, result, isExpired]);

  const isSolved = result?.correct === true;
  const isFailed = result?.failed === true || result?.attemptsLeft === 0;
  const isDisabled = loading || submitting || isSolved || isFailed || isExpired;

  const doSubmit = async (valueToSubmit) => {
    const val = valueToSubmit !== undefined ? valueToSubmit : guess;
    if (!puzzle?.id || !/^[0-9]$/.test(val) || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await submitAnswer(puzzle.id, val);
      setResult(res);
      setGuess('');
    } catch (err) {
      if (err.status === 410) {
        setIsExpired(true);
        setError('Puzzle expired');
      } else if (err.status === 409) {
        setError(err.message || 'Puzzle is no longer active');
      } else if (err.status === 502) {
        setIsServiceUnavailable(true);
        setError(err.message || 'Puzzle service is unavailable, please try again shortly');
      } else {
        setError(err.message || 'Failed to submit guess');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    doSubmit(guess);
  };

  const handleSelectNumber = (numStr) => {
    if (isDisabled) return;
    if (guess === numStr) {
      // If user clicks the already selected number, submit it directly
      doSubmit(numStr);
    } else {
      setGuess(numStr);
    }
  };

  // Keyboard shortcut listener: allows typing 0-9 directly without focusing input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isDisabled) return;

      // Check if user pressed 0-9
      if (/^[0-9]$/.test(e.key)) {
        setGuess(e.key);
      } else if (e.key === 'Enter' && guess) {
        e.preventDefault();
        doSubmit(guess);
      } else if (e.key === 'Backspace' || e.key === 'Escape') {
        setGuess('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDisabled, guess]);

  // Determine attempts left count for visual dots
  const attemptsRemaining = result && typeof result.attemptsLeft === 'number' ? result.attemptsLeft : 3;

  return (
    <div className="puzzle-container">
      <div className="puzzle-header">
        <div className="badge badge-amber" style={{ marginBottom: '0.5rem' }}>
          <span>🧩</span>
          <span>Access Challenge</span>
        </div>
        <h1>Banana Puzzle Gate</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
          Solve the arithmetic riddle to identify the missing digit and unlock an arcade token.
        </p>
      </div>

      {loading && !puzzle && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }} aria-hidden="true">🍌</div>
          <p style={{ color: 'var(--text-muted)' }}>Generating fresh banana puzzle...</p>
        </div>
      )}

      {isServiceUnavailable ? (
        <div className="alert alert-error" style={{ display: 'block', textAlign: 'center', padding: '1.5rem' }}>
          <p style={{ fontWeight: 600, marginBottom: '1rem' }}>
            {error || 'Puzzle service is unavailable, please try again shortly'}
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadPuzzle}
            disabled={loading}
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {error && !isServiceUnavailable && (
            <div className="alert alert-error" role="alert">
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          {puzzle && (
            <div className="card card-elevated">
              {/* Meta information bar: Timer & Attempts */}
              {!isSolved && !isFailed && !isExpired && (
                <div className="puzzle-meta-bar">
                  <div
                    className={`timer-badge tabular-nums ${
                      timeLeft <= 5 ? 'critical' : timeLeft <= 15 ? 'warning' : 'normal'
                    }`}
                    title="Time remaining to solve this puzzle"
                  >
                    <span>⏱️</span>
                    <span>{timeLeft}s left</span>
                  </div>

                  <div className="attempts-tracker" title={`${attemptsRemaining} of 3 attempts remaining`}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
                      Attempts:
                    </span>
                    <span className={`attempt-dot ${attemptsRemaining < 1 ? 'lost' : ''}`} />
                    <span className={`attempt-dot ${attemptsRemaining < 2 ? 'lost' : ''}`} />
                    <span className={`attempt-dot ${attemptsRemaining < 3 ? 'lost' : ''}`} />
                  </div>
                </div>
              )}

              {/* Puzzle Image Frame */}
              <div className="puzzle-frame">
                <img
                  src={`data:image/png;base64,${puzzle.image}`}
                  alt="Banana Math Equation Puzzle - calculate the missing digit"
                  className="puzzle-image"
                />
              </div>

              <div className="puzzle-credit">
                Puzzles from the Banana API by Marc Conrad
              </div>

              {/* Wrong guess notice */}
              {result && !result.correct && !result.failed && !isExpired && (
                <div className="alert alert-warning" style={{ justifyContent: 'center' }}>
                  <span>Incorrect answer.</span>
                  <strong>{result.attemptsLeft} {result.attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining!</strong>
                </div>
              )}

              {/* Solved state */}
              {isSolved && (
                <div className="state-banner state-banner-success">
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
                  <h3 className="state-banner-title" style={{ color: 'var(--success-text)' }}>
                    Puzzle Solved!
                  </h3>
                  <p style={{ color: 'var(--success-text)', marginBottom: '1.25rem' }}>
                    You earned <strong>1 Arcade Play Token</strong>! Ready to catch some bananas?
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/game" className="btn btn-success btn-lg">
                      <span>🎮</span> Play Banana Catch
                    </Link>
                    <button
                      type="button"
                      className="btn btn-secondary btn-lg"
                      onClick={loadPuzzle}
                      disabled={loading}
                    >
                      Solve Another Puzzle
                    </button>
                  </div>
                </div>
              )}

              {/* Failed state */}
              {isFailed && (
                <div className="state-banner state-banner-failed">
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>❌</div>
                  <h3 className="state-banner-title" style={{ color: 'var(--danger-text)' }}>
                    Out of Attempts
                  </h3>
                  <p style={{ color: 'var(--danger-text)', marginBottom: '1.25rem' }}>
                    Don't worry, you can draw a fresh puzzle and try again immediately.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={loadPuzzle}
                    disabled={loading}
                  >
                    Draw New Puzzle
                  </button>
                </div>
              )}

              {/* Expired state */}
              {isExpired && !isSolved && !isFailed && (
                <div className="state-banner state-banner-failed">
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⌛</div>
                  <h3 className="state-banner-title" style={{ color: 'var(--danger-text)' }}>
                    Time Expired
                  </h3>
                  <p style={{ color: 'var(--danger-text)', marginBottom: '1.25rem' }}>
                    The timer ran out for this puzzle session.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={loadPuzzle}
                    disabled={loading}
                  >
                    Draw New Puzzle
                  </button>
                </div>
              )}

              {/* Interactive Keypad & Form (Active play state) */}
              {!isSolved && !isFailed && !isExpired && (
                <form onSubmit={handleSubmit} className="numpad-container">
                  <div className="numpad-label">
                    Select your answer (0–9) or press a number key:
                  </div>

                  <div className="numpad-grid" role="group" aria-label="Select answer digit 0 to 9">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                      const numStr = String(num);
                      const isSelected = guess === numStr;
                      return (
                        <button
                          key={num}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleSelectNumber(numStr)}
                          className={`numpad-key ${isSelected ? 'selected' : ''}`}
                          aria-pressed={isSelected}
                          aria-label={`Digit ${num}`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>

                  <div className="puzzle-actions-bar">
                    <div className="guess-display-badge">
                      <label htmlFor="guess-input" className="guess-display-label">
                        Guess:
                      </label>
                      <input
                        id="guess-input"
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={guess}
                        onChange={(e) => setGuess(e.target.value.replace(/\D/g, ''))}
                        disabled={isDisabled}
                        placeholder="—"
                        className="guess-display-input"
                        aria-label="Selected answer digit"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isDisabled || !guess}
                      className="btn btn-primary"
                      style={{ minWidth: '135px' }}
                    >
                      {submitting ? 'Checking...' : guess ? `Submit (${guess}) →` : 'Submit Guess'}
                    </button>

                    <button
                      type="button"
                      onClick={loadPuzzle}
                      disabled={loading || submitting}
                      className="btn btn-outline"
                      title="Skip this puzzle and load a new one"
                    >
                      Skip / New
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PuzzlePage;
