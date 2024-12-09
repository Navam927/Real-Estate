import { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

function VerifyOtpPage() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { id } = useParams(); // Get user ID from the URL
  const navigate = useNavigate();

  const handleVerify = async () => {
    try {
      const response = await axios.post(`/api/auth/verify/${id}`, {otp });
      if (response.data.success) {
        setSuccess('2FA enabled successfully!');
        setTimeout(() => navigate('/profile'), 2000); // Redirect to profile page
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error verifying OTP');
    }
  };

  return (
    <div>
      <h2>Verify OTP</h2>
      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />
      <button onClick={handleVerify}>Verify</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
}

export default VerifyOtpPage;
