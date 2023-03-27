import { sign } from 'jsonwebtoken'

export default (userId: number) =>
  sign(
    { userId }, // payload
    process.env.JWT_SECRET, // secret key
    { expiresIn: '1d' } // options, e.g., expiration time
  )
