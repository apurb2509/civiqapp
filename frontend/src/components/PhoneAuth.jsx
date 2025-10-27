import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

function PhoneAuth() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Ensure phone is in E.164 format (e.g., +919876543210)
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    if (error) {
      alert(error.message);
    } else {
      alert('OTP has been sent to your phone!');
      setOtpSent(true);
    }
    setLoading(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    });

    if (error) {
      alert(error.message);
    } else {
      // Success! AuthContext will detect the new session
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="w-full">
      {!otpSent ? (
        // STAGE 1: Enter Phone Number
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
              Phone Number (with country code)
            </label>
            <input
              id="phone"
              type="tel"
              className="w-full p-3 mt-1 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="+919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-md disabled:bg-gray-500"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        // STAGE 2: Enter OTP
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-300">
              Enter OTP
            </label>
            <input
              id="otp"
              type="text"
              className="w-full p-3 mt-1 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-md disabled:bg-gray-500"
          >
            {loading ? 'Verifying...' : 'Login / Sign Up'}
          </button>
          <button
            type="button"
            onClick={() => setOtpSent(false)}
            className="w-full text-sm text-gray-400 hover:text-white"
          >
            Wrong number? Go back.
          </button>
        </form>
      )}
    </div>
  );
}

export default PhoneAuth;