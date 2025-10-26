// Bcrypt with fallback to bcryptjs for compatibility
let bcryptImpl: any;

try {
  // Try to use native bcrypt first
  bcryptImpl = require('bcrypt');
} catch (error) {
  console.warn('Native bcrypt not available, falling back to bcryptjs');
  // Fall back to pure JavaScript implementation
  bcryptImpl = require('bcryptjs');
}

export const hash = bcryptImpl.hash;
export const compare = bcryptImpl.compare;
export const hashSync = bcryptImpl.hashSync;
export const compareSync = bcryptImpl.compareSync;

export default bcryptImpl;