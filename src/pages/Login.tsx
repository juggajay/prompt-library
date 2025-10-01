import { LoginForm } from '../components/auth/LoginForm';

export function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <LoginForm />
      </div>
    </div>
  );
}
