import  { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { signInFailure, signInSuccess } from "../redux/user/userSlice";






const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  

  const handleOtpSubmit = (event) => {
    event.preventDefault();
  
    if (!otp || otp.length !== 6 || isNaN(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
  
    setIsLoading(true);
    setError(null);
  
    axios
      .post(`/api/auth/signin/verify/${id}`, { id, otp })
      .then((response) => {
        if (response && response.status === 200) {
          dispatch(signInSuccess());
          setError(null);
          console.log('signin success');
          navigate("/profile");
          return;
          
        }
        if (response && response.data && response.data.message) {
          dispatch(signInFailure());
          setError(response.data.message);
        } else {
          dispatch(signInFailure());
          setError("Invalid OTP. Please try again.");
        }
      })
      .catch((error) => {
        dispatch(signInFailure());
        console.error("Error verifying OTP:", error);
        if (error.response && error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError("Something went wrong.");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
      <h2>Verify OTP</h2>
      <form onSubmit={handleOtpSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="otp" style={{ display: "block", marginBottom: "10px" }}>
            Enter the OTP sent to your email:
          </label>
          <input
            type="text"
            id="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            maxLength="6"
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
          />
        </div>
        {error && <p style={{ color: "red", marginBottom: "20px" }}>{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "16px",
            backgroundColor: isLoading ? "#ccc" : "#007BFF",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
};

export default VerifyOtp;

