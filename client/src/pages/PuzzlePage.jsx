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

  const isSolved = result?.correct === true;
  const isFailed = result?.failed === true || result?.attemptsLeft === 0;
  const isDisabled = loading || submitting || isSolved || isFailed || isExpired;

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>Banana Puzzle Gate</h2>

      {loading && <p>Loading puzzle...</p>}

      {isServiceUnavailable ? (
        <div style={{ padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
          <p>{error || 'Puzzle service is unavailable, please try again shortly'}</p>
          <button type="button" onClick={loadPuzzle} disabled={loading} style={{ padding: '0.5rem 1rem' }}>
            Try again
          </button>
        </div>
      ) : (
        <>
          {error && !isServiceUnavailable && (
            <div style={{ margin: '1rem 0', color: '#d32f2f', fontWeight: 'bold' }}>
              {error}
            </div>
          )}

          {puzzle && (
            <div>
              <div style={{ margin: '1rem 0' }}>
                <img
                  src={`data:image/png;base64,${puzzle.image}`}
                  alt="Banana Puzzle"
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              {/* Credit line */}
              <p style={{ fontSize: '0.85rem', color: '#666', margin: '0.5rem 0 1rem' }}>
                Puzzles from the Banana API by Marc Conrad
              </p>

              {/* Status and countdown info */}
              {!isSolved && !isFailed && !isExpired && (
                <div style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
                  Time remaining: {timeLeft}s
                </div>
              )}

              {/* Wrong answer attempt count */}
              {result && !result.correct && !result.failed && !isExpired && (
                <div style={{ color: '#e65100', marginBottom: '1rem' }}>
                  Wrong answer! Attempts left: {result.attemptsLeft}
                </div>
              )}

              {/* Solved state */}
              {isSolved && (
                <div style={{ margin: '1.5rem 0' }}>
                  <p style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '1rem' }}>
                    🎉 Puzzle solved! You unlocked an arcade play!
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link
                      to="/game"
                      style={{
                        display: 'inline-block',
                        padding: '0.6rem 1.6rem',
                        backgroundColor: '#4caf50',
                        color: '#fff',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      🎮 Play Game
                    </Link>
                    <button
                      type="button"
                      onClick={loadPuzzle}
                      disabled={loading}
                      style={{
                        padding: '0.6rem 1.6rem',
                        backgroundColor: '#f5f5f5',
                        color: '#333',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        cursor: loading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Solve another puzzle
                    </button>
                  </div>
                </div>
              )}

              {/* Failed state */}
              {isFailed && (
                <div style={{ margin: '1.5rem 0', color: '#c62828' }}>
                  <p style={{ fontWeight: 'bold' }}>No attempts left.</p>
                  <button type="button" onClick={loadPuzzle} disabled={loading} style={{ padding: '0.5rem 1rem' }}>
                    New puzzle
                  </button>
                </div>
              )}

              {/* Expired state */}
              {isExpired && !isSolved && !isFailed && (
                <div style={{ margin: '1.5rem 0', color: '#c62828' }}>
                  <p style={{ fontWeight: 'bold' }}>Puzzle expired.</p>
                  <button type="button" onClick={loadPuzzle} disabled={loading} style={{ padding: '0.5rem 1rem' }}>
                    New puzzle
                  </button>
                </div>
              )}

              {/* Form input and submission with selectable number pad */}
              {!isSolved && !isFailed && !isExpired && (
                <form onSubmit={handleSubmit} style={{ marginTop: '1.25rem' }}>
                  {/* Number selection buttons (0-9) */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ marginBottom: '0.5rem', fontSize: '0.95rem', color: '#555', fontWeight: 'bold' }}>
                      Select your answer:
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        gap: '0.4rem',
                        maxWidth: '480px',
                        margin: '0 auto',
                      }}
                      role="group"
                      aria-label="Select answer number 0 to 9"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                        const numStr = String(num);
                        const isSelected = guess === numStr;
                        return (
                          <button
                            key={num}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => handleSelectNumber(numStr)}
                            style={{
                              width: '42px',
                              height: '42px',
                              fontSize: '1.2rem',
                              fontWeight: isSelected ? 'bold' : '600',
                              borderRadius: '6px',
                              border: isSelected ? '2px solid #e0a800' : '1px solid #ccc',
                              backgroundColor: isSelected ? '#ffc107' : '#f8f9fa',
                              color: isSelected ? '#000' : '#333',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              boxShadow: isSelected ? '0 2px 6px rgba(224, 168, 0, 0.4)' : 'none',
                              transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                              transition: 'all 0.15s ease',
                            }}
                            aria-pressed={isSelected}
                            title={`Select ${num}${isSelected ? ' (click again to submit)' : ''}`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Input display and action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <label htmlFor="guess-input" style={{ marginRight: '0.25rem' }}>
                      Your answer (0-9):
                    </label>
                    <input
                      id="guess-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={guess}
                      onChange={(e) => setGuess(e.target.value.replace(/\D/g, ''))}
                      disabled={isDisabled}
                      placeholder="-"
                      style={{
                        width: '3rem',
                        textAlign: 'center',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        padding: '0.25rem',
                        marginRight: '0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                      }}
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isDisabled || !guess}
                      style={{
                        padding: '0.45rem 1.25rem',
                        marginRight: '0.5rem',
                        backgroundColor: isDisabled || !guess ? '#e0e0e0' : '#e0a800',
                        color: isDisabled || !guess ? '#888' : '#000',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: isDisabled || !guess ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                    <button
                      type="button"
                      onClick={loadPuzzle}
                      disabled={loading || submitting}
                      style={{
                        padding: '0.45rem 1rem',
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: loading || submitting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      New puzzle
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
