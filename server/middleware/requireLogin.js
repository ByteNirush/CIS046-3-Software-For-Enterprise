// Author: [my name] | External/AI code in this file: AI-assisted (Antigravity), reviewed and understood by me

export function requireLogin(req, res, next) {
  if (!req.session || (!req.session.userId && !req.session.user?.id)) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  // Ensure req.session.userId is available for downstream code and rateLimiters
  if (!req.session.userId && req.session.user?.id) {
    req.session.userId = req.session.user.id;
  }

  next();
}

export default requireLogin;
