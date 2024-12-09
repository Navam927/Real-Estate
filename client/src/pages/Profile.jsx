import { useSelector } from 'react-redux';
import { useRef, useState, useEffect } from 'react';
import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  signOutUserStart,
  signOutUserSuccess,
  signOutUserFailure,
  fetchUserStart,
  fetchUserSuccess,
  fetchUserFailure,
  toggle2faStart,
  toggle2faFailure,
  toggle2faSuccess
} from '../redux/user/userSlice';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { current } from '@reduxjs/toolkit';


//import { current } from '@reduxjs/toolkit';
export default function Profile() {
  const fileRef = useRef(null);
  const { currentUser, loading, error } = useSelector((state) => state.user);
  const [file, setFile] = useState(undefined);
  const [filePerc, setFilePerc] = useState(0);
  const [fileUploadError, setFileUploadError] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showListingsError, setShowListingsError] = useState(false);
  const [userListings, setUserListings] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (file) {
      handleFileUpload(file);
    }
  }, [file]);

  useEffect(() => {
    async function fetchData() {
      try {
        dispatch(fetchUserStart());
        const response = await axios.get(`http://localhost:3000/api/user/${currentUser._id}`);
        dispatch(fetchUserSuccess(response.data));
      } catch (error) {
        dispatch(fetchUserFailure(error.message));
      }
    }
  })


const handleButtonClick = async () => {
  console.log('handle button clicked');
  console.log(currentUser.twoFAEnabled);
  if (currentUser === null || currentUser._id === undefined) {
    console.error('currentUser is null or undefined');
    return;
  }
  
  const result = await axios.get(`http://localhost:3000/api/user/status/${currentUser._id}`);
  console.log(result);

  if (!result) {
    if (window.confirm('Are you sure you want to disable 2FA?')) {
      axios
        .post(`http:localhost:3000/api/auth/disable2fa/${currentUser._id}`)
        .then((response) => {
          if (response.data.success) {
            dispatch(updateUserSuccess(response.data.user));
          } else {
            console.error('Failed to disable 2FA');
          }
        })
        .catch((error) => {
          console.error('Error disabling 2FA:', error);
        });
    }
  } else {
    console.log('enabling 2FA');
    if (window.confirm('Are you sure you want to enable 2FA?')) {
      try {
        dispatch(toggle2faStart());
        const response = await axios.post(`/api/auth/enable2fa/${currentUser._id}`);
        if (response.data.success) {
          
          console.log('Response received:', response.data);
          navigate(`/verify-otp/${response.data.user._id}`);
        } else {
          dispatch(toggle2faFailure(response.data.message));
          console.error('Failed to enable 2FA:', response.data.message);
        }
      } catch (error) {
        dispatch(toggle2faFailure());
        console.error('Error enabling 2FA:', error.response?.data?.message || error.message);
      }
    }
    
  }
}

