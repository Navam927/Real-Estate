import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { signInSuccess, signInFailure } from "../redux/user/userSlice";
import { BACKEND_URL } from "../constants/url";

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const url = BACKEND_URL + "/api/auth";
  const { id } = useParams(); // Get user ID from the URL
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
  };

  const handleVerify = async () => {
    if (!otp || otp.length !== 6 || isNaN(otp)) {
      dispatch(signInFailure());
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // console.log(id);
      const response = await axios.post(
        `${url}/verifyLoginOtp/${id}`,
        { otp },
        {
          withCredentials: true,
        }
      );

      const data = response.data;
      // console.log('data : ', data);
      if (data.success) {
        dispatch(signInSuccess(data.data));
        navigate("/profile");
      } else {
        dispatch(signInFailure());
        setError(response.data.message || "Failed to verify OTP.");
      }
    } catch (err) {
      dispatch(signInFailure());
      console.log(err);
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Verify OTP</h2>
      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={handleOtpChange}
        style={styles.input}
        maxLength={6}
      />
      <button onClick={handleVerify} style={styles.button} disabled={isLoading}>
        {isLoading ? "Verifying..." : "Verify"}
      </button>
      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>{success}</p>}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "400px",
    margin: "0 auto",
    padding: "20px",
    textAlign: "center",
    border: "1px solid #ddd",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
    fontSize: "16px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    borderRadius: "5px",
    border: "none",
    backgroundColor: "#007bff",
    color: "#fff",
    cursor: "pointer",
    width: "100%",
  },
  error: {
    color: "red",
    marginTop: "10px",
  },
  success: {
    color: "green",
    marginTop: "10px",
  },
};

export default VerifyOtpPage;
