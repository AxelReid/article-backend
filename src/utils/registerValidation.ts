import { UserRegisterInput } from '../dto/UserRegisterInput'

export const registerValidation = ({
  username,
  email,
  password,
}: UserRegisterInput) => {
  if (username.length <= 3)
    return [{ field: 'username', message: 'length must be grater than 2' }]
  if (!/^\S+@\S+$/.test(email))
    return [{ field: 'email', message: 'Enter a valid email' }]
  if (password.length <= 3)
    return [{ field: 'password', message: 'length must be grater than 3' }]
  return null
}
