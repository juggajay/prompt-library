import { SignupForm } from '../components/auth/SignupForm';

export function Signup() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <SignupForm />
      </div>
    </div>
  );
}
