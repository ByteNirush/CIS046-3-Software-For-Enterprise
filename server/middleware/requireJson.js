// Author: [my name] | External/AI code in this file: AI-assisted (Antigravity), reviewed and understood by me

export function requireJson(req, res, next) {
  if (!req.is('application/json')) {
    return res.status(415).json({ error: 'Unsupported Media Type: application/json required' });
  }
  next();
}

export default requireJson;

