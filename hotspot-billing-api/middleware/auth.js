import jwt from 'jsonwebtoken';

function authenticateToken(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
}

export default function auth(req, res, next) {
  // Check if user is authenticated
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

export { authenticateToken };