const handleFileUpload = (file) => {
  const CLOUD_NAME = "dy4lefnyu";
  const UPLOAD_PRESET = "Real-Estate";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  axios
    .post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, formData, {
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded / progressEvent.total) * 100
        );
        setFilePerc(progress);
      },
    })
    .then((response) => {
      const downloadURL = response.data.secure_url;
      setFormData({ ...formData, avatar: downloadURL });
    })
    .catch((error) => {
      setFileUploadError(true);
      console.error("Error uploading file:", error);
    });
};


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(updateUserStart());
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(updateUserFailure(data.message));
        return;
      }

      dispatch(updateUserSuccess(data));
      setUpdateSuccess(true);
    } catch (error) {
      dispatch(updateUserFailure(error.message));
    }
  };

  const handleDeleteUser = async () => {
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
    }
  };

  const handleSignout = async () => {
    console.log('signoutUser started');
    try {
      dispatch(signOutUserStart());
      console.log('action dispatched');
      const res = await fetch('/api/auth/signout');
      console.log('route fetched');
      const data = await res.json();
      if (data.success === false) {
        console.error('data fetch failure');
        dispatch(signOutUserFailure(data.message));
        return;
      } else {
        console.log('data fetched successfully');
      }
      
      dispatch(signOutUserSuccess());
      console.log('action dispatched and user signed out');
    } catch (error) {
      dispatch(signOutUserFailure(error.message));
    }
  }

  const handleShowListings = async () => {
    try {
      console.log('handle show listings called')
      setShowListingsError(false);
      const res = await fetch(`/api/user/listings/${currentUser._id}`);
      const data = await res.json();
      if (data.success === false) {
        setShowListingsError(true);
        return;
      } else {
        console.log('data fetched successfully');
      }
      console.log(data)
      setUserListings(data);
    } catch (error) {
      setShowListingsError(true);
    }
  };

  const handleListingDelete = async (listingId) => {
    try {
      const res = await fetch(`/api/listing/delete/${listingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success === false) {
        console.log(data.message);
        return;
      }

      setUserListings((prev) =>
        prev.filter((listing) => listing._id !== listingId)
      );
    } catch (error) {
      console.log(error.message);
    }
  };

  

  return (
    <div className='p-3 max-w-lg mx-auto'>
      <h1 className='text-3xl font-semibold text-center my-7'>Profile</h1>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input
          onChange={(e) => setFile(e.target.files[0])}
          type='file'
          ref={fileRef}
          hidden
          accept='image/*'
        />
        <img
          onClick={() => fileRef.current.click()}
          src={formData.avatar || currentUser.avatar}
          alt='profile'
          className='rounded-full h-24 w-24 object-cover cursor-pointer self-center mt-2'
        />
        <p className='text-sm self-center'>
          {fileUploadError ? (
            <span className='text-red-700'>
              Error Image upload (image must be less than 2 mb)
            </span>
          ) : filePerc > 0 && filePerc < 100 ? (
            <span className='text-slate-700'>{`Uploading ${filePerc}%`}</span>
          ) : filePerc === 100 ? (
            <span className='text-green-700'>Image successfully uploaded!</span>
          ) : (
            ''
          )}
        </p>
        <input
          type='text'
          placeholder='username'
          defaultValue={currentUser.username}
          id='username'
          className='border p-3 rounded-lg'
          onChange={handleChange}
        />
        <input
          type='email'
          placeholder='email'
          id='email'
          defaultValue={currentUser.email}
          className='border p-3 rounded-lg'
          onChange={handleChange}
        />
        <input
          type='password'
          placeholder='password'
          onChange={handleChange}
          id='password'
          className='border p-3 rounded-lg'
        />
        <button
          disabled={loading}
          className='bg-slate-700 text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80'
        >
          {loading ? 'Loading...' : 'Update'}
        </button>
        <Link
          className='bg-green-700 text-white p-3 rounded-lg uppercase text-center hover:opacity-95'
          to={'/create-listing'}
        >
          Create Listing
        </Link>
      </form>
      <div className='flex justify-between mt-5'>
        <span
          onClick={handleDeleteUser}
          className='text-red-700 cursor-pointer'
        >
          Delete account
        </span>

          <span onClick={handleButtonClick} className={currentUser.twoFAEnabled ? 'text-red-700 cursor-pointer' : 'text-green-700 cursor-pointer'}>
            {currentUser.twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
        </span>


        <span onClick={handleSignout} className='text-red-700 cursor-pointer'>
          Sign out
        </span>
      </div>

      <p className='text-red-700 mt-5'>{error ? error : ''}</p>
      <p className='text-green-700 mt-5'>
        {updateSuccess ? 'User is updated successfully!' : ''}
      </p>
      <button onClick={handleShowListings} className='text-green-700 w-full'>
        Show Listings
      </button>
      <p className='text-red-700 mt-5'>
        {showListingsError ? 'Error showing listings' : ''}
      </p>

      {userListings && userListings.length > 0 && (
        <div className='flex flex-col gap-4'>
          <h1 className='text-center mt-7 text-2xl font-semibold'>
            Your Listings
          </h1>
          {userListings.map((listing) => (
            <div
              key={listing._id}
              className='border rounded-lg p-3 flex justify-between items-center gap-4'
            >
              <Link to={`/listing/${listing._id}`}>
                <img
                  src={listing.imageUrls[0]}
                  alt='listing cover'
                  className='h-16 w-16 object-contain'
                />
              </Link>
              <Link
                className='text-slate-700 font-semibold  hover:underline truncate flex-1'
                to={`/listing/${listing._id}`}
              >
                <p>{listing.name}</p>
              </Link>

              <div className='flex flex-col item-center'>
                <button
                  onClick={() => handleListingDelete(listing._id)}
                  className='text-red-700 uppercase'
                >
                  Delete
                </button>
                <Link to={`/update-listing/${listing._id}`}>
                  <button className='text-green-700 uppercase'>Edit</button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
