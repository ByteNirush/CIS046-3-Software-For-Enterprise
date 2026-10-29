// Author: [my name] | External/AI code in this file: AI-assisted (Antigravity), reviewed and understood by me

export function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}

export default requireLogin;

